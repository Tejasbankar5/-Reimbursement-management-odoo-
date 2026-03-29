import { Router, Request, Response } from 'express';
import multer from 'multer';
import tesseract from 'tesseract.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { Expense, ExpenseApproval, Workflow, WorkflowStep, Company, User, Op } from '../models';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const upload = multer({ dest: uploadsDir });

// Process Receipt OCR
router.post('/ocr', requireAuth, upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { data: { text } } = await tesseract.recognize(req.file.path, 'eng');

    // Extract amount from OCR text
    const amountMatch = text.match(/\$?\s*(\d{1,6}(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Keyword match for category
    let category = 'Other';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('flight') || lowerText.includes('hotel') || lowerText.includes('airbnb')) category = 'Travel';
    else if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('lyft')) category = 'Transport';
    else if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('cafe')) category = 'Meals';

    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({ ocrText: text, suggestedAmount: amount, suggestedCategory: category });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Expense
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, originalCurrency, category, description, date, receiptUrl } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'amount, category, and date are required' });
    }

    const company = await Company.findByPk(user.companyId) as any;
    if (!company) return res.status(404).json({ error: 'Company not found' });

    let convertedAmount = parseFloat(amount);

    if (originalCurrency && originalCurrency !== company.baseCurrency) {
      try {
        const rateRes = await axios.get(`https://api.exchangerate-api.com/v4/latest/${originalCurrency}`);
        const rate = rateRes.data.rates[company.baseCurrency];
        if (rate) convertedAmount = parseFloat(amount) * rate;
      } catch (err) {
        console.warn('Currency conversion failed, using original amount');
      }
    }

    const newExpense = await Expense.create({
      userId: user.id,
      companyId: user.companyId,
      amount: parseFloat(amount),
      originalCurrency: originalCurrency || company.baseCurrency,
      convertedAmount,
      category,
      description,
      date: new Date(date),
      receiptUrl,
      status: 'PENDING',
      currentStepIndex: 0
    }) as any;

    // Check if an active workflow exists for the company
    const activeWorkflow = await Workflow.findOne({ where: { companyId: user.companyId, isActive: true } }) as any;

    if (activeWorkflow) {
      const firstStep = await WorkflowStep.findOne({
        where: { workflowId: activeWorkflow.id, sequenceIndex: 0 },
        order: [['sequenceIndex', 'ASC']]
      }) as any;

      if (firstStep) {
        let assignedApproverId: string | null = firstStep.approverId || null;

        // If first step requires a Manager approver, assign to employee's manager
        if (firstStep.approverRole === 'MANAGER' && !assignedApproverId) {
          if (user.managerId) {
            assignedApproverId = user.managerId;
          } else {
            // Fallback: find any manager in the company
            const anyManager = await User.findOne({
              where: { companyId: user.companyId, role: 'MANAGER' }
            }) as any;
            if (anyManager) {
              assignedApproverId = anyManager.id;
              console.info(`[Expense] Routed to company manager: ${anyManager.name}`);
            }
          }
        }

        if (assignedApproverId) {
          await ExpenseApproval.create({
            expenseId: newExpense.id,
            stepIndex: 0,
            approverId: assignedApproverId,
            status: 'PENDING'
          });
          // Expense stays PENDING until manager reviews
        } else {
          // Workflow exists but no approver at all — keep PENDING, never auto-approve
          console.warn(`[Expense ${newExpense.id}] No approver found. Keeping PENDING for manual review.`);
        }
      } else {
        // Workflow has no steps defined — keep PENDING (shouldn't happen in practice)
        console.warn(`[Expense ${newExpense.id}] Workflow has no steps. Keeping PENDING.`);
      }
    } else {
      // No workflow configured — try to route to manager anyway before giving up
      if (user.managerId) {
        await ExpenseApproval.create({
          expenseId: newExpense.id,
          stepIndex: 0,
          approverId: user.managerId,
          status: 'PENDING'
        });
        console.info(`[Expense] No workflow; routed directly to assigned manager.`);
      } else if (user.role === 'EMPLOYEE') {
        // Employee has no manager and no workflow — keep PENDING so admin can review
        console.warn(`[Expense ${newExpense.id}] Employee has no manager and no workflow. Keeping PENDING.`);
      } else {
        // Admin/Manager submitting their own expense with no workflow — auto-approve
        await newExpense.update({ status: 'APPROVED' });
      }
    }

    res.status(201).json(newExpense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Expenses (with approvals included)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let expenses;
    const includeApprovals = {
      model: ExpenseApproval,
      as: 'approvals',
      include: [{
        model: User,
        as: 'approver',
        attributes: ['id', 'name', 'email', 'role']
      }] as any
    };

    if (user.role === 'ADMIN') {
      expenses = await Expense.findAll({
        where: { companyId: user.companyId },
        include: [includeApprovals],
        order: [['createdAt', 'DESC']]
      });
    } else if (user.role === 'MANAGER') {
      // Get ALL expense IDs this manager has ANY approval record for (pending, approved, or rejected)
      const allManagerApprovals = await ExpenseApproval.findAll({
        where: { approverId: user.id },
        attributes: ['expenseId']
      }) as any[];
      const managerExpenseIds = allManagerApprovals.map((pa: any) => pa.expenseId);

      // Return own expenses + all expenses they have any involvement with
      expenses = await Expense.findAll({
        where: {
          [Op.or]: [
            { userId: user.id },
            ...(managerExpenseIds.length > 0 ? [{ id: { [Op.in]: managerExpenseIds } }] : [])
          ]
        },
        include: [includeApprovals],
        order: [['createdAt', 'DESC']]
      });
    } else {
      expenses = await Expense.findAll({
        where: { userId: user.id },
        include: [includeApprovals],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
