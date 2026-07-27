import { Router } from 'express';
import prisma from '../db/prisma.ts';

const router = Router();

// ==================== DIAGNOSTIC ENDPOINT ====================

// GET /api/prisma/diagnostic
router.get('/diagnostic', async (req, res) => {
  const startTime = Date.now();
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        version() as version, 
        current_database() as database_name, 
        current_user as db_user, 
        NOW() as server_time
    `;

    const latencyMs = Date.now() - startTime;
    const dbInfo = result[0] || {};

    res.json({
      success: true,
      status: 'connected',
      client: 'Prisma Client',
      latencyMs,
      databaseVersion: dbInfo.version || 'Unknown',
      databaseName: dbInfo.database_name || process.env.SQL_DB_NAME || 'Unknown',
      databaseUser: dbInfo.db_user || process.env.SQL_ADMIN_USER || 'Unknown',
      host: process.env.SQL_HOST || 'Unknown',
      serverTime: dbInfo.server_time || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[Prisma Diagnostic Error]:', error);
    res.status(500).json({
      success: false,
      status: 'disconnected',
      client: 'Prisma Client',
      latencyMs,
      error: 'Failed to verify Cloud SQL PostgreSQL connectivity',
      details: error.message,
      host: process.env.SQL_HOST || 'Unknown',
      databaseName: process.env.SQL_DB_NAME || 'Unknown',
      timestamp: new Date().toISOString(),
    });
  }
});

// ==================== SITE CRUD ROUTES (PRISMA) ====================

// READ ALL SITES
router.get('/sites', async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      include: {
        supervisor: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        tasks: true,
        inventoryItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: sites.length, data: sites });
  } catch (error: any) {
    console.error('[Prisma GET /sites Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sites via Prisma', details: error.message });
  }
});

// READ SITE BY ID
router.get('/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id, 10);
    if (isNaN(siteId)) {
      return res.status(400).json({ success: false, error: 'Invalid Site ID' });
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        supervisor: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true } },
          },
        },
        inventoryItems: true,
      },
    });

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    res.json({ success: true, data: site });
  } catch (error: any) {
    console.error('[Prisma GET /sites/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch site', details: error.message });
  }
});

// CREATE SITE
router.post('/sites', async (req, res) => {
  try {
    const {
      name,
      projectId,
      siteCustomId,
      district,
      client,
      clientSiteId,
      location,
      latitude,
      longitude,
      status,
      currentStage,
      supervisorId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Site name is required' });
    }

    const newSite = await prisma.site.create({
      data: {
        name,
        projectId: projectId || null,
        siteCustomId: siteCustomId || `SITE-${Date.now().toString().slice(-5)}`,
        district: district || null,
        client: client || null,
        clientSiteId: clientSiteId || null,
        location: location || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || 'ON_TIME',
        currentStage: currentStage || 'Site Selection & Survey',
        supervisorId: supervisorId ? parseInt(supervisorId, 10) : null,
      },
      include: {
        supervisor: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Site created successfully', data: newSite });
  } catch (error: any) {
    console.error('[Prisma POST /sites Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to create site', details: error.message });
  }
});

// UPDATE SITE
router.put('/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id, 10);
    if (isNaN(siteId)) {
      return res.status(400).json({ success: false, error: 'Invalid Site ID' });
    }

    const {
      name,
      projectId,
      siteCustomId,
      district,
      client,
      clientSiteId,
      location,
      latitude,
      longitude,
      status,
      currentStage,
      supervisorId,
    } = req.body;

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(name && { name }),
        ...(projectId !== undefined && { projectId }),
        ...(siteCustomId !== undefined && { siteCustomId }),
        ...(district !== undefined && { district }),
        ...(client !== undefined && { client }),
        ...(clientSiteId !== undefined && { clientSiteId }),
        ...(location !== undefined && { location }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(status && { status }),
        ...(currentStage && { currentStage }),
        ...(supervisorId !== undefined && { supervisorId: supervisorId ? parseInt(supervisorId, 10) : null }),
      },
      include: {
        supervisor: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({ success: true, message: 'Site updated successfully', data: updatedSite });
  } catch (error: any) {
    console.error('[Prisma PUT /sites/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update site', details: error.message });
  }
});

// DELETE SITE
router.delete('/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id, 10);
    if (isNaN(siteId)) {
      return res.status(400).json({ success: false, error: 'Invalid Site ID' });
    }

    await prisma.site.delete({
      where: { id: siteId },
    });

    res.json({ success: true, message: `Site ${siteId} deleted successfully` });
  } catch (error: any) {
    console.error('[Prisma DELETE /sites/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to delete site', details: error.message });
  }
});

// ==================== TASK CRUD ROUTES (PRISMA) ====================

// READ ALL TASKS
router.get('/tasks', async (req, res) => {
  try {
    const siteId = req.query.siteId ? parseInt(req.query.siteId as string, 10) : undefined;
    const tasks = await prisma.task.findMany({
      where: siteId ? { siteId } : undefined,
      include: {
        site: { select: { id: true, name: true, status: true } },
        assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error: any) {
    console.error('[Prisma GET /tasks Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks', details: error.message });
  }
});

// READ TASK BY ID
router.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid Task ID' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        site: true,
        assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('[Prisma GET /tasks/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task', details: error.message });
  }
});

// CREATE TASK
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, status, dueDate, siteId, assignedToId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }
    if (!siteId) {
      return res.status(400).json({ success: false, error: 'siteId is required' });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        siteId: parseInt(siteId, 10),
        assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
      },
      include: {
        site: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });
  } catch (error: any) {
    console.error('[Prisma POST /tasks Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to create task', details: error.message });
  }
});

// UPDATE TASK
router.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid Task ID' });
    }

    const { title, description, status, dueDate, siteId, assignedToId } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(siteId && { siteId: parseInt(siteId, 10) }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId ? parseInt(assignedToId, 10) : null }),
      },
      include: {
        site: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({ success: true, message: 'Task updated successfully', data: updatedTask });
  } catch (error: any) {
    console.error('[Prisma PUT /tasks/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update task', details: error.message });
  }
});

// DELETE TASK
router.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid Task ID' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ success: true, message: `Task ${taskId} deleted successfully` });
  } catch (error: any) {
    console.error('[Prisma DELETE /tasks/:id Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task', details: error.message });
  }
});

export default router;
