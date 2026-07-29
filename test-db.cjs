const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

pool.query('SELECT 1 as result')
  .then(res => {
    console.log('PostgreSQL Connected successfully:', res.rows);
    process.exit(0);
  })
  .catch(err => {
    console.error('PostgreSQL Connection error:', err);
    process.exit(1);
  });
