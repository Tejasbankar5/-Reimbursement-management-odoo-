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
      // Small optimization: an early reject might not kill a percentage rule if others can pass. But we let engine check it.
    }

    const { checkStepResolution, routeToStep } = require('../engine');
    const resolution = await checkStepResolution(expense, approval.stepIndex);

    if (resolution.resolved) {
      if (resolution.approved) {
        // Step passed! Route to next step
        const nextStepIndex = (approval.stepIndex as number) + 1;
        const successfullyRouted = await routeToStep(expense, nextStepIndex);

        if (successfullyRouted) {
          await expense.update({ currentStepIndex: nextStepIndex, explanation: resolution.explanation });
          return res.json({ message: `Step ${approval.stepIndex} approved — routed to next approver(s)` });
        } else {
          // No more steps
          await expense.update({ status: 'APPROVED', explanation: resolution.explanation || '✅ Expense fully approved!' });
          return res.json({ message: '✅ Expense fully approved!' });
        }
      } else {
        await expense.update({ status: 'REJECTED', explanation: resolution.explanation || '❌ Expense rejected' });
        return res.json({ message: `Expense rejected: ${resolution.explanation}` });
      }
    } else {
      // Step not yet resolved (e.g. waiting for more people in PERCENTAGE rule)
      return res.json({ message: 'Approval recorded. Waiting for additional approvers.' });
    }
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
