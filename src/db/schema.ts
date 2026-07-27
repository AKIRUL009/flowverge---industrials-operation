import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, real, boolean } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').unique(),
  description: text('description'),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  fullName: text('full_name'),
  phone: text('phone'),
  phoneVerified: integer('phone_verified').default(0),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  roleId: integer('role_id').references(() => roles.id),
  status: text('status').default('Active'),
  languagePreference: text('language_preference').default('English'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stages = pgTable('stages', {
  id: serial('id').primaryKey(),
  name: text('name'),
  sequenceOrder: integer('sequence_order'),
  maxAllowedDays: integer('max_allowed_days'),
  workingPrinciple: text('working_principle'),
  necessaryFunctions: text('necessary_functions'),
  assignedRole: text('assigned_role').default('Site Supervisor'),
  attendanceMode: text('attendance_mode').default('Free for All Users'),
  whoAssignsWork: text('who_assigns_work').default('Project Manager'),
  approverRole: text('approver_role').default('Project Manager'),
  requiredChecklistId: integer('required_checklist_id'),
});

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  projectId: text('project_id'),
  siteCustomId: text('site_custom_id'),
  name: text('name'),
  district: text('district'),
  client: text('client'),
  clientSiteId: text('client_site_id'),
  location: text('location'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  currentStageId: integer('current_stage_id').references(() => stages.id),
  supervisorId: integer('supervisor_id').references(() => users.id),
  vendorId: integer('vendor_id').references(() => users.id),
  status: text('status').default('On Time'),
  stageStartedAt: timestamp('stage_started_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stageHistory = pgTable('stage_history', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id),
  fromStageId: integer('from_stage_id').references(() => stages.id),
  toStageId: integer('to_stage_id').references(() => stages.id),
  changedBy: integer('changed_by').references(() => users.id),
  changeDate: timestamp('change_date').defaultNow(),
  approvedBy: integer('approved_by').references(() => users.id),
  delayReason: text('delay_reason'),
});

export const checklistTemplates = pgTable('checklist_templates', {
  id: serial('id').primaryKey(),
  stageId: integer('stage_id').references(() => stages.id),
  name: text('name'),
  isActive: integer('is_active').default(1),
});

export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => checklistTemplates.id),
  questionText: text('question_text'),
  answerType: text('answer_type'),
  isMandatory: integer('is_mandatory').default(1),
  requiresPhoto: integer('requires_photo').default(0),
  orderNo: integer('order_no'),
});

export const checklistResponses = pgTable('checklist_responses', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => checklistTemplates.id),
  siteId: integer('site_id').references(() => sites.id),
  filledBy: integer('filled_by').references(() => users.id),
  status: text('status').default('Draft'),
  submittedAt: timestamp('submitted_at'),
});

export const checklistAnswers = pgTable('checklist_answers', {
  id: serial('id').primaryKey(),
  responseId: integer('response_id').references(() => checklistResponses.id),
  itemId: integer('item_id').references(() => checklistItems.id),
  answerValue: text('answer_value'),
  remarks: text('remarks'),
  quantity: real('quantity'),
  photoMetadata: text('photo_metadata'),
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  linkedType: text('linked_type'),
  linkedId: integer('linked_id'),
  siteId: integer('site_id').references(() => sites.id),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  filePath: text('file_path'),
  isLocked: integer('is_locked').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const warehouseMaterials = pgTable('warehouse_materials', {
  id: serial('id').primaryKey(),
  name: text('name'),
  category: text('category'),
  unit: text('unit'),
  minStock: real('min_stock'),
});

export const warehouseTransactions = pgTable('warehouse_transactions', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').references(() => warehouseMaterials.id),
  type: text('type'),
  quantity: real('quantity'),
  siteId: integer('site_id').references(() => sites.id),
  userId: integer('user_id').references(() => users.id),
  photoProof: text('photo_proof'),
  remarks: text('remarks'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const aiProblems = pgTable('ai_problems', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id),
  stageId: integer('stage_id').references(() => stages.id),
  reportedBy: integer('reported_by').references(() => users.id),
  category: text('category'),
  description: text('description'),
  status: text('status').default('Open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiSolutions = pgTable('ai_solutions', {
  id: serial('id').primaryKey(),
  problemId: integer('problem_id').references(() => aiProblems.id),
  aiSuggestion: text('ai_suggestion'),
  finalSolution: text('final_solution'),
  approvedBy: integer('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  linkedType: text('linked_type'),
  linkedId: integer('linked_id'),
  requestedBy: integer('requested_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  status: text('status').default('Pending'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  message: text('message'),
  type: text('type'),
  isRead: integer('is_read').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action'),
  details: text('details'),
  siteId: integer('site_id').references(() => sites.id),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  title: text('title'),
  description: text('description'),
  status: text('status').default('Pending'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id),
  receiverId: integer('receiver_id').references(() => users.id),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value'),
  description: text('description'),
  type: text('type'),
});

export const safetyLogs = pgTable('safety_logs', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id),
  reportedBy: integer('reported_by').references(() => users.id),
  category: text('category'),
  description: text('description'),
  severity: text('severity'),
  photoProof: text('photo_proof'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reportsAiWeekly = pgTable('reports_ai_weekly', {
  id: serial('id').primaryKey(),
  weekStart: text('week_start'),
  summary: text('summary'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  unit: text('unit').default('Pcs'),
  quantity: real('quantity').default(0),
  minStock: real('min_stock').default(0),
  remarks: text('remarks'),
  siteId: integer('site_id').references(() => sites.id),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  name: text('name').unique(),
  config: text('config'),
  isEnabled: integer('is_enabled').default(0),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sitesSupervised: many(sites, { relationName: 'supervisor' }),
  sitesVendored: many(sites, { relationName: 'vendor' }),
}));

export const sitesRelations = relations(sites, ({ one }) => ({
  stage: one(stages, { fields: [sites.currentStageId], references: [stages.id] }),
  supervisor: one(users, { fields: [sites.supervisorId], references: [users.id], relationName: 'supervisor' }),
  vendor: one(users, { fields: [sites.vendorId], references: [users.id], relationName: 'vendor' }),
}));
