const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in PG:', res.rows.map(r => r.table_name));
    
    // Check row counts
    const counts = {};
    for (const row of res.rows) {
       const countRes = await pool.query(`SELECT count(*) as c FROM "${row.table_name}"`);
       counts[row.table_name] = countRes.rows[0].c;
    }
    console.log('Row counts:', counts);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
