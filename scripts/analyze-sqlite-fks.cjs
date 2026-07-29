const Database = require('better-sqlite3');
const db = new Database('flowverge.db', { readonly: true });

// Check Foreign Key orphans
const fkChecks = [
  { table: 'users', fkCol: 'role_id', parentTable: 'roles', parentCol: 'id' },
  { table: 'sites', fkCol: 'current_stage_id', parentTable: 'stages', parentCol: 'id' },
  { table: 'sites', fkCol: 'supervisor_id', parentTable: 'users', parentCol: 'id' },
  { table: 'sites', fkCol: 'vendor_id', parentTable: 'users', parentCol: 'id' },
  { table: 'stage_history', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'stage_history', fkCol: 'from_stage_id', parentTable: 'stages', parentCol: 'id' },
  { table: 'stage_history', fkCol: 'to_stage_id', parentTable: 'stages', parentCol: 'id' },
  { table: 'stage_history', fkCol: 'changed_by', parentTable: 'users', parentCol: 'id' },
  { table: 'stage_history', fkCol: 'approved_by', parentTable: 'users', parentCol: 'id' },
  { table: 'checklist_templates', fkCol: 'stage_id', parentTable: 'stages', parentCol: 'id' },
  { table: 'checklist_items', fkCol: 'template_id', parentTable: 'checklist_templates', parentCol: 'id' },
  { table: 'checklist_responses', fkCol: 'template_id', parentTable: 'checklist_templates', parentCol: 'id' },
  { table: 'checklist_responses', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'checklist_responses', fkCol: 'filled_by', parentTable: 'users', parentCol: 'id' },
  { table: 'checklist_answers', fkCol: 'response_id', parentTable: 'checklist_responses', parentCol: 'id' },
  { table: 'checklist_answers', fkCol: 'item_id', parentTable: 'checklist_items', parentCol: 'id' },
  { table: 'photos', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'photos', fkCol: 'uploaded_by', parentTable: 'users', parentCol: 'id' },
  { table: 'warehouse_transactions', fkCol: 'material_id', parentTable: 'warehouse_materials', parentCol: 'id' },
  { table: 'warehouse_transactions', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'warehouse_transactions', fkCol: 'user_id', parentTable: 'users', parentCol: 'id' },
  { table: 'ai_problems', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'ai_problems', fkCol: 'stage_id', parentTable: 'stages', parentCol: 'id' },
  { table: 'ai_problems', fkCol: 'reported_by', parentTable: 'users', parentCol: 'id' },
  { table: 'ai_solutions', fkCol: 'problem_id', parentTable: 'ai_problems', parentCol: 'id' },
  { table: 'ai_solutions', fkCol: 'approved_by', parentTable: 'users', parentCol: 'id' },
  { table: 'approvals', fkCol: 'requested_by', parentTable: 'users', parentCol: 'id' },
  { table: 'approvals', fkCol: 'approved_by', parentTable: 'users', parentCol: 'id' },
  { table: 'notifications', fkCol: 'user_id', parentTable: 'users', parentCol: 'id' },
  { table: 'logs', fkCol: 'user_id', parentTable: 'users', parentCol: 'id' },
  { table: 'logs', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'tasks', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'tasks', fkCol: 'assigned_to', parentTable: 'users', parentCol: 'id' },
  { table: 'messages', fkCol: 'sender_id', parentTable: 'users', parentCol: 'id' },
  { table: 'messages', fkCol: 'receiver_id', parentTable: 'users', parentCol: 'id' },
  { table: 'safety_logs', fkCol: 'site_id', parentTable: 'sites', parentCol: 'id' },
  { table: 'safety_logs', fkCol: 'reported_by', parentTable: 'users', parentCol: 'id' }
];

console.log("FOREIGN KEY INTEGRITY:");
for (const check of fkChecks) {
  const query = `
    SELECT count(*) as orphans 
    FROM ${check.table} child
    LEFT JOIN ${check.parentTable} parent ON child.${check.fkCol} = parent.${check.parentCol}
    WHERE child.${check.fkCol} IS NOT NULL AND parent.${check.parentCol} IS NULL
  `;
  try {
    const res = db.prepare(query).get();
    if (res.orphans > 0) {
      console.log(`ORPHAN FOUND: ${res.orphans} rows in ${check.table}.${check.fkCol} -> ${check.parentTable}.${check.parentCol}`);
    }
  } catch (e) {
    console.error(`Error checking ${check.table}.${check.fkCol}: ${e.message}`);
  }
}
console.log("FK check complete.");
