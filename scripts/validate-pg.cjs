const { Pool } = require('pg');
const Database = require('better-sqlite3');

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

const sqlite = new Database('flowverge.db', { readonly: true });

const tables = [
  'roles', 'users', 'stages', 'warehouse_materials', 'checklist_templates', 'integrations', 'system_settings',
  'sites', 'checklist_items',
  'stage_history', 'checklist_responses', 'tasks', 'safety_logs', 'ai_problems',
  'checklist_answers', 'photos', 'warehouse_transactions', 'logs', 'messages', 'notifications', 'approvals', 'ai_solutions',
  'reports_ai_weekly'
];

async function validate() {
  console.log('--- MIGRATION ROW COUNT & SEQUENCE VALIDATION ---');
  for (const table of tables) {
    const pgRes = await pool.query(`SELECT count(*) as count FROM "${table}"`);
    const pgCount = parseInt(pgRes.rows[0].count);
    const sqCount = sqlite.prepare(`SELECT count(*) as count FROM ${table}`).get().count;
    
    let seqVal = 'N/A';
    try {
      const s = await pool.query(`SELECT last_value FROM "${table}_id_seq"`);
      seqVal = s.rows[0].last_value;
    } catch(e) {}
    
    console.log(`${table.padEnd(25)} | SQ: ${sqCount} | PG: ${pgCount} | MATCH: ${pgCount === sqCount ? 'YES' : 'NO'} | SEQ: ${seqVal}`);
  }
  
  // Content validation
  console.log('\n--- CONTENT VALIDATION (roles) ---');
  const sqRoles = sqlite.prepare(`SELECT * FROM roles ORDER BY id`).all();
  const pgRoles = (await pool.query(`SELECT * FROM roles ORDER BY id`)).rows;
  console.log(`Roles match: ${sqRoles.length === pgRoles.length && sqRoles[0].name === pgRoles[0].name ? 'YES' : 'NO'}`);
  
  console.log('\n--- AUTH VALIDATION (users) ---');
  const pgUsers = (await pool.query(`SELECT id, email, role_id FROM users WHERE email = 'akirulislam787@gmail.com'`)).rows;
  console.log('Firebase user found:', pgUsers.length > 0 ? 'YES' : 'NO', pgUsers[0] || '');

  process.exit(0);
}

validate();
