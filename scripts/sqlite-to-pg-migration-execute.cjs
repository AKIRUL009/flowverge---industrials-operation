const Database = require('better-sqlite3');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 1,
});

const sqlite = new Database('flowverge.db', { readonly: true });

const MIGRATION_ORDER = [
  'roles', 'users', 'stages', 'warehouse_materials', 'checklist_templates', 'integrations', 'system_settings',
  'sites', 'checklist_items',
  'stage_history', 'checklist_responses', 'tasks', 'safety_logs', 'ai_problems',
  'checklist_answers', 'photos', 'warehouse_transactions', 'logs', 'messages', 'notifications', 'approvals', 'ai_solutions',
  'reports_ai_weekly'
];

async function run() {
  console.log('==================================================');
  console.log('SQLITE -> POSTGRESQL MIGRATION EXECUTE');
  console.log('==================================================');

  const client = await pool.connect();
  let hasErrors = false;
  
  try {
    await client.query('BEGIN');
    
    // First temporarily disable foreign key checks or just insert in order
    // Postgres doesn't have a simple global disable FK switch for non-superusers, 
    // but we can set constraints deferred if they are deferrable.
    // However, inserting in correct order should avoid FK issues.
    
    for (const table of MIGRATION_ORDER) {
      console.log(`\n--- Migrating Table: ${table} ---`);
      
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      console.log(`Read ${rows.length} rows from SQLite.`);
      
      if (rows.length === 0) continue;
      
      // Clean and map data
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          // Convert date strings to actual timestamp strings if needed
          if (row[key] && typeof row[key] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(row[key])) {
             row[key] = row[key] + 'Z';
          }
        }
        
        const cols = Object.keys(row);
        const vals = Object.values(row);
        
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO "${table}" ("${cols.join('", "')}") VALUES (${placeholders})`;
        
        await client.query(query, vals);
      }
      
      // Update sequence for the table
      const hasId = Object.keys(rows[0]).includes('id');
      if (hasId) {
         try {
             await client.query(`SELECT setval('"${table}_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`);
             console.log(`Updated sequence for ${table}`);
         } catch(e) {
             console.warn(`Could not update sequence for ${table}:`, e.message);
         }
      }
    }

    await client.query('COMMIT');
    console.log('\n==================================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY');
  } catch(e) {
    await client.query('ROLLBACK');
    hasErrors = true;
    console.error('MIGRATION FAILED:', e);
  } finally {
    client.release();
    process.exit(hasErrors ? 1 : 0);
  }
}

run();
