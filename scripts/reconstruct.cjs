const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('flowverge.recovered.db');

// Execute schema
const schema = `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT,
      full_name TEXT,
      phone TEXT,
      phone_verified INTEGER DEFAULT 0,
      email TEXT UNIQUE,
      password_hash TEXT,
      role_id INTEGER,
      status TEXT DEFAULT 'Active',
      language_preference TEXT DEFAULT 'English',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      sequence_order INTEGER,
      max_allowed_days INTEGER,
      working_principle TEXT,
      necessary_functions TEXT,
      assigned_role TEXT DEFAULT 'Site Supervisor',
      attendance_mode TEXT DEFAULT 'Free for All Users',
      who_assigns_work TEXT DEFAULT 'Project Manager',
      approver_role TEXT DEFAULT 'Project Manager',
      required_checklist_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT,
      site_custom_id TEXT,
      name TEXT,
      district TEXT,
      client TEXT,
      client_site_id TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      current_stage_id INTEGER,
      supervisor_id INTEGER,
      vendor_id INTEGER,
      status TEXT DEFAULT 'On Time',
      stage_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_stage_id) REFERENCES stages(id),
      FOREIGN KEY (supervisor_id) REFERENCES users(id),
      FOREIGN KEY (vendor_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS stage_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER,
      from_stage_id INTEGER,
      to_stage_id INTEGER,
      changed_by INTEGER,
      change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_by INTEGER,
      delay_reason TEXT,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (from_stage_id) REFERENCES stages(id),
      FOREIGN KEY (to_stage_id) REFERENCES stages(id),
      FOREIGN KEY (changed_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER,
      name TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (stage_id) REFERENCES stages(id)
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      question_text TEXT,
      answer_type TEXT,
      is_mandatory INTEGER DEFAULT 1,
      requires_photo INTEGER DEFAULT 0,
      order_no INTEGER,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id)
    );
    CREATE TABLE IF NOT EXISTS checklist_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      site_id INTEGER,
      filled_by INTEGER,
      status TEXT DEFAULT 'Draft',
      submitted_at DATETIME,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id),
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (filled_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS checklist_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER,
      item_id INTEGER,
      answer_value TEXT,
      remarks TEXT,
      quantity REAL,
      photo_metadata TEXT,
      FOREIGN KEY (response_id) REFERENCES checklist_responses(id),
      FOREIGN KEY (item_id) REFERENCES checklist_items(id)
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linked_type TEXT,
      linked_id INTEGER,
      site_id INTEGER,
      uploaded_by INTEGER,
      file_path TEXT,
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS warehouse_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      unit TEXT,
      min_stock REAL
    );
    CREATE TABLE IF NOT EXISTS warehouse_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER,
      type TEXT,
      quantity REAL,
      site_id INTEGER,
      user_id INTEGER,
      photo_proof TEXT,
      remarks TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES warehouse_materials(id),
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS ai_problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER,
      stage_id INTEGER,
      reported_by INTEGER,
      category TEXT,
      description TEXT,
      status TEXT DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (stage_id) REFERENCES stages(id),
      FOREIGN KEY (reported_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS ai_solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER,
      ai_suggestion TEXT,
      final_solution TEXT,
      approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES ai_problems(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linked_type TEXT,
      linked_id INTEGER,
      requested_by INTEGER,
      approved_by INTEGER,
      status TEXT DEFAULT 'Pending',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      details TEXT,
      site_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER,
      assigned_to INTEGER,
      title TEXT,
      description TEXT,
      status TEXT DEFAULT 'Pending',
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      type TEXT
    );
    CREATE TABLE IF NOT EXISTS safety_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER,
      reported_by INTEGER,
      category TEXT,
      description TEXT,
      severity TEXT,
      photo_proof TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (reported_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS reports_ai_weekly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT,
      summary TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      config TEXT,
      is_enabled INTEGER DEFAULT 0,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`;
db.exec(schema);

// Read snapshot data
const snapshot = JSON.parse(fs.readFileSync('pg_recovery_snapshot.json'));
const tables = Object.keys(snapshot);

// Convert standard boolean types from PG back to SQLite 1/0 where needed
function normalizeValue(val) {
  if (val === true) return 1;
  if (val === false) return 0;
  if (val instanceof Date) return val.toISOString().replace('T', ' ').replace('Z', '');
  // Dates in JSON are already ISO strings from pg, let's format them
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return val.replace('T', ' ').replace(/\.\d{3}Z$/, '');
  }
  return val;
}

db.transaction(() => {
  for (const table of tables) {
    const rows = snapshot[table];
    if (rows.length === 0) continue;
    
    // SQLite doesn't strictly enforce foreign keys by default, but let's be careful.
    const keys = Object.keys(rows[0]);
    const insertStmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`);
    
    for (const row of rows) {
      const values = keys.map(k => normalizeValue(row[k]));
      insertStmt.run(values);
    }
  }
})();
console.log("Database reconstructed.");
db.close();
