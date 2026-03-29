import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { Expense, ExpenseApproval, Workflow, WorkflowStep, User } from '../models';

const router = Router();

// Review an expense approval (Approve or Reject)
router.post('/:id/review', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, comments } = req.body;
    const approvalId = req.params.id as string;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'status must be APPROVED or REJECTED' });
    }

    // Find the pending approval assigned to this user
    const approval = await ExpenseApproval.findOne({
      where: { id: approvalId, approverId: user.id, status: 'PENDING' }
    }) as any;

    if (!approval) {
      return res.status(404).json({ error: 'Pending approval not found or you are not the assigned approver' });
    }

    const expense = await Expense.findByPk(approval.expenseId) as any;
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Save this approval decision
    await approval.update({ status, comments: comments || null });

    if (status === 'REJECTED') {
      await expense.update({ status: 'REJECTED' });
      return res.json({ message: 'Expense rejected' });
    }

    // ── APPROVED — check if there is a next step ─────────────────────────────
    const activeWorkflow = await Workflow.findOne({
      where: { companyId: expense.companyId, isActive: true }
    }) as any;

    if (activeWorkflow) {
      const nextStepIndex = (approval.stepIndex as number) + 1;

      const nextStep = await WorkflowStep.findOne({
        where: { workflowId: activeWorkflow.id, sequenceIndex: nextStepIndex },
        order: [['sequenceIndex', 'ASC']]
      }) as any;

      if (nextStep) {
        // Resolve who the next approver is
        let nextApproverId: string | null = nextStep.approverId || null;

        if (!nextApproverId && nextStep.approverRole === 'ADMIN') {
          // Find the company Admin as the next approver (Director)
          const adminUser = await User.findOne({
            where: { companyId: expense.companyId, role: 'ADMIN' }
          }) as any;
          if (adminUser) nextApproverId = adminUser.id;
        } else if (!nextApproverId && nextStep.approverRole === 'MANAGER') {
          // Fallback: route to employee's manager
          const submitter = await User.findByPk(expense.userId) as any;
          if (submitter?.managerId) nextApproverId = submitter.managerId;
        }

        if (nextApproverId) {
          await ExpenseApproval.create({
            expenseId: expense.id,
            stepIndex: nextStepIndex,
            approverId: nextApproverId,
            status: 'PENDING'
          });
          // Update which step the expense is on
          await expense.update({ currentStepIndex: nextStepIndex });
          return res.json({
            message: `Step ${approval.stepIndex} approved — routed to next approver (Step ${nextStepIndex})`
          });
        }
      }
    }

    // No more steps — fully approved
    await expense.update({ status: 'APPROVED' });
    res.json({ message: '✅ Expense fully approved!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my pending approvals list
router.get('/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const approvals = await ExpenseApproval.findAll({
      where: { approverId: user.id, status: 'PENDING' }
    });
    res.json(approvals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
