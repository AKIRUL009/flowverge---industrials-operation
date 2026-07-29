  
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
      photo_metadata TEXT,
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
  
  try { ALTER TABLE sites ADD COLUMN project_id TEXT } catch (e) {}
  try { ALTER TABLE sites ADD COLUMN site_custom_id TEXT } catch (e) {}
  try { ALTER TABLE sites ADD COLUMN district TEXT } catch (e) {}
  try { ALTER TABLE sites ADD COLUMN client_site_id TEXT } catch (e) {}
  try { ALTER TABLE stages ADD COLUMN working_principle TEXT } catch (e) {}
  try { ALTER TABLE stages ADD COLUMN necessary_functions TEXT } catch (e) {}
  try { db.exec(ALTER TABLE stages ADD COLUMN assigned_role TEXT DEFAULT 'Site Supervisor'); } catch (e) {}
  try { db.exec(ALTER TABLE stages ADD COLUMN attendance_mode TEXT DEFAULT 'Free for All Users'); } catch (e) {}
  try { db.exec(ALTER TABLE stages ADD COLUMN who_assigns_work TEXT DEFAULT 'Project Manager'); } catch (e) {}
  try { db.exec(ALTER TABLE stages ADD COLUMN approver_role TEXT DEFAULT 'Project Manager'); } catch (e) {}
  try { ALTER TABLE stages ADD COLUMN required_checklist_id INTEGER } catch (e) {}
    ALTER TABLE checklist_answers ADD COLUMN photo_metadata TEXT
