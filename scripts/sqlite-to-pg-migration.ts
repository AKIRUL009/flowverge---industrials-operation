import Database from 'better-sqlite3';
import { pool, db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';

const DRY_RUN = process.env.MIGRATION_MODE !== 'EXECUTE';

console.log('==================================================');
console.log('SQLITE -> POSTGRESQL MIGRATION TOOL');
console.log(`MODE: ${DRY_RUN ? 'DRY RUN (READ ONLY)' : 'EXECUTE (WRITING TO POSTGRES)'}`);
console.log('==================================================');

const sqlite = new Database('flowverge.db', { readonly: true });

const MIGRATION_ORDER = [
  { table: 'roles', schemaTable: schema.roles },
  { table: 'users', schemaTable: schema.users },
  { table: 'stages', schemaTable: schema.stages },
  { table: 'sites', schemaTable: schema.sites },
  { table: 'stage_history', schemaTable: schema.stageHistory },
  { table: 'checklist_templates', schemaTable: schema.checklistTemplates },
  { table: 'checklist_items', schemaTable: schema.checklistItems },
  { table: 'checklist_responses', schemaTable: schema.checklistResponses },
  { table: 'checklist_answers', schemaTable: schema.checklistAnswers },
  { table: 'photos', schemaTable: schema.photos },
  { table: 'warehouse_materials', schemaTable: schema.warehouseMaterials },
  { table: 'warehouse_transactions', schemaTable: schema.warehouseTransactions },
  { table: 'ai_problems', schemaTable: schema.aiProblems },
  { table: 'ai_solutions', schemaTable: schema.aiSolutions },
  { table: 'approvals', schemaTable: schema.approvals },
  { table: 'notifications', schemaTable: schema.notifications },
  { table: 'logs', schemaTable: schema.logs },
  { table: 'tasks', schemaTable: schema.tasks },
  { table: 'messages', schemaTable: schema.messages },
  { table: 'system_settings', schemaTable: schema.systemSettings },
  { table: 'safety_logs', schemaTable: schema.safetyLogs },
  { table: 'reports_ai_weekly', schemaTable: schema.reportsAiWeekly },
  { table: 'integrations', schemaTable: schema.integrations }
];

async function run() {
  let hasErrors = false;
  
  if (DRY_RUN) {
    console.log('[DRY RUN] Beginning validation...');
  } else {
    console.log('[EXECUTE] Beginning migration...');
  }
  
  for (const {table, schemaTable} of MIGRATION_ORDER) {
    console.log(`\n--- Preflighting Table: ${table} ---`);
    let rows = [];
    try {
      rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    } catch (e) {
      console.error(`[ERROR] Could not read ${table} from SQLite: ${e.message}`);
      hasErrors = true;
      continue;
    }
    
    console.log(`Read ${rows.length} rows from SQLite.`);
    
    if (rows.length === 0) continue;
    
    // Check conversions (specifically timestamps)
    let conversionFailed = 0;
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        // Find if this is a timestamp based on schema naming (heuristic for dry run)
        if (key.includes('at') || key.includes('date') || key === 'timestamp') {
           const val = row[key];
           if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
              const d = new Date(val + 'Z');
              if (isNaN(d.getTime())) {
                 conversionFailed++;
              }
           }
        }
      }
    }
    
    if (conversionFailed > 0) {
      console.warn(`[WARN] ${conversionFailed} rows in ${table} have potentially invalid dates.`);
    }
    
    if (!DRY_RUN) {
       // Batch insert logic would go here.
       // We would map snake_case from SQLite to camelCase for Drizzle
       // and use db.insert(schemaTable).values(mappedRows).execute();
       console.log(`[EXECUTE] Inserting ${rows.length} rows into ${table}... (NOT IMPLEMENTED)`);
    }
  }
  
  console.log('\n==================================================');
  if (hasErrors) {
    console.log('DRY RUN COMPLETED WITH ERRORS');
  } else {
    console.log('DRY RUN COMPLETED SUCCESSFULLY');
  }
  process.exit(hasErrors ? 1 : 0);
}

run();
