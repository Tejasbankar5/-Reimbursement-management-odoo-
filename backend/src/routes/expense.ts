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

    const { data } = await tesseract.recognize(req.file.path, 'eng');
    const text = data.text;
    const overallConfidence = data.confidence;

    // Extract amount from OCR text
    const amountMatch = text.match(/\$?\s*(\d{1,6}(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const amountConfidence = amountMatch ? Math.min(overallConfidence + 5, 99) : 40;

    // Keyword match for category
    let category = 'Other';
    const lowerText = text.toLowerCase();
    let catConfidence = 50;
    if (lowerText.includes('flight') || lowerText.includes('hotel') || lowerText.includes('airbnb')) { category = 'Travel'; catConfidence = 95; }
    else if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('lyft')) { category = 'Transport'; catConfidence = 92; }
    else if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('cafe')) { category = 'Meals'; catConfidence = 90; }

    // Date extraction basic regex
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    const dateConfidence = dateMatch ? Math.min(overallConfidence + 2, 98) : 50;

    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({
      ocrText: text,
      suggestedAmount: { value: amount, confidence: Math.round(amountConfidence) },
      suggestedCategory: { value: category, confidence: Math.round(catConfidence) },
      suggestedDate: { value: date, confidence: Math.round(dateConfidence) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze Expense (Risk & Fraud) Before Submission
router.post('/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, originalCurrency, category, date } = req.body;

    const company = await Company.findByPk(user.companyId) as any;
    let convertedAmount = parseFloat(amount || 0);

    if (originalCurrency && originalCurrency !== company?.baseCurrency) {
      try {
        const rateRes = await axios.get(`https://api.exchangerate-api.com/v4/latest/${originalCurrency}`);
        const rate = rateRes.data.rates[company.baseCurrency];
        if (rate) convertedAmount = parseFloat(amount) * rate;
      } catch (err) {}
    }

    let riskScore = 'LOW';
    let riskReasoning = 'Standard expense within limits.';
    let fraudWarning = false;

    if (category === 'Travel' && convertedAmount > 10000) {
      riskScore = 'HIGH';
      riskReasoning = 'High Risk: Travel expense > 10,000 requires multiple approvals.';
    } else if (category === 'Meals' && convertedAmount > 5000) {
      riskScore = 'HIGH';
      riskReasoning = 'High Risk: Meals expense > 5,000 is usually prohibited.';
    } else if (convertedAmount > 5000) {
      riskScore = 'MEDIUM';
      riskReasoning = 'Medium Risk: Expense > 5,000.';
    }

    // Fraud / Duplicate Check
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);

    const duplicate = await Expense.findOne({
      where: {
        userId: user.id,
        amount: parseFloat(amount),
        category,
        date: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    if (duplicate) {
      fraudWarning = true;
      riskScore = 'HIGH';
      riskReasoning += ' Fraud Alert: Similar expense submitted recently (Same day, amount, and category).';
    }

    res.json({ riskScore, riskReasoning, fraudWarning });
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

    const dateObj = new Date(date);
    
    // Quick risk calc internally
    let riskScore = 'LOW';
    let riskReasoning = 'Standard expense within limits.';
    if (category === 'Travel' && convertedAmount > 10000) { riskScore = 'HIGH'; riskReasoning = 'High Risk: Travel expense > 10,000.'; }
    else if (category === 'Meals' && convertedAmount > 5000) { riskScore = 'HIGH'; riskReasoning = 'High Risk: Meals expense > 5,000.'; }
    else if (convertedAmount > 5000) { riskScore = 'MEDIUM'; riskReasoning = 'Medium Risk: Expense > 5,000.'; }

    const duplicate = await Expense.findOne({
      where: {
        userId: user.id,
        amount: parseFloat(amount),
        category,
        date: {
          [Op.gte]: new Date(dateObj.setHours(0,0,0,0)),
          [Op.lt]: new Date(dateObj.setHours(23,59,59,999))
        }
      }
    });

    const isFraud = !!duplicate;
    if (isFraud) {
      riskScore = 'HIGH';
      riskReasoning += ' Fraud Alert: Similar expense submitted recently.';
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
      currentStepIndex: 0,
      riskScore,
      riskReasoning,
      fraudWarning: isFraud,
      explanation: 'Submitted and pending initial routing.'
    }) as any;

    // Call intelligent engine to route to first step
    const { routeToStep } = require('../engine');
    const successfullyRouted = await routeToStep(newExpense, 0);

    if (!successfullyRouted) {
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        // Admin/Manager submitting with no workflow -> Auto-approve
        await newExpense.update({ status: 'APPROVED', explanation: 'Auto-approved due to role seniority (No workflow configured).' });
      } else {
        await newExpense.update({ explanation: 'Pending generic manual review (No approver found).' });
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
