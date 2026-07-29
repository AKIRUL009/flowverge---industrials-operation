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

async function compare() {
  const tables = ['roles', 'users', 'stages', 'sites', 'checklist_templates', 'checklist_items', 'warehouse_materials', 'logs', 'integrations'];
  console.log("TABLE | PG (BACKUP REF) | CURRENT SQLITE | DIFFERENCE");
  for (const table of tables) {
    const pgRes = await pool.query(`SELECT count(*) as c FROM ${table}`);
    const pgCount = parseInt(pgRes.rows[0].c, 10);
    
    let sqCount = 0;
    try {
      const sqRes = sqlite.prepare(`SELECT count(*) as c FROM ${table}`).get();
      sqCount = sqRes.c;
    } catch(e) {
      sqCount = "ERROR";
    }
    
    const diff = pgCount - sqCount;
    console.log(`${table} | ${pgCount} | ${sqCount} | ${diff}`);
  }
  process.exit(0);
}
compare();
