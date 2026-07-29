# FLOWVERGE
## Project Memory & Verified Implementation State — Memory.md

Status: ACTIVE
Purpose: Maintain verified project state, architecture decisions, implementation history, and current development position.

---

# 1. MEMORY RULE

This file records FACTS about the FLOWVERGE project.

It must distinguish between:

- approved requirements
- architectural decisions
- verified existing implementation
- completed implementation
- tested implementation
- planned work

Never record a feature as implemented merely because it appears in:

- PRD.md
- Architecture.md
- Design.md
- Phases.md

Actual implementation must be verified from the codebase and, where applicable, tested.

---

# 2. PRODUCT

Product Name:
FLOWVERGE

Product Category:
Field Project Execution & Operations Intelligence Platform

Initial Market:
Site-based infrastructure execution.

Initial verticals include:

- Solar EPC
- Telecom Rollout
- EV Infrastructure
- Fiber Deployment
- Infrastructure Installation
- Infrastructure Maintenance

Core architecture must remain configurable for additional site-based infrastructure verticals.

---

# 3. DEVELOPMENT STRATEGY

CONFIRMED:

FLOWVERGE already has an existing application.

The existing application is the development starting point.

DO NOT rebuild FLOWVERGE from scratch.

Development strategy:

Inspect
→ Preserve
→ Stabilize
→ Migrate
→ Extend
→ Test
→ Pilot
→ Harden
→ Launch

---

# 4. APPROVED PRODUCT DOCUMENTATION

The following specification documents have been created:

PRD.md
Status: APPROVED

Architecture.md
Status: APPROVED

Rules.md
Status: APPROVED

Design.md
Status: APPROVED

Phases.md
Status: APPROVED

Memory.md
Status: ACTIVE

These documents form the current development specification.

---

# 5. APPROVED ARCHITECTURE DECISIONS

The following decisions are confirmed.

## Production Database

PostgreSQL

## Authentication

Firebase Authentication

Firebase handles user identity.

## Authorization

FLOWVERGE backend handles:

- roles
- permissions
- tenant access
- resource access
- entitlement enforcement

## Production File Storage

Cloud object storage.

Photos and documents must not be stored as production Base64 blobs in PostgreSQL.

PostgreSQL stores:

- file references
- metadata
- relationships
- operational records

## Architecture Style

Modular Monolith

Microservices are NOT currently approved.

## Tenant Boundary

Organization

## Platform Administration

FLOWVERGE has a separate platform-level administrative security scope.

Platform administration is NOT an ordinary customer organization role.

## Entitlements

Organization service entitlements are separate from user permissions.

---

# 6. APPROVED PLATFORM HIERARCHY

FLOWVERGE Platform
→ Platform Administration
→ Customer Organization
→ Project
→ Region / Cluster where applicable
→ Site
→ Workflow
→ Stage
→ Task / Action

Supporting domains include:

- Users
- Memberships
- Roles
- Permissions
- Entitlements
- Teams
- Vendors
- Evidence
- Issues
- SLA
- Approvals
- Quality
- NCR
- Materials
- Warehouses
- Documents
- Commercial Readiness
- Notifications
- Audit
- Reporting
- Intelligence

---

# 7. APPROVED PLATFORM ADMIN DIRECTION

Platform Administration should eventually support:

- organization provisioning
- organization status
- organization admin assignment
- plans
- entitlements
- limits
- usage
- service/subscription status
- platform operations
- platform audit
- controlled support access

Not all capabilities are required immediately.

Implementation follows Phases.md.

---

# 8. APPROVED PRODUCT PRINCIPLES

FLOWVERGE is:

Action-First

Exception-Driven

Role-Based

Evidence-Driven

Accountable

Traceable

Configurable

Important operational information should answer:

WHAT happened?

WHO owned it?

WHO performed it?

WHO submitted it?

WHO reviewed it?

WHO approved/rejected it?

WHEN?

WHAT evidence existed?

WHAT changed later?

WHO currently owns the next action?

---

# 9. ACCOUNTABILITY DECISION

CONFIRMED:

FLOWVERGE must distinguish:

Responsibility
Current Accountability
Actual Performer

Important actionable work should have an owner.

If ownership cannot be resolved:

UNASSIGNED

must be represented as an operational exception.

Ownership transfers must preserve previous ownership history.

---

# 10. TRACEABILITY DECISION

CONFIRMED:

Critical operational history must remain traceable.

Example:

Vendor performs work
→ Supervisor submits
→ QE inspects
→ QE approves
→ Later re-verification identifies non-conformance

FLOWVERGE must preserve the original records and the later finding.

Original history must not be silently rewritten.

---

# 11. QUALITY / RE-VERIFICATION DECISION

CONFIRMED:

A later inspection/re-verification does NOT overwrite an earlier inspection.

Example:

Original QC
PASS
QE A
13 Aug 2026

Re-verification
FAIL
QE B
18 Feb 2027

Both remain part of site history.

FLOWVERGE records facts and evidence.

It does not automatically conclude bribery, fraud, negligence, or intent.

---

# 12. MATERIAL DECISION

CONFIRMED:

Inventory should use transaction history.

Conceptual transactions:

RECEIVE
ISSUE
TRANSFER
RETURN
ADJUSTMENT

Current stock should derive from valid transactions.

Where applicable, FLOWVERGE should support:

Requirement
→ Allocation
→ Issue
→ Receipt
→ Installation Context
→ Quality

Warehouse issue alone must not be treated as proof of installation.

---

# 13. AI DECISION

CONFIRMED:

AI is an intelligence/assistance layer.

AI is NOT the operational source of truth.

AI must respect:

- tenant boundaries
- entitlements
- permissions
- resource access

Initial AI should focus primarily on:

- retrieval
- summarization
- explanation
- analysis
- recommendations

Critical autonomous write operations are not approved for the initial implementation.

---

# 14. EXISTING APPLICATION STATUS

IMPORTANT:

The existing application has been audited against the final six-document specification.

The following implementation states are verified:

CURRENT STACK

Frontend:
React 19 + Vite + TypeScript + Tailwind

Backend:
Express

Current Operational Database:
SQLite / better-sqlite3

Target Production Database:
PostgreSQL

Selected PostgreSQL Strategy:
Drizzle ORM + pg pool

Prisma:
STILL PRESENT / NOT PRODUCTION ORM

Authentication Migration:
IN PROGRESS

Firebase Identity Verification:
IMPLEMENTED / tested successfully end-to-end via browser session

Token Routing:
IMPLEMENTED (Legacy JWT and Firebase ID Token are now strictly separated in AuthContext to prevent 'Invalid algorithm' errors caused by generic helpers mistakenly attaching a Firebase token to unmigrated routes).

WebSocket Error Classification:
RESOLVED / Classified as standard development environment noise (HMR disconnected because DISABLE_HMR=true). Not an application defect.

Automatic Firebase User Provisioning:
NOT APPROVED

Authorization:
FLOWVERGE backend controlled

Firebase Test Account:
CONTROLLED DEVELOPMENT TEST USER (akirulislam787@gmail.com)

Unknown Firebase User:
ACCESS DENIED

Workflow Manager Firebase Read Path:
IMPLEMENTED (Checklists, Items, and Admin Stages isolated for Firebase users)

Workflow Manager Firebase Write Path:
NOT YET MIGRATED (10 endpoints identified for future migration)

Firebase-Protected Business Route:
IMPLEMENTED (/api/admin/checklists, /api/admin/stages, /api/admin/checklists/:id/items mapped to firebaseAuthenticate)

Firebase Frontend API Path:
IMPLEMENTED (via firebaseApi in utils/api.ts)

Firebase End-to-End Validation:
NOT TESTED (Genuine Firebase ID token unavailable in environment to fully exercise the route dynamically)

Frontend Backend-Resolved Role:
IMPLEMENTED

Legacy Authentication:
STILL PRESENT

SQLite User/Role Authority:
STILL PRESENT

Authentication Target:
Firebase Authentication identity
+
FLOWVERGE backend authorization.

Current Storage:
Base64 evidence exists in SQLite and requires later migration to cloud object storage.

Multi-Tenancy:
Not implemented.

Testing:
No meaningful automated test foundation currently verified.

Production Status:
NOT READY.

---

# 14b. RECORD MAJOR VERIFIED RISKS

- SQLite remains authoritative.
- PostgreSQL is not yet authoritative.
- No formal PostgreSQL migrations currently exist.
- Firebase/custom JWT authentication conflict.
- static-demo-token causes frontend authentication bypass/broken logged-in state.
- hardcoded JWT secret fallback is unsafe.
- organization tenant isolation is absent.
- Base64 evidence storage is unsuitable for production.
- automated testing foundation is missing.

PostgreSQL Target:
Drizzle + pg

PostgreSQL Foundation:
IMPLEMENTED according to actual work

PostgreSQL Connectivity:
TESTED AND WORKING

Schema Parity:
REACHED PARITY (inventory table removed from Drizzle schema, matching SQLite)

PostgreSQL Development Schema:
CREATED / VERIFIED

SQLite → PostgreSQL Development Data Migration:
COMPLETED AND VALIDATED

PostgreSQL Data Copy:
NON-AUTHORITATIVE

PostgreSQL Shadow Read Validation:
COMPLETED AND VALIDATED (MATCH ACHIEVED)

First PostgreSQL Operational Read:
GET /api/admin/stages

Status:
IMPLEMENTED

Browser Validation:
NOT TESTED until the project owner completes it.

SQLite Corruption Incident:
RECOVERED

Recovery Source:
PostgreSQL Task 11 validated snapshot

Recovered SQLite:
VALIDATED

PostgreSQL:
UNCHANGED

Task 13:
IMPLEMENTED / BROWSER VALIDATION PENDING

SQLite Initialization Concurrency:
HARDENED / TESTED

SQLite WAL:
ENABLED

SQLite Busy Timeout:
ENABLED

Corruption Handling:
FAIL CLOSED

PostgreSQL Recovery Artifact:
PRESERVED

Wildcard Database Deletion:
PROHIBITED

PostgreSQL Writes:
NOT STARTED

Dual Write:
NOT IMPLEMENTED

Evidence Object Storage Migration:
NOT STARTED

Prisma:
STILL PRESENT / NOT PRODUCTION ORM

---

# 15. CURRENT PHASE

Current Phase:

PHASE 0 — COMPLETE

Reason:

- six specification documents created
- repository baseline audited
- database architecture verified
- authentication architecture verified
- production persistence direction selected

Phase 1:

Task 1 (Authentication Foundation): COMPLETED

---

# 16. BASELINE AUDIT OBJECTIVE

The audit must determine what actually exists today.

Inspect:

- package.json
- frontend
- backend
- src structure
- database configuration
- SQLite
- PostgreSQL
- Prisma
- Drizzle
- Firebase
- authentication
- authorization
- API routes
- data models
- projects
- sites
- workflows
- evidence
- photos/files
- issues
- quality
- materials
- documents
- reporting
- AI
- tests
- build
- environment configuration
- deployment configuration

For each major capability classify:

WORKING

PARTIAL

PLACEHOLDER

BROKEN

NOT IMPLEMENTED

UNKNOWN

---

# 17. AUDIT MUST IDENTIFY

The Phase 0 audit should identify:

## Technology

Actual frontend stack

Actual backend stack

Actual database/data-access stack

Actual authentication implementation

Actual storage implementation

## Existing Capabilities

What is genuinely working?

What is partial?

What is UI-only?

What is mock/demo?

What is disconnected?

## Reusable Work

Which existing components/modules should be preserved?

## Conflicts

Examples:

SQLite vs PostgreSQL

Prisma vs Drizzle

multiple authentication approaches

duplicate business models

mock state vs persistent state

## Risks

- migration risk
- data-loss risk
- security risk
- tenant-isolation risk
- architectural conflicts
- build problems
- dependency issues

## Production Gaps

What prevents the current application from being production-ready?

---

# 18. AUDIT RESTRICTIONS

During Phase 0 audit:

DO NOT:

- modify application code
- modify schema
- run destructive migrations
- delete files
- install dependencies
- upgrade dependencies
- redesign UI
- implement features
- change authentication
- change database
- migrate data
- change configuration

Read and inspect only.

Running safe non-mutating checks may be proposed, but code/configuration changes require approval.

---

# 19. AFTER AUDIT

After the baseline audit:

1. Review audit findings.
2. Correct inaccurate findings.
3. Update Memory.md with verified current implementation.
4. Identify reusable existing functionality.
5. Identify production blockers.
6. Define the smallest Phase 1 task.
7. Approve that task.
8. Begin implementation.

Do NOT automatically start Phase 1 after producing the audit.

---

# 20. IMPLEMENTATION HISTORY

Phase 0 involved documentation and read-only repository analysis only.
No application code has been modified under the final architecture.

---

# 21. DECISION LOG

Decision:
Use existing FLOWVERGE application.

Status:
LOCKED

Decision:
PostgreSQL production database.

Status:
LOCKED

Decision:
Firebase Authentication for identity.

Status:
LOCKED

Decision:
FLOWVERGE backend authorization.

Status:
LOCKED

Decision:
Cloud object storage for production photos/documents.

Status:
LOCKED

Decision:
Organization is customer tenant boundary.

Status:
LOCKED

Decision:
Platform Administration is separate from customer organization roles.

Status:
LOCKED

Decision:
Organization entitlements control available product capabilities.

Status:
LOCKED

Decision:
Permission and entitlement are separate concepts.

Status:
LOCKED

Decision:
Modular monolith initial architecture.

Status:
LOCKED

Decision:
Critical operational history must remain traceable.

Status:
LOCKED

Decision:
Re-verification does not overwrite original inspection.

Status:
LOCKED

Decision:
Inventory uses transaction history.

Status:
LOCKED

Decision:
AI is not the operational source of truth.

Status:
LOCKED

Decision:
PostgreSQL + Drizzle/pg is the selected production persistence strategy.

Status:
LOCKED

Decision:
Prisma will not be the production ORM.

Status:
LOCKED

Decision:
SQLite migration will be incremental.

Status:
LOCKED

Decision:
Firebase Authentication will become the identity authority.

Status:
LOCKED

Decision:
FLOWVERGE backend will remain the authorization authority.

Status:
LOCKED

---

# 22. CHANGE LOG

Initial Memory.md created.

Recorded:

- product direction
- architecture decisions
- platform hierarchy
- accountability decision
- traceability decision
- quality history decision
- materials decision
- AI boundaries
- current Phase 0 status
- baseline audit requirements

No application implementation status has been inferred beyond currently confirmed information.

---

# 23. NEXT ACTION

Wait for approval and instructions for the first Phase 1 task.