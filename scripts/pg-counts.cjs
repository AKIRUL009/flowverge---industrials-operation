const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});
async function check() {
  const tables = ['roles', 'users', 'stages', 'sites', 'checklist_templates', 'checklist_items', 'warehouse_materials', 'logs', 'integrations'];
  for (const table of tables) {
    const res = await pool.query(`SELECT count(*) as c FROM ${table}`);
    console.log(`${table}: ${res.rows[0].c}`);
  }
  process.exit(0);
}
check();
