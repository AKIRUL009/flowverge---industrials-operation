import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initializeDatabase } from './src/database';
import dotenv from 'dotenv';

dotenv.config();

const __filename = path.join(process.cwd(), 'server.ts');
const __dirname = process.cwd();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'flowverge-dev-secret';

if (JWT_SECRET === 'flowverge-dev-secret') {
  console.log('WARNING: JWT_SECRET is using the fallback value.');
} else {
  console.log('JWT_SECRET is loaded from environment.');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

initializeDatabase();

// Helper: Audit Log
const logAction = (userId: number, action: string, details: string, siteId?: number) => {
  db.prepare('INSERT INTO logs (user_id, action, details, site_id) VALUES (?, ?, ?, ?)')
    .run(userId, action, details, siteId || null);
};

// Helper: Notification
const createNotification = (userId: number, message: string, type: string) => {
  db.prepare('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)')
    .run(userId, message, type);
};

// Middleware: Authenticate
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const token = parts[1];
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error('JWT verification failed:', err.message, 'Token length:', token.length);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.email = ? AND u.status = 'Active'
  `).get(email.trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  
  const { password_hash, ...userWithoutPassword } = user;
  logAction(user.id, 'Login', 'User logged in successfully');
  res.json({ token, user: userWithoutPassword });
});

// --- SITE ROUTES ---
app.get('/api/sites', authenticate, (req: any, res) => {
  let query = `
    SELECT s.*, st.name as stage_name, st.max_allowed_days,
           u1.full_name as supervisor_name, u2.full_name as vendor_name,
           (julianday('now') - julianday(s.stage_started_at)) > st.max_allowed_days as is_delayed
    FROM sites s
    JOIN stages st ON s.current_stage_id = st.id
    LEFT JOIN users u1 ON s.supervisor_id = u1.id
    LEFT JOIN users u2 ON s.vendor_id = u2.id
  `;
  const params: any[] = [];

  if (req.user.role === 'Supervisor') {
    query += ' WHERE s.supervisor_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'Vendor') {
    query += ' WHERE s.vendor_id = ?';
    params.push(req.user.id);
  }

  res.json(db.prepare(query).all(...params));
});

app.get('/api/stages', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM stages ORDER BY sequence_order').all());
});

app.get('/api/sites/:id', authenticate, (req, res) => {
  const site = db.prepare(`
    SELECT s.*, st.name as stage_name, st.sequence_order, st.max_allowed_days,
           u1.full_name as supervisor_name, u2.full_name as vendor_name,
           (julianday('now') - julianday(s.stage_started_at)) > st.max_allowed_days as is_delayed,
           EXISTS(SELECT 1 FROM approvals WHERE linked_type = 'Stage' AND linked_id = s.id AND status = 'Pending') as pending_stage_approval
    FROM sites s
    JOIN stages st ON s.current_stage_id = st.id
    LEFT JOIN users u1 ON s.supervisor_id = u1.id
    LEFT JOIN users u2 ON s.vendor_id = u2.id
    WHERE s.id = ?
  `).get(req.params.id);
  res.json(site);
});

app.post('/api/sites/bulk', authenticate, (req: any, res) => {
  const sites = req.body;
  if (!Array.isArray(sites)) return res.status(400).json({ error: 'Invalid data format' });

  const insert = db.prepare(`
    INSERT INTO sites (
      project_id, site_custom_id, name, district, client, client_site_id, 
      location, latitude, longitude, current_stage_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const transaction = db.transaction((sitesToInsert) => {
    for (const site of sitesToInsert) {
      insert.run(
        site.project_id, 
        site.site_custom_id, 
        site.name, 
        site.district, 
        site.client, 
        site.client_site_id, 
        site.location || '', 
        site.latitude, 
        site.longitude
      );
    }
  });

  try {
    transaction(sites);
    logAction(req.user.id, 'Bulk Create Sites', `Created ${sites.length} sites`, null);
    res.json({ success: true, count: sites.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sites', authenticate, (req: any, res) => {
  const { project_id, site_custom_id, name, district, client, client_site_id, location, latitude, longitude, supervisor_id, vendor_id } = req.body;
  const result = db.prepare(`
    INSERT INTO sites (
      project_id, site_custom_id, name, district, client, client_site_id, 
      location, latitude, longitude, current_stage_id, supervisor_id, vendor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    project_id, site_custom_id, name, district, client, client_site_id, 
    location, latitude, longitude, supervisor_id, vendor_id
  );
  logAction(req.user.id, 'Create Site', `Created site ${name}`, Number(result.lastInsertRowid));
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/sites/:id', authenticate, (req: any, res) => {
  const { project_id, site_custom_id, name, district, client, client_site_id, location, latitude, longitude, supervisor_id, vendor_id } = req.body;
  db.prepare(`
    UPDATE sites SET 
      project_id = ?, site_custom_id = ?, name = ?, district = ?, 
      client = ?, client_site_id = ?, location = ?, latitude = ?, 
      longitude = ?, supervisor_id = ?, vendor_id = ? 
    WHERE id = ?
  `).run(
    project_id, site_custom_id, name, district, client, client_site_id, 
    location, latitude, longitude, supervisor_id, vendor_id, req.params.id
  );
  logAction(req.user.id, 'Update Site', `Updated site ${name}`, Number(req.params.id));
  res.json({ success: true });
});

app.get('/api/sites/:id/history', authenticate, (req, res) => {
  const history = db.prepare(`
    SELECT sh.*, s1.name as from_stage_name, s2.name as to_stage_name, u.full_name as changed_by_name
    FROM stage_history sh
    JOIN stages s1 ON sh.from_stage_id = s1.id
    JOIN stages s2 ON sh.to_stage_id = s2.id
    JOIN users u ON sh.changed_by = u.id
    WHERE sh.site_id = ?
    ORDER BY sh.change_date DESC
  `).all(req.params.id);
  res.json(history);
});

// --- CHECKLIST ROUTES ---
app.get('/api/checklists/template/:stageId', authenticate, (req, res) => {
  const template = db.prepare('SELECT * FROM checklist_templates WHERE stage_id = ? AND is_active = 1').get(req.params.stageId);
  if (!template) return res.json(null);
  
  const items = db.prepare('SELECT * FROM checklist_items WHERE template_id = ? ORDER BY order_no ASC').all(template.id);
  res.json({ ...template, items });
});

app.get('/api/checklists/response/:siteId/:stageId', authenticate, (req, res) => {
  const template = db.prepare('SELECT id FROM checklist_templates WHERE stage_id = ? AND is_active = 1').get(req.params.stageId);
  if (!template) return res.json(null);

  const response = db.prepare('SELECT * FROM checklist_responses WHERE site_id = ? AND template_id = ?').get(req.params.siteId, template.id);
  if (!response) return res.json(null);

  const answers = db.prepare('SELECT * FROM checklist_answers WHERE response_id = ?').all(response.id);
  res.json({ ...response, answers });
});

app.post('/api/checklists/response', authenticate, (req: any, res) => {
  const { template_id, site_id, status, answers } = req.body;
  
  db.transaction(() => {
    let response = db.prepare('SELECT id FROM checklist_responses WHERE site_id = ? AND template_id = ?').get(site_id, template_id);
    let responseId;

    if (response) {
      responseId = response.id;
      db.prepare('UPDATE checklist_responses SET status = ?, submitted_at = ? WHERE id = ?')
        .run(status, status === 'Submitted' ? new Date().toISOString() : null, responseId);
      db.prepare('DELETE FROM checklist_answers WHERE response_id = ?').run(responseId);
    } else {
      const result = db.prepare('INSERT INTO checklist_responses (template_id, site_id, filled_by, status, submitted_at) VALUES (?, ?, ?, ?, ?)')
        .run(template_id, site_id, req.user.id, status, status === 'Submitted' ? new Date().toISOString() : null);
      responseId = result.lastInsertRowid;
    }

    const insertAnswer = db.prepare('INSERT INTO checklist_answers (response_id, item_id, answer_value, remarks, quantity) VALUES (?, ?, ?, ?, ?)');
    for (const ans of answers) {
      insertAnswer.run(responseId, ans.item_id, ans.answer_value, ans.remarks, ans.quantity);
    }

    // --- STAGE CONDITION ENGINE ---
    if (status === 'Submitted') {
      const mandatoryItems = db.prepare('SELECT id FROM checklist_items WHERE template_id = ? AND is_mandatory = 1').all(template_id);
      const answeredItems = db.prepare('SELECT item_id FROM checklist_answers WHERE response_id = ? AND answer_value IS NOT NULL AND answer_value != \'\'').all(responseId);
      const answeredIds = new Set(answeredItems.map((a: any) => a.item_id));
      
      const allMandatoryFilled = mandatoryItems.every((item: any) => answeredIds.has(item.id));

      if (allMandatoryFilled) {
        const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(site_id);
        
        // Auto-advance for Survey stage (ID 1) or if user is Admin/PM
        const isAdminOrPM = req.user.role === 'Admin' || req.user.role === 'Project Manager';
        
        if (site.current_stage_id === 1 || isAdminOrPM) {
          const nextStage = db.prepare(`
            SELECT id, name FROM stages 
            WHERE sequence_order = (
              SELECT sequence_order + 1 FROM stages WHERE id = ?
            )
          `).get(site.current_stage_id);

          if (nextStage) {
            db.prepare('INSERT INTO stage_history (site_id, from_stage_id, to_stage_id, changed_by, approved_by) VALUES (?, ?, ?, ?, ?)')
              .run(site.id, site.current_stage_id, nextStage.id, req.user.id, req.user.id);
            db.prepare('UPDATE sites SET current_stage_id = ?, stage_started_at = CURRENT_TIMESTAMP WHERE id = ?')
              .run(nextStage.id, site.id);
            
            createNotification(site.supervisor_id, `Stage advanced to ${nextStage.name} for ${site.name}`, 'general');
            createNotification(site.vendor_id, `Stage advanced to ${nextStage.name} for ${site.name}`, 'general');
            logAction(req.user.id, 'Auto Stage Advance', `System automatically advanced site ${site.name} to stage ${nextStage.name} after checklist completion`, site_id);
          }
        } else {
          // For other stages and non-admin users, create approval request
          const existingApproval = db.prepare('SELECT id FROM approvals WHERE linked_type = \'Stage\' AND linked_id = ? AND status = \'Pending\'').get(site_id);
          
          if (!existingApproval) {
            db.prepare('INSERT INTO approvals (linked_type, linked_id, requested_by, reason) VALUES (?, ?, ?, ?)')
              .run('Stage', site_id, req.user.id, 'System: Checklist completed. Auto-requesting stage advancement.');
            
            // Notify PMs
            const pms = db.prepare('SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = \'Project Manager\'').all();
            pms.forEach((pm: any) => {
              createNotification(pm.id, `AI Engine: Checklist completed for ${site.name}. Stage advancement suggested.`, 'approval');
            });

            logAction(req.user.id, 'Auto Stage Request', `System automatically requested stage change for site ${site.name} after checklist completion`, site_id);
          }
        }
      }
    }
  })();

  res.json({ success: true });
});

// --- APPROVAL ROUTES ---
app.post('/api/sites/:id/request-stage-change', authenticate, (req: any, res) => {
  const { reason } = req.body;
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  
  const result = db.prepare('INSERT INTO approvals (linked_type, linked_id, requested_by, reason) VALUES (?, ?, ?, ?)')
    .run('Stage', req.params.id, req.user.id, reason);
  
  // Notify PMs
  const pms = db.prepare('SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = \'Project Manager\')').all();
  pms.forEach((pm: any) => {
    createNotification(pm.id, `Stage change request for ${site.name}`, 'approval');
  });

  res.json({ id: result.lastInsertRowid });
});

app.get('/api/approvals', authenticate, (req, res) => {
  const approvals = db.prepare(`
    SELECT a.*, s.name as site_name, u.full_name as requester_name
    FROM approvals a
    JOIN sites s ON a.linked_id = s.id
    JOIN users u ON a.requested_by = u.id
    WHERE a.status = 'Pending'
  `).all();
  res.json(approvals);
});

app.post('/api/approvals/:id', authenticate, (req: any, res) => {
  const { status, reason } = req.body;
  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  
  if (status === 'Approved' && approval.linked_type === 'Stage') {
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(approval.linked_id);
    
    // Checklist Gate
    const template = db.prepare('SELECT id FROM checklist_templates WHERE stage_id = ? AND is_active = 1').get(site.current_stage_id);
    if (template) {
      const response = db.prepare('SELECT status FROM checklist_responses WHERE site_id = ? AND template_id = ?').get(site.id, template.id);
      console.log('Checklist response:', response);
      if (!response || (response.status !== 'Submitted' && response.status !== 'Locked')) {
        return res.status(400).json({ error: 'Checklist must be submitted before stage change' });
      }
    }

    const nextStage = db.prepare(`
      SELECT id FROM stages 
      WHERE sequence_order = (
        SELECT sequence_order + 1 FROM stages WHERE id = ?
      )
    `).get(site.current_stage_id);

    if (nextStage) {
      db.prepare('INSERT INTO stage_history (site_id, from_stage_id, to_stage_id, changed_by, approved_by) VALUES (?, ?, ?, ?, ?)')
        .run(site.id, site.current_stage_id, nextStage.id, approval.requested_by, req.user.id);
      db.prepare('UPDATE sites SET current_stage_id = ?, stage_started_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(nextStage.id, site.id);
      
      createNotification(site.supervisor_id, `Stage advanced to ${nextStage.id} for ${site.name}`, 'general');
      createNotification(site.vendor_id, `Stage advanced to ${nextStage.id} for ${site.name}`, 'general');
    }
  }

  db.prepare('UPDATE approvals SET status = ?, approved_by = ?, reason = ? WHERE id = ?')
    .run(status, req.user.id, reason, req.params.id);
  
  createNotification(approval.requested_by, `Your ${approval.linked_type} request was ${status}`, 'approval');
  res.json({ success: true });
});

// --- WAREHOUSE ROUTES ---
app.get('/api/warehouse/stock', authenticate, (req, res) => {
  const stock = db.prepare(`
    SELECT wm.*, 
           COALESCE((SELECT SUM(quantity) FROM warehouse_transactions WHERE material_id = wm.id AND type = 'IN'), 0) -
           COALESCE((SELECT SUM(quantity) FROM warehouse_transactions WHERE material_id = wm.id AND type = 'OUT'), 0) as current_stock
    FROM warehouse_materials wm
  `).all();
  res.json(stock);
});

app.get('/api/warehouse/materials', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM warehouse_materials').all());
});

app.post('/api/warehouse/transaction', authenticate, (req: any, res) => {
  const { material_id, type, quantity, site_id, photo_proof, remarks } = req.body;
  
  if (type === 'OUT') {
    const stock = db.prepare(`
      SELECT COALESCE((SELECT SUM(quantity) FROM warehouse_transactions WHERE material_id = ? AND type = 'IN'), 0) -
             COALESCE((SELECT SUM(quantity) FROM warehouse_transactions WHERE material_id = ? AND type = 'OUT'), 0) as current_stock
    `).get(material_id, material_id);
    
    if (stock.current_stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    if (!site_id) return res.status(400).json({ error: 'Site required for OUT transaction' });
  }

  db.prepare('INSERT INTO warehouse_transactions (material_id, type, quantity, site_id, user_id, photo_proof, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(material_id, type, quantity, site_id || null, req.user.id, photo_proof, remarks);
  
  res.json({ success: true });
});

app.get('/api/warehouse/transactions', authenticate, (req, res) => {
  const { material_id, site_id, type } = req.query;
  let query = `
    SELECT wt.*, wm.name as material_name, u.full_name as user_name, s.name as site_name
    FROM warehouse_transactions wt
    JOIN warehouse_materials wm ON wt.material_id = wm.id
    JOIN users u ON wt.user_id = u.id
    LEFT JOIN sites s ON wt.site_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (material_id) { query += ' AND wt.material_id = ?'; params.push(material_id); }
  if (site_id) { query += ' AND wt.site_id = ?'; params.push(site_id); }
  if (type) { query += ' AND wt.type = ?'; params.push(type); }
  query += ' ORDER BY wt.timestamp DESC LIMIT 100';
  res.json(db.prepare(query).all(...params));
});

// --- AI ROUTES ---
app.post('/api/ai/log', authenticate, (req: any, res) => {
  const { site_id, stage_id, category, description } = req.body;
  const result = db.prepare('INSERT INTO ai_problems (site_id, stage_id, reported_by, category, description) VALUES (?, ?, ?, ?, ?)')
    .run(site_id, stage_id, req.user.id, category, description);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/ai/cases', authenticate, (req, res) => {
  const cases = db.prepare(`
    SELECT ap.*, s.name as site_name, st.name as stage_name, u.full_name as reporter_name,
           asol.ai_suggestion, asol.final_solution
    FROM ai_problems ap
    JOIN sites s ON ap.site_id = s.id
    JOIN stages st ON ap.stage_id = st.id
    JOIN users u ON ap.reported_by = u.id
    LEFT JOIN ai_solutions asol ON ap.id = asol.problem_id
    ORDER BY ap.created_at DESC
  `).all();
  res.json(cases);
});

app.post('/api/ai/solution', authenticate, (req, res) => {
  const { problem_id, ai_suggestion } = req.body;
  db.prepare('INSERT INTO ai_solutions (problem_id, ai_suggestion) VALUES (?, ?)')
    .run(problem_id, ai_suggestion);
  res.json({ success: true });
});

app.post('/api/ai/solution/:id/approve', authenticate, (req: any, res) => {
  const { final_solution } = req.body;
  db.prepare('UPDATE ai_solutions SET final_solution = ?, approved_by = ? WHERE id = ?')
    .run(final_solution, req.user.id, req.params.id);
  
  const sol = db.prepare('SELECT problem_id FROM ai_solutions WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE ai_problems SET status = \'Solved\' WHERE id = ?').run(sol.problem_id);
  
  const prob = db.prepare('SELECT reported_by FROM ai_problems WHERE id = ?').get(sol.problem_id);
  createNotification(prob.reported_by, 'Your AI problem has been solved', 'ai');
  
  res.json({ success: true });
});

// --- NOTIFICATION ROUTES ---
app.get('/api/notifications/:userId', authenticate, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(req.params.userId);
  res.json(notifications);
});

app.post('/api/notifications/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read/:userId', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.params.userId);
  res.json({ success: true });
});

// --- ADMIN ROUTES ---
app.get('/api/admin/users', authenticate, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, r.name as role, r.name as role_name
    FROM users u 
    JOIN roles r ON u.role_id = r.id
  `).all();
  res.json(users);
});

app.post('/api/admin/users', authenticate, (req, res) => {
  const { full_name, email, password, role_id, phone } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db.prepare('INSERT INTO users (full_name, email, password_hash, role_id, phone) VALUES (?, ?, ?, ?, ?)')
    .run(full_name, email, hash, role_id, phone);
  res.json({ success: true });
});

app.get('/api/admin/roles', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM roles').all());
});

app.get('/api/admin/stages', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM stages ORDER BY sequence_order ASC').all());
});

app.post('/api/admin/assign-site', authenticate, (req: any, res) => {
  const { siteId, userId } = req.body;
  if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const user = db.prepare('SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'Supervisor') {
    db.prepare('UPDATE sites SET supervisor_id = ? WHERE id = ?').run(userId, siteId);
  } else if (user.role === 'Vendor') {
    db.prepare('UPDATE sites SET vendor_id = ? WHERE id = ?').run(userId, siteId);
  } else {
    return res.status(400).json({ error: 'Only Supervisors or Vendors can be assigned to sites' });
  }

  logAction(req.user.id, 'Assign Site', `Assigned site ${siteId} to user ${userId}`, siteId);
  createNotification(userId, `You have been assigned to a new site.`, 'general');
  res.json({ success: true });
});

app.get('/api/admin/logs', authenticate, (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, u.full_name as user_name, s.name as site_name
    FROM logs l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN sites s ON l.site_id = s.id
    ORDER BY l.timestamp DESC LIMIT 200
  `).all();
  res.json(logs);
});

app.get('/api/admin/settings', authenticate, (req: any, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const settings = db.prepare('SELECT * FROM system_settings').all();
  res.json(settings);
});

app.post('/api/admin/settings', authenticate, (req: any, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { settings } = req.body; // Array of { key, value, description, type }
  
  const upsert = db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description, type) VALUES (?, ?, ?, ?)');
  
  db.transaction(() => {
    for (const s of settings) {
      upsert.run(s.key, s.value, s.description, s.type);
    }
  })();
  
  res.json({ success: true });
});

// --- PROFILE ROUTES ---
app.get('/api/profile/:userId', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, full_name, email, phone, role_id, language_preference FROM users WHERE id = ?').get(req.params.userId);
  res.json(user);
});

app.put('/api/profile/:userId', authenticate, (req, res) => {
  const { full_name, phone, language_preference } = req.body;
  db.prepare('UPDATE users SET full_name = ?, phone = ?, language_preference = ? WHERE id = ?')
    .run(full_name, phone, language_preference, req.params.userId);
  res.json({ success: true });
});

// --- SAFETY ROUTES ---
app.post('/api/safety/log', authenticate, (req: any, res) => {
  const { site_id, category, description, severity, photo_proof } = req.body;
  const result = db.prepare('INSERT INTO safety_logs (site_id, reported_by, category, description, severity, photo_proof) VALUES (?, ?, ?, ?, ?, ?)')
    .run(site_id, req.user.id, category, description, severity, photo_proof);
  
  if (severity === 'High' || severity === 'Critical') {
    const pms = db.prepare('SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = \'Project Manager\')').all();
    pms.forEach((pm: any) => {
      createNotification(pm.id, `URGENT Safety Issue: ${category} at site ${site_id}`, 'general');
    });
  }
  
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/safety/logs', authenticate, (req, res) => {
  const logs = db.prepare(`
    SELECT sl.*, s.name as site_name, u.full_name as reporter_name
    FROM safety_logs sl
    JOIN sites s ON sl.site_id = s.id
    JOIN users u ON sl.reported_by = u.id
    ORDER BY sl.created_at DESC
  `).all();
  res.json(logs);
});

// --- REPORT ENHANCEMENT ROUTES ---
app.get('/api/reports/vendors', authenticate, (req, res) => {
  const vendors = db.prepare(`
    SELECT u.id, u.full_name as name,
           COUNT(s.id) as total_sites,
           SUM(CASE WHEN (julianday('now') - julianday(s.stage_started_at)) > st.max_allowed_days THEN 1 ELSE 0 END) as delayed_sites
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN sites s ON u.id = s.vendor_id
    LEFT JOIN stages st ON s.current_stage_id = st.id
    WHERE r.name = 'Vendor'
    GROUP BY u.id
  `).all();
  res.json(vendors);
});

app.get('/api/reports/warehouse/efficiency', authenticate, (req, res) => {
  const efficiency = db.prepare(`
    SELECT wm.name,
           COUNT(wt.id) as transaction_count,
           SUM(CASE WHEN wt.type = 'IN' THEN wt.quantity ELSE 0 END) as total_in,
           SUM(CASE WHEN wt.type = 'OUT' THEN wt.quantity ELSE 0 END) as total_out
    FROM warehouse_materials wm
    LEFT JOIN warehouse_transactions wt ON wm.id = wt.material_id
    GROUP BY wm.id
  `).all();
  res.json(efficiency);
});

app.post('/api/reports/ai-weekly', authenticate, (req, res) => {
  const { summary, week_start } = req.body;
  db.prepare('INSERT INTO reports_ai_weekly (summary, week_start) VALUES (?, ?)')
    .run(summary, week_start);
  res.json({ success: true });
});

app.get('/api/reports/ai-weekly', authenticate, (req, res) => {
  const reports = db.prepare('SELECT * FROM reports_ai_weekly ORDER BY generated_at DESC LIMIT 10').all();
  res.json(reports);
});

// Middleware: Check Role
const checkRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// --- ADMIN WORKFLOW ROUTES ---
app.post('/api/admin/stages', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { name, sequence_order, max_allowed_days, working_principle, necessary_functions } = req.body;
  const result = db.prepare('INSERT INTO stages (name, sequence_order, max_allowed_days, working_principle, necessary_functions) VALUES (?, ?, ?, ?, ?)')
    .run(name, sequence_order, max_allowed_days, working_principle, necessary_functions);
  logAction(req.user.id, 'Create Stage', `Created stage ${name}`, null);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/stages/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { name, sequence_order, max_allowed_days, working_principle, necessary_functions } = req.body;
  db.prepare('UPDATE stages SET name = ?, sequence_order = ?, max_allowed_days = ?, working_principle = ?, necessary_functions = ? WHERE id = ?')
    .run(name, sequence_order, max_allowed_days, working_principle, necessary_functions, req.params.id);
  logAction(req.user.id, 'Update Stage', `Updated stage ${name}`, null);
  res.json({ success: true });
});

app.delete('/api/admin/stages/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  db.prepare('DELETE FROM stages WHERE id = ?').run(req.params.id);
  logAction(req.user.id, 'Delete Stage', `Deleted stage ID ${req.params.id}`, null);
  res.json({ success: true });
});

app.get('/api/admin/checklists', authenticate, checkRole(['Admin', 'Project Manager']), (req, res) => {
  const templates = db.prepare(`
    SELECT ct.*, st.name as stage_name 
    FROM checklist_templates ct
    JOIN stages st ON ct.stage_id = st.id
  `).all();
  res.json(templates);
});

app.post('/api/admin/checklists', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { stage_id, name } = req.body;
  const result = db.prepare('INSERT INTO checklist_templates (stage_id, name) VALUES (?, ?)')
    .run(stage_id, name);
  logAction(req.user.id, 'Create Checklist Template', `Created template ${name}`, null);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/checklists/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { stage_id, name, is_active } = req.body;
  db.prepare('UPDATE checklist_templates SET stage_id = ?, name = ?, is_active = ? WHERE id = ?')
    .run(stage_id, name, is_active, req.params.id);
  logAction(req.user.id, 'Update Checklist Template', `Updated template ${name}`, null);
  res.json({ success: true });
});

app.get('/api/admin/checklists/:id/items', authenticate, checkRole(['Admin', 'Project Manager']), (req, res) => {
  const items = db.prepare('SELECT * FROM checklist_items WHERE template_id = ? ORDER BY order_no').all(req.params.id);
  res.json(items);
});

app.post('/api/admin/checklists/:id/items', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { question_text, answer_type, is_mandatory, requires_photo, order_no } = req.body;
  const result = db.prepare('INSERT INTO checklist_items (template_id, question_text, answer_type, is_mandatory, requires_photo, order_no) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.params.id, question_text, answer_type, is_mandatory ? 1 : 0, requires_photo ? 1 : 0, order_no);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/checklists/items/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { question_text, answer_type, is_mandatory, requires_photo, order_no } = req.body;
  db.prepare('UPDATE checklist_items SET question_text = ?, answer_type = ?, is_mandatory = ?, requires_photo = ?, order_no = ? WHERE id = ?')
    .run(question_text, answer_type, is_mandatory ? 1 : 0, requires_photo ? 1 : 0, order_no, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/checklists/items/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- INTEGRATION ROUTES ---
app.get('/api/admin/integrations', authenticate, checkRole(['Admin']), (req, res) => {
  const integrations = db.prepare('SELECT * FROM integrations').all();
  res.json(integrations.map((i: any) => ({ ...i, config: JSON.parse(i.config) })));
});

app.put('/api/admin/integrations/:id', authenticate, checkRole(['Admin']), (req: any, res) => {
  const { config, is_enabled } = req.body;
  db.prepare('UPDATE integrations SET config = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(JSON.stringify(config), is_enabled ? 1 : 0, req.params.id);
  
  const integration = db.prepare('SELECT name FROM integrations WHERE id = ?').get(req.params.id);
  logAction(req.user.id, 'Update Integration', `Updated ${integration.name} integration settings`, null);
  res.json({ success: true });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
