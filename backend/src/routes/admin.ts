import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../middleware/auth';
import { User, Workflow, WorkflowStep, Expense, ExpenseApproval } from '../models';

const router = Router();

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────

// Create new Employee / Manager (Admin only)
router.post('/users', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { email, name, role, managerId, password } = req.body;
    const companyId = (req as any).companyId;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'email, name, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userPayload: any = {
      email, name,
      role: role || 'EMPLOYEE',
      companyId,
      passwordHash: hashedPassword
    };

    if (managerId && managerId.trim() !== '') {
      userPayload.managerId = managerId;
    }

    const newUser = await User.create(userPayload);
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Manager Relationship
router.put('/users/:id/manager', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { managerId } = req.body;
    const userId = req.params.id as string;
    const userToUpdate = await User.findByPk(userId);
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });
    await userToUpdate.update({ managerId: managerId || null });
    res.json({ message: 'Manager relationship updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all users in the company
router.get('/users', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const users = await User.findAll({
      where: { companyId },
      attributes: ['id', 'name', 'email', 'role', 'managerId'],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WORKFLOW MANAGEMENT ────────────────────────────────────────────────────

router.post('/workflows', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { name, steps } = req.body;
    const companyId = (req as any).companyId;

    if (!name) return res.status(400).json({ error: 'Workflow name is required' });

    // Deactivate existing workflows
    await Workflow.update({ isActive: false } as any, { where: { companyId } });

    const workflow = await Workflow.create({ companyId, name, isActive: true }) as any;

    if (steps && steps.length > 0) {
      for (const step of steps) {
        await WorkflowStep.create({
          workflowId: workflow.id,
          sequenceIndex: step.sequenceIndex,
          ruleType: step.ruleType || 'SEQUENCE',
          ruleValue: step.ruleValue ? String(step.ruleValue) : null,
          approverId: step.approverId || null,
          approverRole: step.approverRole || null
        });
      }
    }

    res.status(201).json({ message: 'Workflow created and activated', workflowId: workflow.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPENSE OVERVIEW & STATS ────────────────────────────────────────────────

// Get all expenses with stats for Admin dashboard
router.get('/expenses', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;

    const expenses = await Expense.findAll({
      where: { companyId },
      include: [
        {
          model: ExpenseApproval,
          as: 'approvals',
          include: [{
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email', 'role']
          }] as any
        },
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role'],
          as: undefined
        } as any
      ],
      order: [['createdAt', 'DESC']]
    } as any);

    const total = expenses.length;
    const approved = expenses.filter((e: any) => e.status === 'APPROVED').length;
    const rejected = expenses.filter((e: any) => e.status === 'REJECTED').length;
    const pending = expenses.filter((e: any) => e.status === 'PENDING').length;

    res.json({ expenses, stats: { total, approved, rejected, pending } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN OVERRIDE ──────────────────────────────────────────────────────────

// Admin can force approve or reject any expense
router.post('/expenses/:id/override', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { status, comments } = req.body;
    const expenseId = req.params.id as string;
    const admin = (req as any).user;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'status must be APPROVED or REJECTED' });
    }

    const expense = await Expense.findByPk(expenseId) as any;
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (expense.companyId !== admin.companyId) {
      return res.status(403).json({ error: 'Access denied — expense belongs to another company' });
    }

    // Force status override — bypasses workflow
    await expense.update({ status });

    // Create an override approval record for audit trail
    await ExpenseApproval.create({
      expenseId: expense.id,
      stepIndex: 999, // sentinel value indicating admin override
      approverId: admin.id,
      status,
      comments: comments || `Admin override by ${admin.name}`
    });

    res.json({ message: `Expense ${status.toLowerCase()} by Admin override`, expenseId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SELF-HEALING SYSTEM ──────────────────────────────────────────────────
router.post('/system/self-heal', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const companyId = admin.companyId;

    // Find all PENDING approvals assigned to Managers or Employees
    const staleApprovals = await ExpenseApproval.findAll({
      where: { status: 'PENDING' },
      include: [
        { model: Expense, where: { companyId, status: 'PENDING' } },
        { model: User, as: 'approver', where: { role: 'MANAGER' } }
      ]
    }) as any[];

    if (staleApprovals.length === 0) {
      return res.json({ message: 'No stale approvals found to heal.' });
    }

    let escalatedCount = 0;
    for (const approval of staleApprovals) {
      // Re-assign to the admin who triggered this (or company admin)
      await approval.update({
        approverId: admin.id,
        explanation: 'System Self-Heal: Escalated to Admin due to SLA breach (48h timeout simulated).'
      });
      escalatedCount++;
    }

    res.json({ message: `Successfully escalated ${escalatedCount} stale approval(s) to Director/Admin.`, healedCount: escalatedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
