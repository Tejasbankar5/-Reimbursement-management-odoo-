import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../db';

export class Company extends Model {}
Company.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: true },
  baseCurrency: { type: DataTypes.STRING, defaultValue: 'USD' }
}, { sequelize, modelName: 'Company', tableName: 'Companies' });

export class User extends Model {}
User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('ADMIN', 'MANAGER', 'EMPLOYEE'), defaultValue: 'EMPLOYEE' },
  companyId: { type: DataTypes.UUID, allowNull: true },
  managerId: { type: DataTypes.UUID, allowNull: true }
}, { sequelize, modelName: 'User', tableName: 'Users' });

export class Workflow extends Model {}
Workflow.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  companyId: { type: DataTypes.UUID, allowNull: false }
}, { sequelize, modelName: 'Workflow', tableName: 'Workflows' });

export class WorkflowStep extends Model {}
WorkflowStep.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  sequenceIndex: { type: DataTypes.INTEGER, allowNull: false },
  approverId: { type: DataTypes.UUID, allowNull: true },
  approverRole: { type: DataTypes.ENUM('ADMIN', 'MANAGER', 'EMPLOYEE'), allowNull: true },
  ruleType: { type: DataTypes.ENUM('SEQUENCE', 'PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID'), defaultValue: 'SEQUENCE' },
  ruleValue: { type: DataTypes.STRING, allowNull: true },
  workflowId: { type: DataTypes.UUID, allowNull: false }
}, { sequelize, modelName: 'WorkflowStep', tableName: 'WorkflowSteps' });

export class Expense extends Model {}
Expense.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  companyId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  originalCurrency: { type: DataTypes.STRING, defaultValue: 'USD' },
  convertedAmount: { type: DataTypes.FLOAT, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  receiptUrl: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
  currentStepIndex: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, modelName: 'Expense', tableName: 'Expenses' });

export class ExpenseApproval extends Model {}
ExpenseApproval.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expenseId: { type: DataTypes.UUID, allowNull: false },
  approverId: { type: DataTypes.UUID, allowNull: false },
  stepIndex: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
  comments: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: 'ExpenseApproval', tableName: 'ExpenseApprovals' });

// Relationships
Company.hasMany(User, { foreignKey: 'companyId' });
User.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(User, { as: 'employees', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

Company.hasMany(Workflow, { foreignKey: 'companyId' });
Workflow.belongsTo(Company, { foreignKey: 'companyId' });

Workflow.hasMany(WorkflowStep, { foreignKey: 'workflowId' });
WorkflowStep.belongsTo(Workflow, { foreignKey: 'workflowId' });

User.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(User, { foreignKey: 'userId' });

Company.hasMany(Expense, { foreignKey: 'companyId' });
Expense.belongsTo(Company, { foreignKey: 'companyId' });

Expense.hasMany(ExpenseApproval, { foreignKey: 'expenseId', as: 'approvals' });
ExpenseApproval.belongsTo(Expense, { foreignKey: 'expenseId' });

User.hasMany(ExpenseApproval, { foreignKey: 'approverId' });
ExpenseApproval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

export const syncDb = async () => {
  await sequelize.sync({ alter: true });
  console.log('✅ Database Synced');
};

export { Op };
