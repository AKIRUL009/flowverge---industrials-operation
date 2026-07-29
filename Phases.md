# FLOWVERGE
## Implementation Roadmap — Phases.md

Status: APPROVED
Product: FLOWVERGE
Strategy: Incrementally transform the existing application into a production-ready multi-tenant SaaS platform.

---

# 1. PURPOSE

This document controls implementation order.

PRD.md defines WHAT FLOWVERGE should become.

Architecture.md defines HOW the system should be structured.

Rules.md defines development boundaries.

Design.md defines UX direction.

Phases.md defines WHEN capabilities should be implemented.

Memory.md records WHAT IS ACTUALLY DONE.

Do not implement later phases merely because they are documented here.

---

# 2. DEVELOPMENT PRINCIPLE

FLOWVERGE already contains substantial functionality.

Therefore:

DO NOT BUILD FROM SCRATCH.

Implementation follows:

INSPECT
→ PRESERVE
→ STABILIZE
→ MIGRATE
→ EXTEND
→ TEST
→ PILOT
→ HARDEN
→ LAUNCH

Every phase begins by comparing target requirements against the actual existing codebase.

---

# 3. STATUS DEFINITIONS

Each phase/task may use:

NOT STARTED

AUDIT REQUIRED

IN PROGRESS

BLOCKED

IMPLEMENTED

TESTED

APPROVED

PRODUCTION READY

Do not mark a task IMPLEMENTED because documentation exists.

Do not mark it TESTED unless relevant tests were actually executed.

---

# 4. ROADMAP

FLOWVERGE development is divided into:

Phase 0 — Baseline & Documentation

Phase 1 — Production Foundation

Phase 2 — Organization, Security & SaaS Foundation

Phase 3 — Core Project & Site Model

Phase 4 — Workflow & Accountability Engine

Phase 5 — Evidence & Field Execution

Phase 6 — Issues, SLA & Approvals

Phase 7 — Quality, NCR & Re-verification

Phase 8 — Materials & Warehouse

Phase 9 — Documents & Commercial Readiness

Phase 10 — Operational UX & Control Tower

Phase 11 — Reporting & Operational Intelligence

Phase 12 — AI Assistance

Phase 13 — Production Hardening

Phase 14 — Pilot

Phase 15 — Market Launch

Phase 16 — Expansion & Advanced Intelligence

These are implementation boundaries, not separate applications.

---

# PHASE 0
# BASELINE & DOCUMENTATION

## Objective

Understand the existing FLOWVERGE application before modifying it.

## Current Status

IN PROGRESS

Documentation is being created.

## Required Documentation

PRD.md
Architecture.md
Rules.md
Design.md
Phases.md
Memory.md

## Baseline Audit

After all six documents exist, inspect the existing repository.

Identify:

- frontend framework
- backend framework
- folder structure
- active database
- SQLite usage
- Prisma usage
- Drizzle usage
- PostgreSQL-related work
- Firebase configuration
- authentication implementation
- authorization implementation
- Firestore usage
- storage implementation
- API structure
- current project model
- current site model
- workflows
- dashboards
- evidence/photos
- issues
- materials
- quality
- reporting
- AI features
- existing tests
- deployment configuration
- environment configuration
- build status

## Deliverable

Produce a CURRENT STATE AUDIT.

For each major capability classify:

WORKING

PARTIAL

PLACEHOLDER

BROKEN

NOT IMPLEMENTED

UNKNOWN

Also identify:

- reusable code
- technical debt
- security risks
- migration risks
- conflicting implementations
- dead/unused code where confidently identifiable

## Critical Rule

PHASE 0 MUST NOT MODIFY APPLICATION CODE.

Inspect and report only.

## Exit Criteria

Phase 0 is complete when:

- all six documents exist
- existing architecture has been inspected
- actual current state is documented
- major migration risks are known
- Memory.md reflects the baseline
- Phase 1 implementation tasks can be defined from evidence

---

# PHASE 1
# PRODUCTION FOUNDATION

## Objective

Create a stable production persistence and backend foundation without destroying existing functionality.

## Major Work

### 1. Database Strategy

Inspect existing:

SQLite
Prisma
Drizzle
PostgreSQL

Select one authoritative production data-access strategy.

Record decision in Memory.md.

### 2. PostgreSQL Foundation

Establish production PostgreSQL configuration.

Requirements:

- environment configuration
- secure credentials
- connection management
- migrations
- development/staging strategy
- production-safe configuration

### 3. Existing Data Migration

Define:

SQLite
→ PostgreSQL

migration strategy.

Preserve existing usable data.

Do not remove SQLite until migration is validated.

### 4. Backend Foundation

Stabilize:

- API structure
- validation
- error handling
- configuration
- database access
- health checks where appropriate

### 5. Environment Separation

Support:

Development
Testing/Staging
Production

Do not mix production credentials with local development.

## Exit Criteria

- PostgreSQL strategy selected
- PostgreSQL working in target environment
- migration approach validated
- existing critical data preserved
- backend builds
- relevant tests pass
- no known task-created data loss
- Memory.md updated

---

# PHASE 2
# ORGANIZATION, SECURITY & SAAS FOUNDATION

## Objective

Create the security and tenancy foundation required for FLOWVERGE to serve multiple organizations.

## Major Work

### 1. Firebase Authentication

Implement/stabilize:

Firebase identity
→ ID token
→ Backend verification
→ FLOWVERGE user

### 2. Organization Model

Introduce:

Organization
Organization Membership
Organization Status

Organization becomes the primary customer tenant boundary.

### 3. Platform Identity

Introduce separate platform-level authorization.

Example:

PLATFORM_ADMIN

must remain separate from customer organization roles.

### 4. Organization Roles & Permissions

Introduce:

Roles
Permissions
Role-Permission Mapping
Membership Role/Access

Prefer permission checks over scattered role-name logic.

### 5. Tenant Enforcement

Enforce organization boundaries server-side.

Test:

Organization A cannot read Organization B.

Organization A cannot modify Organization B.

### 6. Platform Administration Foundation

Implement the minimum required Platform Admin capability:

- organization list
- create organization
- activate/suspend organization
- assign organization admin

Do NOT build a giant SaaS control panel yet.

### 7. Entitlements

Introduce:

Organization
→ Entitlements

Initial implementation should support enabling/disabling capabilities.

### 8. Limits

Prepare basic organization limit model where required.

Examples:

Users
Projects
Storage

Complex usage billing is not required.

### 9. Platform Audit

Record critical platform operations such as:

Organization Created
Organization Suspended
Entitlement Changed
Organization Admin Changed

## Exit Criteria

- Firebase identity works
- backend authorization works
- organizations exist
- tenant isolation is tested
- roles/permissions work
- Platform Admin security scope exists
- organization provisioning works
- entitlement foundation exists
- platform actions are auditable
- Memory.md updated

---

# PHASE 3
# CORE PROJECT & SITE MODEL

## Objective

Establish the authoritative operational hierarchy.

Organization
→ Project
→ Site

## Major Work

### Project

Support:

- organization ownership
- project details
- project status
- dates
- client/customer
- project members
- project access

### Region / Cluster

Support where required without forcing unnecessary hierarchy on every project.

### Site

Site becomes a first-class execution entity.

Support:

- Site ID
- Site Name
- Project
- Location
- Coordinates
- Region/Cluster
- Vendor
- Team
- Status
- Target Dates
- Current Execution Context

### Access

Project/site access must respect:

Tenant
Permission
Resource Access

### Migration

Existing project/site data should be migrated or adapted rather than unnecessarily recreated.

## Exit Criteria

An authorized customer can:

- create/manage projects
- create/manage sites
- assign project access
- view only permitted organization data

Existing useful project/site functionality remains working.

---

# PHASE 4
# WORKFLOW & ACCOUNTABILITY ENGINE

## Objective

Turn FLOWVERGE from a tracker into an execution-control system.

## Major Work

### 1. Workflow Templates

Support configurable:

- stages
- tasks
- dependencies
- completion rules
- approvals
- evidence requirements
- SLA
- responsible roles

### 2. Workflow Instances

A site uses an actual workflow instance created from a template/version.

### 3. Stage Instances

Track:

Not Started
Active
Blocked
Completed

and other controlled states as required.

### 4. Action Model

Create authoritative actionable work.

Action may include:

- type
- owner
- responsible party
- actual performer
- due date
- SLA
- status
- result
- related entity

### 5. Accountability Transfer

Workflow events should create/transfer current accountability.

Example:

Field Submission
→ PM Review

PM Approval
→ Execution Team

Execution Complete
→ QC

QC Reject
→ Rectification Owner

### 6. UNASSIGNED

Important actions without an owner must become:

UNASSIGNED

and visible as exceptions.

### 7. Audit Foundation

Critical workflow/action events create append-oriented history.

### 8. Template Versioning

Historical execution must retain applicable workflow/template version.

## Exit Criteria

One pilot workflow can run:

Start
→ Tasks
→ Submission
→ Review
→ Next Stage
→ Completion

with:

- ownership
- history
- backend transition rules
- accountability transfer
- audit records

---

# PHASE 5
# EVIDENCE & FIELD EXECUTION

## Objective

Create a reliable field execution and evidence system.

## Major Work

### Object Storage

Move production evidence/photos/documents to approved cloud object storage.

Database stores metadata/reference only.

### Evidence Model

Connect evidence to:

- site
- stage
- task
- checklist
- issue
- inspection
- approval

where applicable.

### Evidence Requirements

Support:

Required
Optional
Submitted
Approved
Rejected
Superseded

### Evidence History

Preserve previous submissions.

### Field Experience

Implement:

My Sites
→ Site
→ Next Action
→ Checklist
→ Evidence
→ Submit

### Evidence Gallery

Support:

- grouping
- filtering
- metadata
- review state
- history

### Secure Access

Tenant and resource authorization applies to evidence/files.

## Exit Criteria

A field user can complete an approved site action with required evidence from a mobile-friendly interface.

Evidence remains secure and traceable.

---

# PHASE 6
# ISSUES, SLA & APPROVALS

## Objective

Create structured exception and decision management.

## Major Work

### Issues

Support:

- category
- severity
- description
- owner
- evidence
- status
- resolution
- site/project
- timestamps

### Blockers

Issues may block execution according to workflow rules.

### SLA

Support configurable:

ON TRACK
ATTENTION
OVERDUE
ESCALATED

### Approvals

Create reusable approval capability.

Support:

Request
→ Review
→ Approve / Reject

with:

- requester
- approver
- timestamps
- evidence/context
- remarks
- history

### Notifications

Introduce actionable notifications for major events.

## Exit Criteria

FLOWVERGE can explain:

Why is this site blocked?

Who owns resolution?

How long has it been pending?

What approval is required?

Who made the decision?

---

# PHASE 7
# QUALITY, NCR & RE-VERIFICATION

## Objective

Create permanent quality accountability and corrective-action history.

## Major Work

### Quality Inspection

Support:

- inspection
- inspector
- checklist
- evidence
- result
- findings
- timestamp

### QC Result

PASS
or
REJECT

according to configured rules.

### NCR

Support:

Finding
→ NCR
→ Owner
→ Corrective Action
→ Evidence
→ Reinspection
→ Closure

### Reinspection

A new inspection event.

Never overwrite the original inspection.

### Re-verification

Support later verification of previously completed work.

Example:

Original QC
PASS

Months later:

Re-verification
FAIL

Both remain.

### Traceability

Authorized users should be able to determine:

- who performed work
- who submitted
- who inspected
- who approved
- what evidence existed
- what later finding occurred

## Exit Criteria

A complete quality lifecycle works with preserved historical evidence and attribution.

---

# PHASE 8
# MATERIALS & WAREHOUSE

## Objective

Connect material movement to site execution.

## Major Work

### Material Master

Define materials and relevant units/specifications.

### Warehouses

Support organization warehouses.

### Ledger

Transactions:

RECEIVE
ISSUE
TRANSFER
RETURN
ADJUSTMENT

### Requests

Site/team can request material.

### Allocation

Material can be allocated to project/site.

### Receipt

Where required, record site/team receipt.

### Traceability

Support:

Requirement
→ Allocation
→ Issue
→ Receipt
→ Installation Context
→ QC

Do not automatically claim issued material was installed.

### Stock

Current stock derives from valid transactions.

## Exit Criteria

Warehouse can explain:

What came in?

What went out?

Who issued it?

Who received it?

For which site?

What balance remains?

---

# PHASE 9
# DOCUMENTS & COMMERCIAL READINESS

## Objective

Connect physical execution to handover and billing readiness.

## Major Work

### Document Requirements

Configurable by:

- project
- template
- customer/client
- workflow

### Documents

Use object storage + metadata.

### Handover

Track required completion documents.

### Client Acceptance

Track where required.

### Commercial Readiness

Example:

Physical Complete
→ Quality Complete
→ Documents Complete
→ Client Acceptance
→ Billing Ready
→ Submitted
→ Closed

### Blockers

Explain why a completed site is not commercially ready.

## Exit Criteria

FLOWVERGE can answer:

Which completed sites are not billing-ready?

Why?

Who owns the missing action?

---

# PHASE 10
# OPERATIONAL UX & CONTROL TOWER

## Objective

Bring the underlying operational engine into role-specific user experiences.

Do not build fake dashboards before trustworthy data exists.

## Major Work

### PM / Management

Control Tower

Needs Attention

Project Health

Blocked Sites

SLA Risk

Approval Delays

Quality Problems

Material Problems

Commercial Blockers

### My Actions

Aggregate actual owned actions.

### Field

Improve:

My Sites
Next Action
Checklist
Evidence
Issues

### Quality

Inspection Queue
NCR
Rectification
Reinspection

### Warehouse

Requests
Stock
Transactions

### Platform Admin

Organizations
Entitlements
Usage
Platform Attention

## Exit Criteria

Each major role can identify their next important action without navigating unrelated modules.

---

# PHASE 11
# REPORTING & OPERATIONAL INTELLIGENCE

## Objective

Turn trustworthy execution data into management information.

## Major Work

Reports may include:

- project progress
- site progress
- stage aging
- blocked sites
- SLA
- approval aging
- quality
- NCR
- material
- vendor/team performance
- documents
- commercial readiness
- accountability

### Drill-Down

Metrics must link to underlying records.

### Performance

Add indexes/query optimization based on actual reporting needs.

## Exit Criteria

Important management numbers reconcile with authoritative operational records.

---

# PHASE 12
# AI ASSISTANCE

## Objective

Add AI only after operational data and authorization are trustworthy.

## Initial AI Capabilities

AI may:

- summarize project status
- explain blockers
- identify overdue approvals
- summarize quality history
- analyze material problems
- draft operational reports
- answer authorized questions

Example:

Why is Project X behind?

Which sites are blocked by materials?

Who approved Site X?

Which sites failed re-verification?

### Security

AI uses the same:

Tenant
Entitlement
Permission
Resource Access

rules as the rest of FLOWVERGE.

### Writes

Prioritize read/assist capabilities.

Do not allow autonomous critical operational writes.

## Exit Criteria

AI answers are grounded in authorized FLOWVERGE data and do not bypass security.

---

# PHASE 13
# PRODUCTION HARDENING

## Objective

Prepare the system for real customer pilot usage.

## Security

Test:

- authentication
- authorization
- tenant isolation
- entitlement enforcement
- file access
- input validation
- secrets
- API security

### Reliability

Test:

- database transactions
- error handling
- failed uploads
- failed approvals
- recovery behavior

### Performance

Test realistic:

- site volumes
- evidence volumes
- audit history
- reports
- concurrent usage

### Observability

Implement appropriate:

- logging
- error monitoring
- health monitoring
- database monitoring
- storage monitoring

### Backup & Recovery

Verify:

- database backups
- restoration process
- storage durability
- recovery documentation

### Deployment

Staging and production deployment processes must be repeatable.

## Exit Criteria

No known critical blocker remains for controlled pilot use.

---

# PHASE 14
# PILOT

## Objective

Test FLOWVERGE against real infrastructure execution.

Start with a controlled organization/project.

Do NOT onboard many customers immediately.

## Recommended Pilot

One organization

One real project

Limited users

Limited number of sites

Actual field execution

## Validate

- onboarding
- project creation
- site creation
- assignments
- workflow
- accountability
- evidence
- approvals
- issues
- SLA
- quality
- NCR
- materials
- documents
- commercial readiness
- reporting
- audit history

## Site Reconstruction Test

Choose a completed pilot site and ask:

Tell me everything that happened from allocation to closure.

FLOWVERGE should reconstruct:

- assignments
- stages
- work
- evidence
- approvals
- issues
- quality
- materials
- documents
- history

## Collect

- bugs
- UX problems
- missing rules
- workflow friction
- performance issues
- field feedback
- management feedback

## Exit Criteria

Critical pilot issues are resolved and product behavior is validated with real users.

---

# PHASE 15
# MARKET LAUNCH

## Objective

Onboard initial paying customers safely.

## Requirements

- onboarding process
- organization provisioning
- support process
- plan/entitlement strategy
- production monitoring
- backup/recovery
- customer documentation
- privacy/security documentation as required
- incident process
- usage visibility

### Billing

Integrate an external billing provider when commercially required.

Do not build a custom billing system unless justified.

## Launch Strategy

Start controlled.

Do not attempt massive customer acquisition before operational reliability is proven.

## Exit Criteria

FLOWVERGE can onboard and operate multiple customer organizations safely.

---

# PHASE 16
# EXPANSION & ADVANCED INTELLIGENCE

## Objective

Expand only after the core product has real adoption and trustworthy data.

Potential capabilities:

### Additional Verticals

- EV Infrastructure
- Fiber
- Infrastructure Maintenance
- Other distributed field operations

through configurable templates.

### Offline Execution

Potential:

- local drafts
- offline checklists
- queued evidence
- synchronization
- conflict handling

### Integrations

Potential:

- ERP
- accounting
- customer systems
- Google Sheets
- BI
- messaging
- external APIs

### Advanced AI

Potential:

- delay prediction
- quality risk
- material shortage prediction
- vendor risk
- commercial risk
- recommended intervention
- workforce optimization

Do not build predictive systems before enough trustworthy historical data exists.

---

# 5. PLATFORM ADMIN DEVELOPMENT ORDER

Platform Administration itself should evolve incrementally.

Initial:

Organizations
→ Status
→ Organization Admin
→ Entitlements

Later:

Limits
→ Usage
→ Subscription State
→ Support Access
→ Platform Health

Commercial maturity:

Plans
→ Billing Integration
→ Usage-Based Rules where required

Do not build the final SaaS administration system before the first customer pilot requires it.

---

# 6. ACCOUNTABILITY DEVELOPMENT ORDER

Accountability should evolve:

Action Owner
→ Due Date
→ Status
→ Assignment History
→ Actual Performer
→ SLA
→ Escalation
→ Cross-Module Actions
→ Analytics

Do not begin with complicated scoring algorithms.

First make ownership trustworthy.

---

# 7. AUDIT DEVELOPMENT ORDER

Audit should begin with critical actions:

- authentication/security changes where appropriate
- assignments
- workflow transitions
- approvals
- quality
- material transactions
- entitlement/admin changes

Then expand coverage based on operational importance.

Do not record every UI click as business audit history.

---

# 8. AI DEVELOPMENT ORDER

AI development order:

1. Trustworthy Operational Data
2. Authorization
3. Search/Retrieval
4. Summarization
5. Operational Q&A
6. Recommendations
7. Predictive Intelligence
8. Controlled AI Actions where justified

Do not reverse this order.

---

# 9. WHAT NOT TO BUILD EARLY

Do not prioritize these before core execution works:

- complicated billing engine
- microservices
- advanced predictive AI
- full offline sync
- complex white labeling
- unnecessary social features
- excessive dashboard animation
- large integration marketplace
- opaque vendor scoring
- custom accounting/ERP

These may become useful later.

They are not the initial product.

---

# 10. CURRENT IMPLEMENTATION STATUS

At the time this roadmap is created:

Existing FLOWVERGE:
PARTIALLY BUILT

PRD.md:
APPROVED

Architecture.md:
APPROVED

Rules.md:
APPROVED

Design.md:
APPROVED

Phases.md:
APPROVED

Memory.md:
TO BE CREATED

Existing application baseline:
NOT YET AUDITED AGAINST FINAL DOCUMENTATION

PostgreSQL production migration:
NOT ASSUMED COMPLETE

Firebase production authentication:
NOT ASSUMED COMPLETE

Multi-tenancy:
NOT ASSUMED COMPLETE

Platform Administration:
NOT ASSUMED COMPLETE

Entitlements:
NOT ASSUMED COMPLETE

Production object storage:
NOT ASSUMED COMPLETE

Accountability engine:
NOT ASSUMED COMPLETE

Permanent audit foundation:
NOT ASSUMED COMPLETE

Do not change these statuses without inspecting actual implementation.

---

# 11. IMMEDIATE NEXT STEP

After Phases.md:

1. Create Memory.md.
2. Record that the six-document specification has been established.
3. Do NOT claim target features are implemented.
4. Give AI Studio the Phase 0 baseline-audit instruction.
5. AI Studio inspects the existing codebase.
6. AI Studio changes ZERO application code.
7. Review its audit.
8. Update Memory.md with verified current state.
9. Define the first Phase 1 implementation task.
10. Begin implementation only after approval.

---

# 12. FINAL ROADMAP PRINCIPLE

FLOWVERGE should not become bigger faster than it becomes trustworthy.

The implementation priority is:

TRUSTWORTHY FOUNDATION
→ SECURE TENANCY
→ PROJECT/SITE MODEL
→ EXECUTION
→ ACCOUNTABILITY
→ EVIDENCE
→ EXCEPTIONS
→ QUALITY
→ MATERIALS
→ COMMERCIAL CLOSURE
→ OPERATIONAL UX
→ INTELLIGENCE
→ AI
→ SCALE

Every phase should leave the product more stable than it found it.

---

# IMPLEMENTATION CONTROL

Phases.md controls implementation sequence.

AI Studio must not automatically proceed from one phase to another.

At the end of an approved task:

1. Stop.
2. Report what changed.
3. Report tests performed.
4. Report known issues.
5. Update Memory.md as appropriate.
6. Wait for the next approved implementation instruction.

No phase is considered complete simply because code was generated.