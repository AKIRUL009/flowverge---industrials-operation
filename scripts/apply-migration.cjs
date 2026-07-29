const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

async function apply() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../drizzle/0000_condemned_human_robot.sql'), 'utf-8');
    await pool.query(sql);
    
    // Also grant ALL PRIVILEGES to the app user on all tables in public schema
    await pool.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.SQL_USER};`);
    await pool.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${process.env.SQL_USER};`);
    
    console.log('Migration applied successfully, privileges granted.');
    process.exit(0);
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  }
}
apply();
