import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

export const db = new Database('flowverge.db');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      necessary_functions TEXT
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
  `);

  // Add columns if they don't exist (for existing databases)
  try { db.exec('ALTER TABLE sites ADD COLUMN project_id TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE sites ADD COLUMN site_custom_id TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE sites ADD COLUMN district TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE sites ADD COLUMN client_site_id TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE stages ADD COLUMN working_principle TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE stages ADD COLUMN necessary_functions TEXT'); } catch (e) {}

  db.exec(`
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
      answer_type TEXT, -- 'Yes/No' | 'Text' | 'Number' | 'Photo'
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
      status TEXT DEFAULT 'Draft', -- 'Draft' | 'Submitted' | 'Locked'
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
      FOREIGN KEY (response_id) REFERENCES checklist_responses(id),
      FOREIGN KEY (item_id) REFERENCES checklist_items(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linked_type TEXT, -- 'Checklist' | 'Stock' | 'Site'
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
      type TEXT, -- 'IN' | 'OUT'
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
      status TEXT DEFAULT 'Open', -- 'Open' | 'Solved'
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
      linked_type TEXT, -- 'Stage' | 'Checklist' | 'Photo' | 'AI'
      linked_id INTEGER,
      requested_by INTEGER,
      approved_by INTEGER,
      status TEXT DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Rejected'
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      type TEXT, -- 'delay' | 'approval' | 'stock' | 'ai' | 'general'
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
  `);

  // Seed Roles
  const rolesCount = db.prepare('SELECT count(*) as count FROM roles').get().count;
  if (rolesCount === 0) {
    const insertRole = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
    ['Admin', 'Project Manager', 'Supervisor', 'Warehouse', 'Vendor', 'Technician'].forEach(role => {
      insertRole.run(role, `${role} role`);
    });
  }

  // Seed Stages
  const stagesCount = db.prepare('SELECT count(*) as count FROM stages').get().count;
  if (stagesCount === 0) {
    const insertStage = db.prepare('INSERT INTO stages (name, sequence_order, max_allowed_days) VALUES (?, ?, ?)');
    insertStage.run('Survey', 1, 3);
    insertStage.run('Foundation', 2, 7);
    insertStage.run('Installation', 3, 10);
    insertStage.run('Inspection', 4, 3);
    insertStage.run('Billing', 5, 2);
  }

  // Seed Users
  const usersCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)');
    const salt = bcrypt.genSaltSync(10);
    
    // Get role IDs dynamically
    const getRoleId = (roleName: string) => {
      const row = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined;
      return row ? row.id : null;
    };

    insertUser.run('Admin User', 'admin@flowverge.com', bcrypt.hashSync('admin123', salt), getRoleId('Admin') || 1);
    insertUser.run('PM User', 'pm@flowverge.com', bcrypt.hashSync('pm123', salt), getRoleId('Project Manager') || 2);
    insertUser.run('Supervisor User', 'sup@flowverge.com', bcrypt.hashSync('sup123', salt), getRoleId('Supervisor') || 3);
    insertUser.run('Warehouse User', 'wh@flowverge.com', bcrypt.hashSync('wh123', salt), getRoleId('Warehouse') || 4);
    insertUser.run('Vendor User', 'vendor@flowverge.com', bcrypt.hashSync('vendor123', salt), getRoleId('Vendor') || 5);
  }

  // Seed Demo Site
  const sitesCount = db.prepare('SELECT count(*) as count FROM sites').get().count;
  if (sitesCount === 0) {
    const stageRow = db.prepare('SELECT id FROM stages ORDER BY sequence_order LIMIT 1').get() as { id: number } | undefined;
    const supUser = db.prepare("SELECT id FROM users WHERE email = 'sup@flowverge.com'").get() as { id: number } | undefined;
    const vendorUser = db.prepare("SELECT id FROM users WHERE email = 'vendor@flowverge.com'").get() as { id: number } | undefined;
    const anyUser = db.prepare("SELECT id FROM users LIMIT 1").get() as { id: number } | undefined;

    const currentStageId = stageRow ? stageRow.id : 1;
    const supervisorId = supUser ? supUser.id : (anyUser ? anyUser.id : null);
    const vendorId = vendorUser ? vendorUser.id : (anyUser ? anyUser.id : null);

    try {
      const insertSite = db.prepare(`
        INSERT INTO sites (
          project_id, site_custom_id, name, district, client, client_site_id, 
          location, current_stage_id, supervisor_id, vendor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertSite.run(
        'PRJ-DEMO-01', 
        'SITE-DEMO-01', 
        'Ibrahimpura Indus', 
        'Indore', 
        'Hyperqom Infra', 
        'C-SITE-124', 
        'IN-1247746', 
        currentStageId, supervisorId, vendorId
      );
    } catch (e) {
      console.error('Failed to seed demo site:', e);
    }
  }

  // Seed Materials
  const materialsCount = db.prepare('SELECT count(*) as count FROM warehouse_materials').get().count;
  if (materialsCount === 0) {
    const insertMaterial = db.prepare('INSERT INTO warehouse_materials (name, category, unit, min_stock) VALUES (?, ?, ?, ?)');
    insertMaterial.run('Solar Panel', 'Modules', 'pcs', 10);
    insertMaterial.run('DC Cable', 'Electrical', 'meters', 50);
    insertMaterial.run('Junction Box', 'Electrical', 'pcs', 5);
  }

  // Seed Checklist Template for Survey
  const templatesCount = db.prepare('SELECT count(*) as count FROM checklist_templates').get().count;
  if (templatesCount === 0) {
    const insertTemplate = db.prepare('INSERT INTO checklist_templates (stage_id, name) VALUES (?, ?)');
    const templateId = insertTemplate.run(1, 'Survey Checklist').lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO checklist_items (template_id, question_text, answer_type, order_no) VALUES (?, ?, ?, ?)');
    insertItem.run(templateId, 'Site access confirmed?', 'Yes/No', 1);
    insertItem.run(templateId, 'Soil test report attached?', 'Yes/No', 2);
    insertItem.run(templateId, 'Number of panels planned', 'Number', 3);
    insertItem.run(templateId, 'Site photo - North view', 'Photo', 4);
  }

  // Seed Integrations
  const integrationsCount = db.prepare('SELECT count(*) as count FROM integrations').get().count;
  if (integrationsCount === 0) {
    const insertIntegration = db.prepare('INSERT INTO integrations (name, description, config, is_enabled) VALUES (?, ?, ?, ?)');
    insertIntegration.run('WhatsApp', 'WhatsApp Business API for notifications', JSON.stringify({ webhook_url: '', api_key: '' }), 0);
    insertIntegration.run('Teams', 'Microsoft Teams Webhook for alerts', JSON.stringify({ webhook_url: '' }), 0);
    insertIntegration.run('Google Calendar', 'Calendar integration for meeting scheduling', JSON.stringify({ client_id: '', client_secret: '' }), 0);
    insertIntegration.run('External Data', 'Generic API integration for external data syncing', JSON.stringify({ endpoint: '', auth_token: '' }), 0);
  }
}

export default db;
