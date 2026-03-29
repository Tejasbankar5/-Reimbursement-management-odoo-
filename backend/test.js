const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function reseedWorkflow() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'root',
    database: 'odoo_reimbursement', port: 3306
  });

  const [[admin]] = await connection.query("SELECT id, companyId FROM Users WHERE role = 'ADMIN' LIMIT 1");
  const companyId = admin.companyId;

  // Delete all existing workflows and steps
  await connection.query("DELETE FROM WorkflowSteps WHERE 1=1");
  await connection.query("DELETE FROM Workflows WHERE 1=1");
  console.log('🗑️  Cleared old workflows');

  // Create new 2-step workflow
  const workflowId = crypto.randomUUID();
  await connection.query(
    "INSERT INTO Workflows (id, name, companyId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, NOW(), NOW())",
    [workflowId, 'Manager → Director Approval', companyId]
  );
  console.log('✅ Created workflow: "Manager → Director Approval"');

  // Step 0: Manager approval
  await connection.query(
    "INSERT INTO WorkflowSteps (id, workflowId, sequenceIndex, ruleType, approverRole, approverId, ruleValue, createdAt, updatedAt) VALUES (?, ?, 0, 'SEQUENCE', 'MANAGER', NULL, NULL, NOW(), NOW())",
    [crypto.randomUUID(), workflowId]
  );
  console.log('✅ Step 0: Manager must approve first');

  // Step 1: Admin (Director) approval
  await connection.query(
    "INSERT INTO WorkflowSteps (id, workflowId, sequenceIndex, ruleType, approverRole, approverId, ruleValue, createdAt, updatedAt) VALUES (?, ?, 1, 'SEQUENCE', 'ADMIN', NULL, NULL, NOW(), NOW())",
    [crypto.randomUUID(), workflowId]
  );
  console.log('✅ Step 1: Admin (Director) must approve second');

  // Also clear any old expenses/approvals so we start fresh
  await connection.query("DELETE FROM ExpenseApprovals WHERE 1=1");
  await connection.query("DELETE FROM Expenses WHERE 1=1");
  console.log('🗑️  Cleared old expenses & approvals for a clean test');

  const [steps] = await connection.query("SELECT sequenceIndex, approverRole FROM WorkflowSteps WHERE workflowId = ? ORDER BY sequenceIndex", [workflowId]);
  console.log('\nWorkflow steps:', steps);
  await connection.end();
}

reseedWorkflow().catch(console.error);
