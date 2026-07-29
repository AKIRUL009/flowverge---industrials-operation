import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initializeDatabase } from './src/database.ts';
import dotenv from 'dotenv';
import { dbService, checkCloudSqlConnection } from './src/services/dbService.ts';
import prismaRouter from './src/routes/prismaApi.ts';
import { GoogleGenAI } from '@google/genai';
import { adminAuth } from './src/lib/firebaseAdmin.ts';
import { resolveFlowvergeUser } from './src/services/authService.ts';

dotenv.config();

const __filename = path.join(process.cwd(), 'server.ts');
const __dirname = process.cwd();

const app = express();
const PORT = 3000;
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

// Helper: Downstream Tasks Generator upon Stage Advancement
const triggerDownstreamTasks = (siteId: number, nextStageId: number, triggeredById: number) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  const nextStage = db.prepare('SELECT * FROM stages WHERE id = ?').get(nextStageId);
  if (!site || !nextStage) return 0;

  const assigneeId = site.supervisor_id || site.vendor_id || triggeredById;
  let taskCount = 0;

  // 1. Primary Operational Task for Stage
  const mainTitle = `[Stage ${nextStage.sequence_order}] ${nextStage.name} Execution`;
  const mainDesc = nextStage.necessary_functions || `Execute all mandatory operations and quality checks for ${nextStage.name}`;
  
  db.prepare(`
    INSERT INTO tasks (site_id, assigned_to, title, description, status, due_date)
    VALUES (?, ?, ?, ?, 'Pending', datetime('now', '+' || COALESCE(?, 7) || ' days'))
  `).run(siteId, assigneeId, mainTitle, mainDesc, nextStage.max_allowed_days || 7);
  taskCount++;

  // 2. Auto-generate tasks from active checklist items for the stage
  const template = db.prepare('SELECT id FROM checklist_templates WHERE stage_id = ? AND is_active = 1').get(nextStageId);
  if (template) {
    const items = db.prepare('SELECT * FROM checklist_items WHERE template_id = ? ORDER BY order_no ASC').all(template.id);
    for (const item of items) {
      const taskTitle = `[${nextStage.name}] Checklist: ${item.question_text}`;
      const taskDesc = `Verify requirement (${item.answer_type}). Mandatory: ${item.is_mandatory ? 'Yes' : 'No'}`;
      db.prepare(`
        INSERT INTO tasks (site_id, assigned_to, title, description, status, due_date)
        VALUES (?, ?, ?, ?, 'Pending', datetime('now', '+' || COALESCE(?, 7) || ' days'))
      `).run(siteId, assigneeId, taskTitle, taskDesc, nextStage.max_allowed_days || 7);
      taskCount++;
    }
  }

  logAction(triggeredById, 'Downstream Tasks Triggered', `Triggered ${taskCount} downstream task(s) for site ${site.name} upon advancing to Stage ${nextStage.name}`, siteId);
  return taskCount;
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
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    console.warn(`JWT verification failed for ${req.method} ${req.originalUrl}:`, err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware: Firebase Authenticate
const firebaseAuthenticate = async (req: any, res: any, next: any) => {
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Resolve identity against existing FLOWVERGE user base
    const resolvedUser = resolveFlowvergeUser({
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified
    });

    if (!resolvedUser) {
      return res.status(403).json({ error: 'User not authorized in FLOWVERGE' });
    }

    if (resolvedUser.status !== 'Active') {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    // Attach both verified identity and authoritative FLOWVERGE context
    req.firebaseUser = decodedToken;
    req.user = resolvedUser; // Normalized context replacing legacy JWT payload

    next();
  } catch (err: any) {
    console.warn('Firebase ID Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
};

// --- AUTH ROUTES ---
app.get('/api/auth/firebase/verify', firebaseAuthenticate, (req: any, res: any) => {
  res.json({ 
    message: 'Firebase identity verified and FLOWVERGE user resolved', 
    firebase_uid: req.firebaseUser.uid,
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      role_id: req.user.role_id,
      status: req.user.status,
      phone_verified: req.user.phone_verified
    }
  });
});

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

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  
  const { password_hash, ...userWithoutPassword } = user;
  logAction(user.id, 'Login', 'User logged in successfully');
  res.json({ token, user: userWithoutPassword });
});

// --- CLOUD SQL / PRISMA ROUTES ---
app.use('/api/prisma', prismaRouter);

app.get('/api/cloudsql/diagnostic', async (req, res) => {
  const startTime = Date.now();
  try {
    const rows = await dbService.query(
      'SELECT version() as version, current_database() as database_name, current_user as db_user, NOW() as server_time'
    );
    const latencyMs = Date.now() - startTime;
    const dbInfo = rows[0] || {};

    res.json({
      success: true,
      status: 'connected',
      latencyMs,
      databaseVersion: dbInfo.version || 'Unknown',
      databaseName: dbInfo.database_name || process.env.SQL_DB_NAME || 'Unknown',
      databaseUser: dbInfo.db_user || process.env.SQL_ADMIN_USER || 'Unknown',
      host: process.env.SQL_HOST || 'Unknown',
      serverTime: dbInfo.server_time || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[Cloud SQL Diagnostic Error]:', err);
    res.status(500).json({
      success: false,
      status: 'disconnected',
      latencyMs,
      error: 'Failed to verify Cloud SQL PostgreSQL connectivity',
      details: err.message,
      host: process.env.SQL_HOST || 'Unknown',
      databaseName: process.env.SQL_DB_NAME || 'Unknown',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/cloudsql/health', async (req, res) => {
  try {
    const health = await checkCloudSqlConnection();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.get('/api/cloudsql/sites', async (req, res) => {
  try {
    const health = await checkCloudSqlConnection();
    const sites = await dbService.sites.getAll();
    res.json({
      status: 'ok',
      health,
      count: sites.length,
      sites,
    });
  } catch (err: any) {
    console.error('[Cloud SQL API Error]:', err);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch sites from Cloud SQL PostgreSQL',
      details: err.message,
    });
  }
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
  const stages = db.prepare(`
    SELECT s.*, 
           ct.name as required_checklist_name,
           (SELECT COUNT(*) FROM checklist_items ci WHERE ci.template_id = COALESCE(s.required_checklist_id, ct.id)) as checklist_item_count
    FROM stages s
    LEFT JOIN checklist_templates ct ON (s.required_checklist_id = ct.id) OR (s.required_checklist_id IS NULL AND ct.stage_id = s.id AND ct.is_active = 1)
    GROUP BY s.id
    ORDER BY s.sequence_order
  `).all();
  res.json(stages);
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

app.get('/api/media', authenticate, (req, res) => {
  const media = db.prepare(`
    SELECT
      ca.id as answer_id,
      ca.answer_value as photo_data,
      ca.photo_metadata,
      ca.remarks,
      ci.question_text,
      cr.submitted_at as date,
      s.id as site_id,
      s.name as site_name,
      st.id as stage_id,
      st.name as stage_name,
      u.full_name as uploader_name
    FROM checklist_answers ca
    JOIN checklist_items ci ON ca.item_id = ci.id
    JOIN checklist_responses cr ON ca.response_id = cr.id
    JOIN checklist_templates ct ON cr.template_id = ct.id
    JOIN sites s ON cr.site_id = s.id
    JOIN stages st ON ct.stage_id = st.id
    JOIN users u ON cr.filled_by = u.id
    WHERE ci.answer_type = 'Photo' OR ca.answer_value LIKE 'data:image%'
    ORDER BY cr.submitted_at DESC
  `).all();
  res.json(media);
});

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

    const insertAnswer = db.prepare('INSERT INTO checklist_answers (response_id, item_id, answer_value, remarks, quantity, photo_metadata) VALUES (?, ?, ?, ?, ?, ?)');
    for (const ans of answers) {
      const metaStr = ans.photo_metadata ? (typeof ans.photo_metadata === 'string' ? ans.photo_metadata : JSON.stringify(ans.photo_metadata)) : null;
      insertAnswer.run(responseId, ans.item_id, ans.answer_value, ans.remarks, ans.quantity, metaStr);
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
            
            const tasksCreated = triggerDownstreamTasks(site.id, nextStage.id, req.user.id);

            if (site.supervisor_id) createNotification(site.supervisor_id, `Stage advanced to ${nextStage.name} for ${site.name}`, 'general');
            if (site.vendor_id) createNotification(site.vendor_id, `Stage advanced to ${nextStage.name} for ${site.name}`, 'general');
            logAction(req.user.id, 'Auto Stage Advance', `System automatically advanced site ${site.name} to stage ${nextStage.name} and triggered ${tasksCreated} downstream tasks`, site_id);
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
  const siteId = Number(req.params.id);
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const existingApproval = db.prepare("SELECT id FROM approvals WHERE linked_type = 'Stage' AND linked_id = ? AND status = 'Pending'").get(siteId);
  if (existingApproval) {
    return res.status(400).json({ error: 'A stage change approval request is already pending for this site.' });
  }

  const result = db.prepare('INSERT INTO approvals (linked_type, linked_id, requested_by, reason) VALUES (?, ?, ?, ?)')
    .run('Stage', siteId, req.user.id, reason || 'Stage change requested');

  // Notify PMs
  const pms = db.prepare("SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Project Manager')").all();
  pms.forEach((pm: any) => {
    createNotification(pm.id, `Stage change request for ${site.name}`, 'approval');
  });

  logAction(req.user.id, 'Stage Change Request', `Requested stage advancement for site ${site.name}`, siteId);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/approvals', authenticate, (req, res) => {
  const statusFilter = (req.query.status as string) || 'Pending';
  
  let query = `
    SELECT a.*, 
           COALESCE(s.name, 'Site #' || a.linked_id) as site_name, 
           s.site_custom_id,
           COALESCE(st_from.name, 'Stage ' || s.current_stage_id) as from_stage_name,
           COALESCE(st_to.name, 'Next Stage') as to_stage_name,
           COALESCE(u_req.full_name, 'Unknown User') as requested_by_name,
           COALESCE(u_req.full_name, 'Unknown User') as requester_name,
           COALESCE(r_req.name, 'User') as requested_by_role,
           u_req.email as requested_by_email,
           COALESCE(u_app.full_name, 'N/A') as approved_by_name,
           COALESCE(r_app.name, 'N/A') as approved_by_role
    FROM approvals a
    LEFT JOIN sites s ON a.linked_id = s.id
    LEFT JOIN stages st_from ON s.current_stage_id = st_from.id
    LEFT JOIN stages st_to ON st_to.sequence_order = st_from.sequence_order + 1
    LEFT JOIN users u_req ON a.requested_by = u_req.id
    LEFT JOIN roles r_req ON u_req.role_id = r_req.id
    LEFT JOIN users u_app ON a.approved_by = u_app.id
    LEFT JOIN roles r_app ON u_app.role_id = r_app.id
  `;

  if (statusFilter !== 'all') {
    query += ` WHERE a.status = '${statusFilter}'`;
  }

  query += ` ORDER BY a.created_at DESC`;

  const approvals = db.prepare(query).all();
  res.json(approvals);
});

app.post('/api/approvals/:id', authenticate, (req: any, res) => {
  const { status, reason } = req.body;
  const approvalId = Number(req.params.id);
  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId);
  
  if (!approval) {
    return res.status(404).json({ error: 'Approval request not found' });
  }

  if (approval.status !== 'Pending') {
    return res.status(400).json({ error: `Approval request has already been ${approval.status}` });
  }

  let tasksCreated = 0;

  if (status === 'Approved' && approval.linked_type === 'Stage') {
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(approval.linked_id);
    if (!site) {
      return res.status(404).json({ error: 'Associated site not found' });
    }

    // Checklist Gate Check
    const template = db.prepare('SELECT id FROM checklist_templates WHERE stage_id = ? AND is_active = 1').get(site.current_stage_id);
    if (template) {
      const response = db.prepare('SELECT status FROM checklist_responses WHERE site_id = ? AND template_id = ?').get(site.id, template.id);
      if (!response || (response.status !== 'Submitted' && response.status !== 'Locked')) {
        // If Project Manager or Admin is explicitly approving, allow override but log it
        const isPMOrAdmin = req.user.role === 'Project Manager' || req.user.role === 'Admin';
        if (!isPMOrAdmin) {
          return res.status(400).json({ error: 'Checklist must be submitted before stage change can be approved.' });
        } else {
          logAction(req.user.id, 'Checklist Override', `Project Manager/Admin ${req.user.email} approved stage advancement prior to checklist lock for site ${site.name}`, site.id);
        }
      }
    }

    const nextStage = db.prepare(`
      SELECT id, name FROM stages 
      WHERE sequence_order = (
        SELECT sequence_order + 1 FROM stages WHERE id = ?
      )
    `).get(site.current_stage_id);

    if (!nextStage) {
      return res.status(400).json({ error: 'Site is already at the final stage' });
    }

    db.prepare('INSERT INTO stage_history (site_id, from_stage_id, to_stage_id, changed_by, approved_by) VALUES (?, ?, ?, ?, ?)')
      .run(site.id, site.current_stage_id, nextStage.id, approval.requested_by || req.user.id, req.user.id);
    
    db.prepare('UPDATE sites SET current_stage_id = ?, stage_started_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nextStage.id, site.id);
    
    // Trigger downstream tasks for the new stage
    tasksCreated = triggerDownstreamTasks(site.id, nextStage.id, req.user.id);

    if (site.supervisor_id) createNotification(site.supervisor_id, `Stage advanced to ${nextStage.name} for ${site.name}. ${tasksCreated} downstream tasks assigned.`, 'general');
    if (site.vendor_id) createNotification(site.vendor_id, `Stage advanced to ${nextStage.name} for ${site.name}.`, 'general');
    
    const approver = db.prepare(`SELECT u.full_name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(req.user.id);
    const approverText = approver ? `${approver.full_name} (${approver.role})` : `User #${req.user.id}`;

    logAction(req.user.id, 'Stage Change Approved', `Stage advancement for site ${site.name} to ${nextStage.name} APPROVED by ${approverText}. Triggered ${tasksCreated} downstream task(s).`, site.id);
  } else if (status === 'Rejected' && approval.linked_type === 'Stage') {
    const site = db.prepare('SELECT name FROM sites WHERE id = ?').get(approval.linked_id);
    const rejector = db.prepare(`SELECT u.full_name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(req.user.id);
    const rejectorText = rejector ? `${rejector.full_name} (${rejector.role})` : `User #${req.user.id}`;
    
    if (site) {
      logAction(req.user.id, 'Stage Change Rejected', `Stage advancement for site ${site.name} REJECTED by ${rejectorText}. Reason: ${reason || 'No reason provided'}`, approval.linked_id);
    }
  }

  db.prepare('UPDATE approvals SET status = ?, approved_by = ?, reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.user.id, reason || status, approvalId);
  
  if (approval.requested_by) {
    createNotification(approval.requested_by, `Your ${approval.linked_type} request was ${status} by Project Management.`, 'approval');
  }
  res.json({ success: true, tasks_created: tasksCreated });
});

// --- LOGS & STATE TRANSITION AUDIT ROUTES ---
app.get('/api/logs', authenticate, (req, res) => {
  const siteId = req.query.siteId ? Number(req.query.siteId) : null;
  let query = `
    SELECT l.*, 
           COALESCE(u.full_name, 'System') as user_name,
           COALESCE(r.name, 'System') as user_role,
           s.name as site_name
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN sites s ON l.site_id = s.id
  `;
  const params: any[] = [];
  if (siteId) {
    query += ` WHERE l.site_id = ?`;
    params.push(siteId);
  }
  query += ` ORDER BY l.timestamp DESC LIMIT 250`;

  res.json(db.prepare(query).all(...params));
});

// --- TASK EXECUTION ROUTES ---
app.get('/api/sites/:id/tasks', authenticate, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.full_name as assignee_name, r.name as assignee_role
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE t.site_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);
  res.json(tasks);
});

app.post('/api/sites/:id/tasks', authenticate, (req: any, res) => {
  const { title, description, assigned_to, due_date } = req.body;
  const siteId = Number(req.params.id);
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const result = db.prepare(`
    INSERT INTO tasks (site_id, assigned_to, title, description, status, due_date)
    VALUES (?, ?, ?, ?, 'Pending', ?)
  `).run(siteId, assigned_to || req.user.id, title, description || '', due_date || null);

  logAction(req.user.id, 'Create Task', `Created task '${title}' for site ID ${siteId}`, siteId);
  res.json({ id: result.lastInsertRowid });
});

app.patch('/api/tasks/:id', authenticate, (req: any, res) => {
  const { status } = req.body;
  const taskId = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
  logAction(req.user.id, 'Update Task Status', `Updated task '${task.title}' status to ${status}`, task.site_id);
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
    SELECT u.id, u.full_name, u.email, u.phone, u.status, u.language_preference, u.created_at, u.role_id,
           r.name as role, r.name as role_name
    FROM users u 
    JOIN roles r ON u.role_id = r.id
  `).all();
  res.json(users);
});

app.post('/api/admin/users', authenticate, (req: any, res) => {
  const { full_name, email, password, role_id, phone, status } = req.body;
  if (!full_name || !email || !password || !role_id) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const result = db.prepare('INSERT INTO users (full_name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(full_name, email, hash, role_id, phone || '', status || 'Active');
  
  logAction(req.user.id, 'Create User', `Created user ${full_name} (${email})`, null);
  res.json({ id: result.lastInsertRowid, success: true });
});

app.put('/api/admin/users/:id', authenticate, (req: any, res) => {
  const { full_name, email, password, role_id, phone, status } = req.body;
  const userId = req.params.id;
  
  if (!full_name || !email || !role_id) {
    return res.status(400).json({ error: 'Full name, email, and role are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
  if (existing) {
    return res.status(400).json({ error: 'Another user with this email already exists.' });
  }

  if (password && password.trim().length > 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    db.prepare('UPDATE users SET full_name = ?, email = ?, password_hash = ?, role_id = ?, phone = ?, status = ? WHERE id = ?')
      .run(full_name, email, hash, role_id, phone || '', status || 'Active', userId);
  } else {
    db.prepare('UPDATE users SET full_name = ?, email = ?, role_id = ?, phone = ?, status = ? WHERE id = ?')
      .run(full_name, email, role_id, phone || '', status || 'Active', userId);
  }

  logAction(req.user.id, 'Update User', `Updated user ${full_name} (ID ${userId})`, null);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', authenticate, (req: any, res) => {
  const targetUserId = Number(req.params.id);
  if (req.user.id === targetUserId) {
    return res.status(400).json({ error: 'You cannot delete your own logged-in account.' });
  }

  db.prepare('UPDATE sites SET supervisor_id = NULL WHERE supervisor_id = ?').run(targetUserId);
  db.prepare('UPDATE sites SET vendor_id = NULL WHERE vendor_id = ?').run(targetUserId);

  db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);
  logAction(req.user.id, 'Delete User', `Deleted user ID ${targetUserId}`, null);
  res.json({ success: true });
});

app.get('/api/admin/users/:id/details', authenticate, (req: any, res) => {
  const userId = req.params.id;
  const user = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.status, u.language_preference, u.created_at,
           r.id as role_id, r.name as role_name, r.description as role_description
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const assignedSites = db.prepare(`
    SELECT id, site_custom_id, name, location, stage_started_at, status
    FROM sites
    WHERE supervisor_id = ? OR vendor_id = ?
  `).all(userId, userId);

  const recentLogs = db.prepare(`
    SELECT l.*, s.name as site_name
    FROM logs l
    LEFT JOIN sites s ON l.site_id = s.id
    WHERE l.user_id = ?
    ORDER BY l.timestamp DESC LIMIT 15
  `).all(userId);

  res.json({
    user,
    assignedSites,
    recentLogs
  });
});

app.get('/api/admin/roles', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM roles').all());
});

app.get('/api/admin/stages', firebaseAuthenticate, checkRole(['Admin', 'Project Manager']), async (req, res) => {
  try {
    // --- POSTGRESQL CUTOVER ---
    // The query has been migrated to Postgres to serve as the first operational read.
    const stages = await dbService.stages.getStagesWithChecklistMetrics();
    
    // Add safe diagnostics header
    res.setHeader('X-Flowverge-Data-Source', 'PostgreSQL');
    res.json(stages);

    // --- SQLITE ROLLBACK ---
    // Uncomment this block and remove the Postgres block above to rollback to SQLite.
    /*
    const stages = db.prepare(`
      SELECT s.*, 
             ct.name as required_checklist_name,
             (SELECT COUNT(*) FROM checklist_items ci WHERE ci.template_id = COALESCE(s.required_checklist_id, ct.id)) as checklist_item_count
      FROM stages s
      LEFT JOIN checklist_templates ct ON (s.required_checklist_id = ct.id) OR (s.required_checklist_id IS NULL AND ct.stage_id = s.id AND ct.is_active = 1)
      GROUP BY s.id
      ORDER BY s.sequence_order
    `).all();
    res.json(stages);
    */
  } catch (error: any) {
    console.error('Error fetching stages from Postgres:', error);
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
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
function checkRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// --- ADMIN WORKFLOW ROUTES ---
app.post('/api/admin/stages', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { 
    name, sequence_order, max_allowed_days, working_principle, necessary_functions,
    assigned_role, attendance_mode, who_assigns_work, approver_role, required_checklist_id 
  } = req.body;

  const result = db.prepare(`
    INSERT INTO stages (
      name, sequence_order, max_allowed_days, working_principle, necessary_functions,
      assigned_role, attendance_mode, who_assigns_work, approver_role, required_checklist_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, sequence_order, max_allowed_days || 7, working_principle || '', necessary_functions || '',
    assigned_role || 'Site Supervisor', attendance_mode || 'Free for All Users', who_assigns_work || 'Project Manager',
    approver_role || 'Project Manager', required_checklist_id || null
  );

  logAction(req.user.id, 'Create Stage', `Created stage ${name}`, null);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/stages/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { 
    name, sequence_order, max_allowed_days, working_principle, necessary_functions,
    assigned_role, attendance_mode, who_assigns_work, approver_role, required_checklist_id 
  } = req.body;

  db.prepare(`
    UPDATE stages SET 
      name = ?, sequence_order = ?, max_allowed_days = ?, working_principle = ?, necessary_functions = ?,
      assigned_role = ?, attendance_mode = ?, who_assigns_work = ?, approver_role = ?, required_checklist_id = ?
    WHERE id = ?
  `).run(
    name, sequence_order, max_allowed_days, working_principle, necessary_functions,
    assigned_role || 'Site Supervisor', attendance_mode || 'Free for All Users', who_assigns_work || 'Project Manager',
    approver_role || 'Project Manager', required_checklist_id || null, req.params.id
  );

  logAction(req.user.id, 'Update Stage', `Updated stage ${name}`, null);
  res.json({ success: true });
});

app.delete('/api/admin/stages/:id', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  db.prepare('DELETE FROM stages WHERE id = ?').run(req.params.id);
  logAction(req.user.id, 'Delete Stage', `Deleted stage ID ${req.params.id}`, null);
  res.json({ success: true });
});

app.get('/api/admin/checklists', firebaseAuthenticate, checkRole(['Admin', 'Project Manager']), (req, res) => {
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

app.get('/api/admin/checklists/:id/items', firebaseAuthenticate, checkRole(['Admin', 'Project Manager']), (req, res) => {
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

// --- CSV CHECKLIST TEMPLATE & BULK UPLOAD ENDPOINTS ---
app.get('/api/admin/checklists/csv-template', (req, res) => {
  const csvContent = `"Question Text","Answer Type","Mandatory","Requires Photo","Order"
"Is site perimeter secure with safety fencing?","Yes/No","Yes","Yes",1
"Soil compaction bearing test value (kPa)","Number","Yes","No",2
"General excavation safety observations and notes","Text","No","No",3
"Foundation rebar structure photo verification","Photo","Yes","Yes",4`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="checklist_items_template.csv"');
  res.send(csvContent);
});

app.post('/api/admin/checklists/:id/items/bulk-csv', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const templateId = req.params.id;
  const { items, mode } = req.body; // mode: 'replace' | 'append'

  const template = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(templateId);
  if (!template) return res.status(404).json({ error: 'Checklist template not found' });

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No valid checklist items provided' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO checklist_items (template_id, question_text, answer_type, is_mandatory, requires_photo, order_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteStmt = db.prepare('DELETE FROM checklist_items WHERE template_id = ?');

  const transaction = db.transaction(() => {
    if (mode === 'replace') {
      deleteStmt.run(templateId);
    }

    let count = 0;
    for (const item of items) {
      if (!item.question_text || !item.question_text.trim()) continue;
      
      const qText = item.question_text.trim();
      let aType = item.answer_type || 'Yes/No';
      const cleanType = String(aType).toLowerCase();
      if (cleanType.includes('photo')) aType = 'Photo';
      else if (cleanType.includes('num')) aType = 'Number';
      else if (cleanType.includes('text')) aType = 'Text';
      else aType = 'Yes/No';

      const mandatory = (item.is_mandatory === true || item.is_mandatory === 1 || String(item.is_mandatory).toLowerCase() === 'yes' || String(item.is_mandatory).toLowerCase() === 'true') ? 1 : 0;
      const reqPhoto = (item.requires_photo === true || item.requires_photo === 1 || String(item.requires_photo).toLowerCase() === 'yes' || String(item.requires_photo).toLowerCase() === 'true') ? 1 : 0;
      const orderNo = item.order_no ? Number(item.order_no) : (count + 1);

      insertStmt.run(templateId, qText, aType, mandatory, reqPhoto, orderNo);
      count++;
    }
    return count;
  });

  const insertedCount = transaction();
  logAction(req.user.id, 'CSV Checklist Import', `Imported ${insertedCount} items into template '${template.name}' (${mode || 'append'} mode)`, null);
  res.json({ success: true, count: insertedCount });
});

app.post('/api/admin/checklists/import-csv', authenticate, checkRole(['Admin', 'Project Manager']), (req: any, res) => {
  const { stage_id, name, items } = req.body;
  if (!stage_id || !name) {
    return res.status(400).json({ error: 'Stage ID and checklist name are required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided in CSV' });
  }

  const insertTemplateStmt = db.prepare('INSERT INTO checklist_templates (stage_id, name) VALUES (?, ?)');
  const insertItemStmt = db.prepare(`
    INSERT INTO checklist_items (template_id, question_text, answer_type, is_mandatory, requires_photo, order_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const templateResult = insertTemplateStmt.run(stage_id, name);
    const templateId = templateResult.lastInsertRowid;

    let count = 0;
    for (const item of items) {
      if (!item.question_text || !item.question_text.trim()) continue;

      const qText = item.question_text.trim();
      let aType = item.answer_type || 'Yes/No';
      const cleanType = String(aType).toLowerCase();
      if (cleanType.includes('photo')) aType = 'Photo';
      else if (cleanType.includes('num')) aType = 'Number';
      else if (cleanType.includes('text')) aType = 'Text';
      else aType = 'Yes/No';

      const mandatory = (item.is_mandatory === true || item.is_mandatory === 1 || String(item.is_mandatory).toLowerCase() === 'yes' || String(item.is_mandatory).toLowerCase() === 'true') ? 1 : 0;
      const reqPhoto = (item.requires_photo === true || item.requires_photo === 1 || String(item.requires_photo).toLowerCase() === 'yes' || String(item.requires_photo).toLowerCase() === 'true') ? 1 : 0;
      const orderNo = item.order_no ? Number(item.order_no) : (count + 1);

      insertItemStmt.run(templateId, qText, aType, mandatory, reqPhoto, orderNo);
      count++;
    }
    return { templateId, count };
  });

  const result = transaction();
  logAction(req.user.id, 'CSV Checklist Creation', `Created checklist '${name}' with ${result.count} items via CSV import`, null);
  res.json({ success: true, id: result.templateId, count: result.count });
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

// --- AI PROXY ROUTE ---
app.post("/api/ai/generateContent", authenticate, async (req, res) => {
  try {
    const { model, contents } = req.body;
    const settings = db.prepare("SELECT key, value FROM system_settings WHERE key IN (?, ?)").all("AI_API_KEY", "AI_MODEL");
    const customKey = settings.find((s) => s.key === "AI_API_KEY")?.value;
    const customModel = settings.find((s) => s.key === "AI_MODEL")?.value;

    const apiKey = customKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing Gemini API Key configuration. Please configure it in the app Admin Settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    let resolvedModel = model || customModel || "gemini-3.6-flash";
    if (!resolvedModel || resolvedModel.includes("3.6") || resolvedModel.includes("2.0") || resolvedModel.includes("preview")) {
        resolvedModel = "gemini-3.6-flash";
    }

    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: contents
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate AI content", details: error.message });
  }
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
