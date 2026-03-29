import { Expense, ExpenseApproval, Workflow, WorkflowStep, User, Op } from './models';

/**
 * Intelligent Approval Engine
 * Provides the routing logic for advanced workflows including Percentage, Hybrid, and Specific Approver rules.
 */

export const routeToStep = async (expense: any, stepIndex: number): Promise<boolean> => {
  const activeWorkflow = await Workflow.findOne({
    where: { companyId: expense.companyId, isActive: true }
  }) as any;

  if (!activeWorkflow) {
    // Fallback if no workflow configured: direct manager, else auto-approve if manager missing
    const submitter = await User.findByPk(expense.userId) as any;
    if (submitter && submitter.managerId) {
      await ExpenseApproval.create({
        expenseId: expense.id, stepIndex, approverId: submitter.managerId, status: 'PENDING',
        explanation: 'Routed to direct manager as fallback.'
      });
      return true; // Routed successfully
    }
    return false; // No more steps
  }

  const step = await WorkflowStep.findOne({
    where: { workflowId: activeWorkflow.id, sequenceIndex: stepIndex }
  }) as any;

  if (!step) return false; // End of workflow

  const ruleType = step.ruleType || 'SEQUENCE';
  const role = step.approverRole; // ADMIN, MANAGER, EMPLOYEE
  const ruleValue = step.ruleValue; // e.g. "60" for percentage, or User ID for SPECIFIC_APPROVER

  if (ruleType === 'SPECIFIC_APPROVER') {
    if (ruleValue) {
      await ExpenseApproval.create({
        expenseId: expense.id, stepIndex, approverId: ruleValue, status: 'PENDING',
        explanation: 'Routed to specific mandatory approver.'
      });
      return true;
    }
  }

  if (ruleType === 'PERCENTAGE' || ruleType === 'HYBRID') {
    // Assign to ALL users of a specific role in the company
    const targets = await User.findAll({ where: { companyId: expense.companyId, role } }) as any[];
    if (targets.length === 0) return false;

    // Create a pending approval for every target
    for (const target of targets) {
      await ExpenseApproval.create({
        expenseId: expense.id, stepIndex, approverId: target.id, status: 'PENDING',
        explanation: `Assigned as part of a ${ruleType} rule (requires group consensus).`
      });
    }
    return true;
  }

  // Default 'SEQUENCE' (Single Approver based on role)
  let nextApproverId: string | null = step.approverId || null;

  if (!nextApproverId && role === 'ADMIN') {
    const adminUser = await User.findOne({ where: { companyId: expense.companyId, role: 'ADMIN' } }) as any;
    if (adminUser) nextApproverId = adminUser.id;
  } else if (!nextApproverId && role === 'MANAGER') {
    const submitter = await User.findByPk(expense.userId) as any;
    if (submitter?.managerId) nextApproverId = submitter.managerId;
    else {
      const anyManager = await User.findOne({ where: { companyId: expense.companyId, role: 'MANAGER' } }) as any;
      if (anyManager) nextApproverId = anyManager.id;
    }
  }

  if (nextApproverId) {
    await ExpenseApproval.create({
      expenseId: expense.id, stepIndex, approverId: nextApproverId, status: 'PENDING',
      explanation: `Standard sequence assigned to ${role}.`
    });
    return true;
  }

  return false;
};

export const checkStepResolution = async (expense: any, stepIndex: number): Promise<{ resolved: boolean, approved: boolean, explanation?: string }> => {
  const activeWorkflow = await Workflow.findOne({ where: { companyId: expense.companyId, isActive: true } }) as any;
  if (!activeWorkflow) {
    // Fallback: if single approver approved it, it's done
    const approvals = await ExpenseApproval.findAll({ where: { expenseId: expense.id, stepIndex } }) as any[];
    if (approvals.some(a => a.status === 'REJECTED')) return { resolved: true, approved: false, explanation: 'Rejected by fallback manager.' };
    if (approvals.some(a => a.status === 'APPROVED')) return { resolved: true, approved: true, explanation: 'Approved by fallback manager.' };
    return { resolved: false, approved: false };
  }

  const step = await WorkflowStep.findOne({ where: { workflowId: activeWorkflow.id, sequenceIndex: stepIndex } }) as any;
  if (!step) return { resolved: true, approved: true, explanation: 'No steps found.' };

  const approvals = await ExpenseApproval.findAll({ where: { expenseId: expense.id, stepIndex } }) as any[];
  const total = approvals.length;
  if (total === 0) return { resolved: false, approved: false };

  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length;
  
  const ruleType = step.ruleType || 'SEQUENCE';
  const ruleValue = step.ruleValue;

  if (ruleType === 'SEQUENCE' || ruleType === 'SPECIFIC_APPROVER') {
    // Any rejection kills it. Any approval passes it (since there is only 1 assignee typically)
    if (rejectedCount > 0) return { resolved: true, approved: false, explanation: 'Rejected by assigned approver.' };
    if (approvedCount > 0) return { resolved: true, approved: true, explanation: 'Approved by assigned approver.' };
    return { resolved: false, approved: false };
  }

  if (ruleType === 'PERCENTAGE') {
    const requiredPercent = parseFloat(ruleValue || '50');
    const currentPercent = (approvedCount / total) * 100;
    
    // Check if impossible to pass
    const remaining = total - (approvedCount + rejectedCount);
    if (((approvedCount + remaining) / total) * 100 < requiredPercent) {
      return { resolved: true, approved: false, explanation: `Rejected because it cannot mathematically meet the ${requiredPercent}% requirement.` };
    }
    
    if (currentPercent >= requiredPercent) {
      return { resolved: true, approved: true, explanation: `Approved because ${approvedCount}/${total} (${Math.round(currentPercent)}%) satisfied ${requiredPercent}% rule.` };
    }
  }

  if (ruleType === 'HYBRID') {
    // Example Hybrid: Requires 50% OR a specific ID overrides
    // Actually, hybrid could mean "Requires Manager AND Admin" but that's just SEQUENCE.
    // Let's implement Hybrid as "Approve if 60% OR if CEO approves".
    // We will assume ruleValue contains the specific ID that can override.
    const ceoOverride = approvals.find(a => a.approverId === ruleValue && a.status === 'APPROVED');
    if (ceoOverride) {
      return { resolved: true, approved: true, explanation: 'Approved via Executive Override (Hybrid Rule).' };
    }
    
    // Fallback to percentage 50%
    const requiredPercent = 50;
    const currentPercent = (approvedCount / total) * 100;
    if (currentPercent >= requiredPercent) {
      return { resolved: true, approved: true, explanation: `Approved by ${requiredPercent}% majority (Hybrid Rule).` };
    }
    
    const remaining = total - (approvedCount + rejectedCount);
    if (((approvedCount + remaining) / total) * 100 < requiredPercent && !ceoOverride) {
      // Check if CEO has already rejected
      const ceoAssigned = approvals.find(a => a.approverId === ruleValue);
      if (ceoAssigned && ceoAssigned.status === 'REJECTED') {
         return { resolved: true, approved: false, explanation: 'Executive rejected and majority unachievable.' };
      }
      if (!ceoAssigned || ceoAssigned.status !== 'PENDING') {
         return { resolved: true, approved: false, explanation: 'Majority unachievable.' };
      }
    }
  }

  return { resolved: false, approved: false };
};
