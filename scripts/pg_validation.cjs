const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

async function validate() {
  const tables = ['roles', 'users', 'stages', 'sites', 'checklist_templates', 'checklist_items', 'warehouse_materials', 'logs', 'integrations'];
  console.log("TABLE | ROW COUNT | MIN ID | MAX ID");
  for (const table of tables) {
    const res = await pool.query(`SELECT count(*) as c, min(id) as min_id, max(id) as max_id FROM ${table}`);
    console.log(`${table} | ${res.rows[0].c} | ${res.rows[0].min_id || 'N/A'} | ${res.rows[0].max_id || 'N/A'}`);
  }
  const userRes = await pool.query(`SELECT email, role_id, status FROM users WHERE email = 'akirulislam787@gmail.com'`);
  console.log("TEST USER:");
  console.log(userRes.rows);
  
  process.exit(0);
}
validate();
