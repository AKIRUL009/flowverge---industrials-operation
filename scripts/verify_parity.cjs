const { Pool } = require('pg');
const Database = require('better-sqlite3');
const fs = require('fs');

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

const sqlite = new Database('flowverge.db', { readonly: true });

async function verify() {
  const tables = [
    'roles', 'users', 'stages', 'sites', 'stage_history', 
    'checklist_templates', 'checklist_items', 'checklist_responses', 
    'checklist_answers', 'photos', 'warehouse_materials', 
    'warehouse_transactions', 'ai_problems', 'ai_solutions', 
    'approvals', 'notifications', 'logs', 'tasks', 'messages', 
    'system_settings', 'safety_logs', 'reports_ai_weekly', 'integrations'
  ];
  
  let matchCount = 0;
  console.log("TABLE | POSTGRESQL COUNT | CURRENT flowverge.db COUNT | MATCH");
  for (const table of tables) {
    const pgRes = await pool.query(`SELECT count(*) as c FROM ${table}`);
    const pgCount = parseInt(pgRes.rows[0].c, 10);
    
    let sqCount = -1;
    try {
      const sqRes = sqlite.prepare(`SELECT count(*) as c FROM ${table}`).get();
      sqCount = sqRes.c;
    } catch(e) {
      sqCount = "ERROR";
    }
    
    const match = pgCount === sqCount ? 'YES' : 'NO';
    if (match === 'YES') matchCount++;
    console.log(`${table} | ${pgCount} | ${sqCount} | ${match}`);
  }
  console.log(`\nParity: ${matchCount}/${tables.length} MATCH`);
  process.exit(0);
}
verify();
