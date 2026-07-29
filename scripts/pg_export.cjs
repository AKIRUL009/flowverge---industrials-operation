const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

async function exportPg() {
  const tables = ['roles', 'users', 'stages', 'sites', 'stage_history', 'checklist_templates', 'checklist_items', 'checklist_responses', 'checklist_answers', 'photos', 'warehouse_materials', 'warehouse_transactions', 'ai_problems', 'ai_solutions', 'approvals', 'notifications', 'logs', 'tasks', 'messages', 'system_settings', 'safety_logs', 'reports_ai_weekly', 'integrations'];
  const snapshot = {};
  for (const table of tables) {
    const res = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
    snapshot[table] = res.rows;
  }
  fs.writeFileSync('pg_recovery_snapshot.json', JSON.stringify(snapshot, null, 2));
  console.log("Exported successfully.");
  process.exit(0);
}
exportPg();
