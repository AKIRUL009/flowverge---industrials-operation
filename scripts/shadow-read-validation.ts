import Database from 'better-sqlite3';
import { pool, db as pgDb } from '../src/db/index.ts';
import * as dbSchema from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

const sqlite = new Database('flowverge.db', { readonly: true });

async function run() {
  console.log('==================================================');
  console.log('SHADOW READ VALIDATION: SQLITE VS POSTGRESQL');
  console.log('==================================================');

  // Matrix results
  const matrix = [];
  const mismatches = [];

  const addMismatch = (operation, recordId, field, sqValue, pgValue, likelyCause, severity, recommendation) => {
    mismatches.push({ operation, recordId, field, sqValue, pgValue, likelyCause, severity, recommendation });
  };

  // 1. User + Role
  console.log('\n--- 1. User + Role ---');
  let sqUserTime = 0, pgUserTime = 0;
  const testEmail = 'akirulislam787@gmail.com';
  
  const startSqU = Date.now();
  const sqUser = sqlite.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.email = ?
  `).get(testEmail);
  sqUserTime = Date.now() - startSqU;

  const startPgU = Date.now();
  const pgUsersRes = await pool.query(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.email = $1
  `, [testEmail]);
  const pgUser = pgUsersRes.rows[0];
  pgUserTime = Date.now() - startPgU;

  let userResult = 'MATCH';
  if (!sqUser || !pgUser) {
    userResult = 'MISMATCH';
    addMismatch('User+Role', testEmail, 'Existence', !!sqUser, !!pgUser, 'Missing record', 'High', 'Check data migration');
  } else {
    if (sqUser.id !== pgUser.id) {
       userResult = 'MISMATCH';
       addMismatch('User+Role', sqUser.id, 'id', sqUser.id, pgUser.id, 'ID mutation', 'High', 'Fix migration sequence');
    }
    if (sqUser.role !== pgUser.role) {
       userResult = 'MISMATCH';
       addMismatch('User+Role', sqUser.id, 'role', sqUser.role, pgUser.role, 'Join issue', 'High', 'Fix query join');
    }
    // check timestamps
    const sqDate = new Date(sqUser.created_at + 'Z').getTime();
    const pgDate = pgUser.created_at ? pgUser.created_at.getTime() : null;
    if (sqDate !== pgDate && !(isNaN(sqDate) && pgDate === null)) {
       userResult = 'EXPECTED REPRESENTATION DIFFERENCE';
       addMismatch('User+Role', sqUser.id, 'created_at', sqUser.created_at, pgUser.created_at, 'Date format conversion (String vs Date object)', 'Low', 'Normalize in application layer');
    }
  }

  matrix.push({
    operation: 'User + Role',
    sqCount: sqUser ? 1 : 0,
    pgCount: pgUser ? 1 : 0,
    fieldEq: userResult === 'MATCH' || userResult === 'EXPECTED REPRESENTATION DIFFERENCE' ? 'YES' : 'NO',
    orderEq: 'N/A',
    timeEq: userResult === 'MATCH' || userResult === 'EXPECTED REPRESENTATION DIFFERENCE' ? 'YES' : 'NO',
    result: userResult,
    sqTime: sqUserTime,
    pgTime: pgUserTime
  });

  // 2. Workflow Stages
  console.log('\n--- 2. Workflow Stages ---');
  let sqStageTime = 0, pgStageTime = 0;

  const startSqS = Date.now();
  const sqStages = sqlite.prepare(`
    SELECT s.*, 
           ct.name as required_checklist_name,
           (SELECT COUNT(*) FROM checklist_items ci WHERE ci.template_id = COALESCE(s.required_checklist_id, ct.id)) as checklist_item_count
    FROM stages s
    LEFT JOIN checklist_templates ct ON (s.required_checklist_id = ct.id) OR (s.required_checklist_id IS NULL AND ct.stage_id = s.id AND ct.is_active = 1)
    GROUP BY s.id
    ORDER BY s.sequence_order
  `).all();
  sqStageTime = Date.now() - startSqS;

  const startPgS = Date.now();
  // Postgres strict GROUP BY fix:
  const pgStagesRes = await pool.query(`
    SELECT s.*, 
           ct.name as required_checklist_name,
           (SELECT COUNT(*) FROM checklist_items ci WHERE ci.template_id = COALESCE(s.required_checklist_id, ct.id)) as checklist_item_count
    FROM stages s
    LEFT JOIN checklist_templates ct ON (s.required_checklist_id = ct.id) OR (s.required_checklist_id IS NULL AND ct.stage_id = s.id AND ct.is_active = 1)
    GROUP BY s.id, ct.id, ct.name
    ORDER BY s.sequence_order
  `);
  const pgStages = pgStagesRes.rows;
  pgStageTime = Date.now() - startPgS;

  let stageResult = 'MATCH';
  if (sqStages.length !== pgStages.length) {
    stageResult = 'MISMATCH';
    addMismatch('Workflow Stages', 'N/A', 'count', sqStages.length, pgStages.length, 'Missing records', 'High', 'Check migration');
  } else {
    for (let i=0; i<sqStages.length; i++) {
       if (sqStages[i].id !== pgStages[i].id) {
           stageResult = 'MISMATCH';
           addMismatch('Workflow Stages', sqStages[i].id, 'order/id', sqStages[i].id, pgStages[i].id, 'Ordering issue', 'High', 'Check ORDER BY');
       }
       if (Number(sqStages[i].checklist_item_count) !== Number(pgStages[i].checklist_item_count)) {
           stageResult = 'MISMATCH';
           addMismatch('Workflow Stages', sqStages[i].id, 'checklist_item_count', sqStages[i].checklist_item_count, pgStages[i].checklist_item_count, 'Subquery issue', 'High', 'Check schema and subquery logic');
       }
    }
  }

  matrix.push({
    operation: 'Workflow Stages',
    sqCount: sqStages.length,
    pgCount: pgStages.length,
    fieldEq: stageResult === 'MATCH' ? 'YES' : 'NO',
    orderEq: stageResult === 'MATCH' ? 'YES' : 'NO',
    timeEq: 'N/A',
    result: stageResult,
    sqTime: sqStageTime,
    pgTime: pgStageTime
  });

  // 3. Checklist Templates
  console.log('\n--- 3. Checklist Templates ---');
  let sqChecklistTime = 0, pgChecklistTime = 0;

  const startSqC = Date.now();
  const sqChecklists = sqlite.prepare(`
    SELECT ct.*, st.name as stage_name 
    FROM checklist_templates ct
    JOIN stages st ON ct.stage_id = st.id
  `).all();
  sqChecklistTime = Date.now() - startSqC;

  const startPgC = Date.now();
  const pgChecklistsRes = await pool.query(`
    SELECT ct.*, st.name as stage_name 
    FROM checklist_templates ct
    JOIN stages st ON ct.stage_id = st.id
  `);
  const pgChecklists = pgChecklistsRes.rows;
  pgChecklistTime = Date.now() - startPgC;

  let checklistResult = 'MATCH';
  if (sqChecklists.length !== pgChecklists.length) {
    checklistResult = 'MISMATCH';
  } else {
    for (let i=0; i<sqChecklists.length; i++) {
       if (sqChecklists[i].id !== pgChecklists[i].id) checklistResult = 'MISMATCH';
       if (sqChecklists[i].stage_name !== pgChecklists[i].stage_name) checklistResult = 'MISMATCH';
    }
  }

  matrix.push({
    operation: 'Checklist Templates',
    sqCount: sqChecklists.length,
    pgCount: pgChecklists.length,
    fieldEq: checklistResult === 'MATCH' ? 'YES' : 'NO',
    orderEq: checklistResult === 'MATCH' ? 'YES' : 'NO',
    timeEq: 'N/A',
    result: checklistResult,
    sqTime: sqChecklistTime,
    pgTime: pgChecklistTime
  });

  // 4. Checklist Items
  console.log('\n--- 4. Checklist Items ---');
  let sqItemsTime = 0, pgItemsTime = 0;
  
  const templateId = sqChecklists.length > 0 ? sqChecklists[0].id : 1;

  const startSqI = Date.now();
  const sqItems = sqlite.prepare(`
    SELECT * FROM checklist_items WHERE template_id = ? ORDER BY order_no
  `).all(templateId);
  sqItemsTime = Date.now() - startSqI;

  const startPgI = Date.now();
  const pgItemsRes = await pool.query(`
    SELECT * FROM checklist_items WHERE template_id = $1 ORDER BY order_no
  `, [templateId]);
  const pgItems = pgItemsRes.rows;
  pgItemsTime = Date.now() - startPgI;

  let itemsResult = 'MATCH';
  if (sqItems.length !== pgItems.length) {
    itemsResult = 'MISMATCH';
  } else {
    for (let i=0; i<sqItems.length; i++) {
       if (sqItems[i].id !== pgItems[i].id) itemsResult = 'MISMATCH';
       if (sqItems[i].question_text !== pgItems[i].question_text) itemsResult = 'MISMATCH';
       // booleans in sqlite are 0/1 integers, in pg they were migrated to ints based on the schema mapping them to integer type. Let's verify:
       if (sqItems[i].is_mandatory !== pgItems[i].is_mandatory) itemsResult = 'MISMATCH';
    }
  }

  matrix.push({
    operation: 'Checklist Items',
    sqCount: sqItems.length,
    pgCount: pgItems.length,
    fieldEq: itemsResult === 'MATCH' ? 'YES' : 'NO',
    orderEq: itemsResult === 'MATCH' ? 'YES' : 'NO',
    timeEq: 'N/A',
    result: itemsResult,
    sqTime: sqItemsTime,
    pgTime: pgItemsTime
  });


  console.log('\n==================================================');
  console.log('COMPARISON MATRIX');
  console.table(matrix);
  
  if (mismatches.length > 0) {
     console.log('\nMISMATCHES FOUND:');
     console.table(mismatches);
  }

  process.exit(0);
}

run();
