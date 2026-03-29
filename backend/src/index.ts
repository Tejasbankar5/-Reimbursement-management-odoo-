import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { syncDb } from './models';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import expenseRoutes from './routes/expense';
import approvalRoutes from './routes/approval';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Reimbursement API running' });
});

const PORT = process.env.PORT || 5000;

syncDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}).catch((err: Error) => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});
