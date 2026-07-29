# FLOWVERGE
## System Architecture — Architecture.md

Status: APPROVED
Product: FLOWVERGE
Architecture Style: Modular Monolith
Development Strategy: Incrementally evolve the existing FLOWVERGE application.

---

# 1. Architecture Objective

FLOWVERGE is a multi-tenant Field Project Execution & Operations Intelligence SaaS platform.

The architecture must support:

- Multiple customer organizations
- Platform administration
- Organization-level isolation
- Projects and distributed sites
- Configurable workflows
- Field execution
- Evidence
- Accountability
- Quality
- Materials
- Commercial readiness
- Permanent operational traceability
- Reporting
- AI-assisted operational intelligence

The existing FLOWVERGE application is the starting point.

Do NOT rebuild the application from scratch.

Existing working functionality should be preserved and migrated/refactored incrementally.

---

# 2. High-Level Architecture

FLOWVERGE uses a modular monolith architecture.

High-level structure:

FLOWVERGE PLATFORM
│
├── Platform Administration
│
├── Customer Organizations
│
└── Shared Platform Services
        │
        ▼
React + TypeScript Frontend
        │
        ▼
Firebase Authentication
        │
        ▼
Express / Node.js Backend
        │
        ├── Authorization / RBAC
        ├── Tenant Enforcement
        ├── Entitlement Enforcement
        ├── Domain Services
        ├── Workflow Engine
        ├── Accountability Engine
        ├── Audit / Traceability
        └── Intelligence Services
                │
        ┌───────┴────────┐
        ▼                ▼
   PostgreSQL      Object Storage
 Operational      Photos/Documents
     Data

PostgreSQL is the production operational source of truth.

---

# 3. Architecture Style

Use a modular monolith initially.

The backend remains one deployable application while business domains are separated internally.

Example:

src/
├── platform/
├── organizations/
├── auth/
├── users/
├── projects/
├── sites/
├── workflows/
├── actions/
├── evidence/
├── issues/
├── quality/
├── materials/
├── documents/
├── commercial/
├── reporting/
├── notifications/
├── audit/
└── intelligence/

Exact folders may differ based on the existing codebase.

Do not restructure working code solely to match this example.

Domain boundaries matter more than exact folder names.

---

# 4. Why Not Microservices Now

FLOWVERGE should not begin with microservices.

Microservices would introduce unnecessary complexity in:

- Deployment
- Transactions
- Authentication
- Authorization
- Debugging
- Monitoring
- Data consistency
- Development

The modular monolith should maintain clean domain boundaries so selected services can be separated later if justified by scale.

---

# 5. SaaS Hierarchy

FLOWVERGE hierarchy:

FLOWVERGE Platform
→ Organization
→ Project
→ Region / Cluster
→ Site
→ Workflow
→ Stage
→ Task / Action

Platform-level administration exists above customer organizations.

Organization is the primary customer tenant/security boundary.

---

# 6. Platform Administration Layer

FLOWVERGE requires a separate platform-level administrative scope.

Platform-level capabilities may include:

- Organization provisioning
- Organization activation/suspension
- Plan management
- Entitlement management
- Service limits
- Subscription/service status
- Organization Admin assignment
- Usage visibility
- Platform health
- Platform configuration
- Platform audit
- Controlled support access

Platform administration must NOT be implemented as an ordinary organization role.

Example:

PlatformRole:
PLATFORM_ADMIN

OrganizationRole:
ORGANIZATION_ADMIN
PROJECT_MANAGER
QUALITY_ENGINEER
WAREHOUSE_USER

These are different security scopes.

---

# 7. Platform Admin Interface

The same FLOWVERGE platform may serve both customer and platform administration interfaces.

However, Platform Administration should use a separate protected route/interface.

Example:

Customer Workspace:

/app/...

Platform Administration:

/platform/...

Exact routing may differ.

Customer organization users must not gain platform-level capabilities through frontend route manipulation.

Backend authorization must enforce this separation.

---

# 8. Organization Provisioning

Platform administration provisions customer organizations.

Conceptual model:

Organization
- id
- name
- status
- plan
- createdAt
- updatedAt

OrganizationMembership
- organizationId
- userId
- role/roleId
- status

OrganizationEntitlement
- organizationId
- capability
- enabled
- limits/configuration where applicable

Do not treat this conceptual model as a final database schema.

Actual schema design occurs during implementation planning.

---

# 9. Entitlements

Entitlements control which platform capabilities an organization has purchased or been granted.

Examples:

PROJECTS
SITE_EXECUTION
WORKFLOWS
EVIDENCE
ISSUES
QUALITY
MATERIALS
COMMERCIAL
ADVANCED_REPORTING
AI_INTELLIGENCE
CLIENT_PORTAL
INTEGRATIONS

Entitlements are NOT user permissions.

Access may require:

Organization Entitlement
AND
User Permission
AND
Resource Access

Example:

Organization has QUALITY entitlement.

User has quality.inspect permission.

User is allowed access to Project X.

Only then should the inspection operation be allowed.

Entitlement enforcement must occur server-side.

---

# 10. Multi-Tenancy

Organization is the primary tenant boundary.

Tenant-owned records should carry organization context directly or through a relationship that can be securely resolved.

Examples:

Project → organizationId
Site → Project → organizationId
Warehouse → organizationId
Vendor → organizationId

Queries and mutations must enforce tenant scope.

Do not trust organization IDs supplied by the frontend without validating membership/access.

---

# 11. Tenant Isolation

Tenant isolation must be enforced in backend services/data access.

Bad architecture:

Frontend hides Organization B
but API allows requesting Organization B data.

Correct architecture:

Authenticated User
→ Membership
→ Organization Context
→ Permission Check
→ Resource Check
→ Query

Tenant isolation must apply to:

- reads
- writes
- searches
- reports
- exports
- evidence
- AI queries
- file access
- background operations

---

# 12. Customer Data Access by Platform Personnel

Platform privileges should not automatically grant unrestricted customer operational data access.

Future support access should support controlled mechanisms such as:

- explicit access request
- organization selection
- reason
- limited scope
- expiration where appropriate
- audit record

This prevents platform administration from becoming an invisible tenant-security bypass.

---

# 13. Authentication

Firebase Authentication handles user identity.

Firebase answers:

WHO IS THIS USER?

Typical flow:

Client
→ Firebase Authentication
→ Firebase ID Token
→ FLOWVERGE Backend
→ Verify Token
→ Resolve FLOWVERGE User
→ Resolve Membership / Platform Role
→ Authorize Request

Firebase Authentication does not become the source of truth for operational roles and permissions.

---

# 14. Authorization

FLOWVERGE backend handles authorization.

Authorization may evaluate:

- Platform Role
- Organization Membership
- Organization Status
- Organization Entitlements
- User Role
- User Permissions
- Project Access
- Resource Ownership
- Workflow Rules
- Action Ownership

Frontend UI may hide unauthorized actions for UX.

Backend must independently enforce authorization.

---

# 15. RBAC

FLOWVERGE uses permission-based RBAC.

Example roles may include:

- Organization Admin
- Project Head
- Project Manager
- Area/Cluster Manager
- Supervisor
- Site Engineer
- Technician
- Vendor
- Warehouse User
- Quality Engineer
- Commercial User
- Viewer

Example permissions:

project.create
project.view
site.create
site.update
workflow.execute
evidence.submit
approval.review
quality.inspect
ncr.create
material.issue
commercial.update
report.view

Role names should not be scattered through business logic where permissions can be used instead.

---

# 16. Database

Production database:

PostgreSQL

PostgreSQL stores:

- Organizations
- Memberships
- Entitlements
- Users
- Roles
- Permissions
- Projects
- Sites
- Workflows
- Stages
- Tasks/Actions
- Checklists
- Evidence Metadata
- Issues
- NCRs
- Approvals
- Quality Records
- Material Transactions
- Warehouses
- Documents Metadata
- Commercial Records
- Audit Events
- Operational Reporting Data

PostgreSQL becomes the authoritative operational database.

---

# 17. Existing SQLite

The existing FLOWVERGE application currently uses SQLite.

SQLite must NOT simply be deleted.

Migration process:

Existing SQLite
→ Inspect Schema
→ Identify Actual Data Usage
→ Identify Existing PostgreSQL/ORM Work
→ Define Target Schema
→ Create Migration Strategy
→ Test Migration
→ Validate Data
→ Switch Production Persistence
→ Retire SQLite only when safe

No blind migration.

---

# 18. ORM / Data Access

The existing repository may contain more than one database/data-access approach, including Prisma/Drizzle/PostgreSQL-related work.

Before selecting the production data-access strategy:

- inspect existing code
- identify the active implementation
- identify incomplete/unused implementations
- identify migration risk
- choose one authoritative production strategy

Do not maintain multiple competing database layers without a justified reason.

The final choice must be recorded in Memory.md.

---

# 19. Transaction Boundaries

Critical business operations should use database transactions where atomicity is required.

Example:

Approve Stage
→ Create Approval Decision
→ Complete Stage
→ Activate Next Stage
→ Create Next Action
→ Create Audit Event

These operations should not leave partial state.

If the transaction fails, FLOWVERGE must not show the stage as successfully approved.

---

# 20. Object Storage

Photos and documents must use cloud object storage in production.

PostgreSQL stores:

- storage reference/key
- metadata
- relationships
- uploader
- timestamps
- review state
- revision/history metadata

Do not store production photos/documents as Base64 blobs in PostgreSQL.

---

# 21. Secure File Access

Object storage access must respect FLOWVERGE authorization.

A user should not gain access to customer files simply by knowing a storage URL/key.

File access should use an authorized mechanism such as:

- backend-controlled retrieval
- signed temporary URLs
- equivalent secure storage access

depending on the selected cloud storage provider.

---

# 22. Core Operational Model

Core execution hierarchy:

Organization
→ Project
→ Site
→ Workflow Instance
→ Stage Instance
→ Task / Action

Templates define expected execution.

Instances represent actual execution.

This distinction is important.

Example:

WorkflowTemplate:
Solar EPC v3

WorkflowInstance:
Site IN-XXXX execution using Solar EPC v3

Historical execution should retain which template/version applied.

---

# 23. Template Architecture

Templates may define:

- stages
- tasks
- responsible roles
- checklists
- evidence requirements
- SLA
- dependencies
- approvals
- quality requirements
- document requirements
- completion rules

Templates should be versioned where changes could affect historical interpretation.

Changing a template later must not make historical execution impossible to understand.

---

# 24. Workflow Engine

Workflow engine responsibilities:

- instantiate workflow from template
- determine active stage
- enforce dependencies
- evaluate completion rules
- create required actions
- trigger approvals
- prevent unauthorized transitions
- activate next stage
- record transitions
- integrate with SLA
- integrate with audit history

Workflow rules belong in backend/domain logic.

Do not depend on frontend state alone.

---

# 25. Accountability Engine

Accountability is a core domain capability.

For applicable actions, store or derive:

- responsible party
- current owner
- actual performer
- assigned by
- assigned at
- due date/SLA
- status
- dependencies
- completion result
- evidence
- escalation
- timestamps

Conceptual lifecycle:

Workflow Event
→ Action Created
→ Owner Assigned
→ SLA Starts
→ Action Performed
→ Result/Evidence
→ Action Completed
→ Next Accountability Created

No important actionable item should silently exist without ownership.

---

# 26. Accountability Transfer

Accountability may move across roles as execution progresses.

Example:

Field Execution
→ Submission
→ PM Review
→ Client Approval
→ Execution Team
→ QC
→ Rectification
→ Reinspection

The historical owner must remain available even after accountability transfers.

Do not overwrite ownership history in a way that loses previous responsibility.

---

# 27. Audit / Event Architecture

FLOWVERGE requires append-oriented audit/event history for critical operations.

Audit events may contain:

- event ID
- organization
- actor
- actor role/context
- action/event type
- entity type
- entity ID
- timestamp
- previous state where appropriate
- resulting state
- reason
- metadata

Audit history is not the same thing as application logs.

Application logs help developers operate the software.

Audit history explains business actions.

Both may exist.

---

# 28. Audit Integrity

Ordinary users must not be able to delete or silently rewrite critical audit records.

Corrections should create additional history rather than erasing historical facts.

Example:

QC PASS
followed months later by
RE-VERIFICATION FAIL

Both events remain.

If a record is corrected:

Original Record
→ Correction Event
→ Corrected Record

rather than pretending the original never existed.

---

# 29. Execution Traceability

For critical work FLOWVERGE should be able to reconstruct:

Work Requirement
→ Assigned Party
→ Work Performed
→ Evidence
→ Submission
→ Review
→ Approval / Rejection
→ Quality
→ Correction
→ Re-verification
→ Closure

Where relevant, preserve:

- vendor
- team
- performer
- submitter
- reviewer
- approver
- evidence
- timestamps
- applicable specification
- template/checklist version
- material records
- later findings

---

# 30. Evidence Domain

Evidence is a first-class entity.

Evidence should relate to the business requirement it proves.

Possible relationships:

Evidence
→ Site
→ Stage
→ Task
→ Checklist Item
→ Issue
→ NCR
→ Inspection
→ Approval
→ Document Requirement

Evidence metadata and object storage are separated.

Database:
metadata/reference

Object storage:
actual file

---

# 31. Evidence History

Evidence history should support traceability.

If approved evidence later requires replacement/correction, the previous evidence should not silently disappear.

Possible model:

Evidence Requirement
→ Submission 1
→ Rejected

Evidence Requirement
→ Submission 2
→ Approved

Both remain historically available to authorized users.

---

# 32. Issue Domain

Issues are structured operational entities.

Issue:

- organization
- project/site
- category
- severity
- description
- raisedBy
- owner
- SLA
- status
- evidence
- resolution
- timestamps

Issues may block workflow depending on configured rules.

---

# 33. NCR Domain

Non-Conformance Record is distinct from a generic issue where quality traceability requires it.

Conceptual flow:

Quality Finding
→ NCR
→ Responsible Party
→ Corrective Action
→ Corrective Evidence
→ Reinspection / Re-verification
→ Closure

Original findings remain.

---

# 34. Quality Domain

Quality records may contain:

- inspection
- inspector
- checklist/version
- inspected entity/site/stage
- evidence
- result
- findings
- NCR references
- timestamps
- reinspection relationships

A later inspection must not overwrite an earlier inspection.

---

# 35. Approval Domain

Approvals should use a reusable domain capability rather than unrelated approval implementations across modules.

Approval:

- requester
- approver
- related entity
- request timestamp
- decision
- decision timestamp
- evidence/context
- remarks
- history

Approvals may be used by:

- workflow
- quality
- deviations
- materials
- documents
- commercial operations

---

# 36. SLA & Escalation Domain

SLA should be configurable.

SLA may apply to:

- actions
- issues
- approvals
- inspections
- rectifications
- documents

Conceptual states:

ON_TRACK
ATTENTION
OVERDUE
ESCALATED

SLA logic should be centralized rather than independently reimplemented in every module.

---

# 37. Materials Architecture

Inventory should use a transaction/ledger model.

Transaction types may include:

- RECEIVE
- ISSUE
- TRANSFER
- RETURN
- ADJUSTMENT

Current stock should derive from valid transactions rather than arbitrary editable quantity fields.

Material transactions should preserve:

- material
- quantity
- source
- destination
- site where applicable
- actor
- receiver where applicable
- timestamp
- reference/evidence where required

---

# 38. Material Traceability

Where applicable:

Requirement
→ Allocation
→ Warehouse Issue
→ Site Receipt
→ Installation
→ Quality

Material records should help investigations without automatically concluding misconduct.

---

# 39. Documents Architecture

Documents use object storage plus PostgreSQL metadata.

Document requirements may be configured by:

- organization
- project template
- workflow
- customer/client

Document completion should integrate with commercial readiness where applicable.

---

# 40. Commercial Domain

FLOWVERGE tracks operational commercial readiness.

Example:

Physical Complete
→ Quality Complete
→ Documents Complete
→ Client Acceptance
→ Billing Ready
→ Submitted
→ Closed

Do not turn FLOWVERGE into a full accounting/ERP system during the initial scope.

Integrate with external systems later where required.

---

# 41. Notifications Architecture

Notifications should be generated from meaningful domain events.

Examples:

ActionAssigned
ApprovalRequested
SLAApproaching
SLABreached
QCRejected
RectificationSubmitted
MaterialRequested
IssueEscalated

Avoid tightly coupling notification logic to UI components.

---

# 42. Reporting Architecture

Reports must derive from authoritative operational data.

Dashboards should not maintain independent manually editable totals.

Example:

Blocked Sites = query/derived state from actual site/blocker records.

Every important metric should support drill-down to its underlying records.

---

# 43. Control Tower

Control Tower aggregates exception-oriented operational information.

Sources may include:

- workflow
- actions
- issues
- SLA
- approvals
- quality
- materials
- documents
- commercial readiness

Control Tower is a presentation/aggregation layer.

It must not become a separate source of truth.

---

# 44. My Actions

My Actions aggregates actionable items owned by the current user.

Potential sources:

- tasks
- approvals
- issues
- inspections
- reinspections
- escalations
- material actions
- document actions
- commercial actions

My Actions should derive from domain records rather than duplicate them.

---

# 45. AI Architecture

AI is an intelligence layer over authorized operational data.

Conceptual flow:

User Question
→ Authentication
→ Authorization / Tenant Scope
→ Approved Data Retrieval
→ AI Processing
→ Response

AI must never retrieve unrestricted cross-tenant data.

AI output is not automatically authoritative operational state.

---

# 46. AI Tool Access

Future AI capabilities may use controlled tools/functions for:

- site lookup
- project status
- blocker analysis
- quality history
- material status
- reports

Tool execution must use the same authorization and tenant rules as ordinary application operations.

AI must not receive a privileged bypass around the backend.

---

# 47. AI Write Operations

Initially prioritize read/assist use cases.

Critical writes such as:

- approval
- rejection
- permission change
- entitlement change
- material adjustment
- commercial closure
- audit modification

must not be performed autonomously by AI.

Future AI-assisted writes require explicit controls and user confirmation where appropriate.

---

# 48. API Architecture

Frontend communicates with backend APIs.

API responsibilities include:

- validate authentication
- establish security context
- enforce entitlement
- enforce permission
- enforce tenant/resource access
- validate input
- execute domain logic
- perform transaction
- record required audit events
- return sanitized response

Business rules should not live only in frontend components.

---

# 49. Validation

All externally supplied input must be validated server-side.

Validation should cover:

- IDs
- enums
- dates
- quantities
- workflow transitions
- file metadata
- organization context
- user-provided text where required

Client-side validation improves UX but is not sufficient.

---

# 50. Error Handling

Errors should be:

- explicit
- structured
- logged appropriately
- safe for the user
- useful for debugging

Do not expose:

- database credentials
- stack traces in production
- internal secrets
- raw tokens
- sensitive tenant information

Critical failures must not be reported as success.

---

# 51. Observability

Production architecture should eventually include:

- application logging
- error monitoring
- performance monitoring
- health checks
- database monitoring
- storage monitoring
- audit history
- backup monitoring

Platform Admin may receive appropriate platform-health visibility.

---

# 52. Backups & Recovery

Production readiness requires:

- PostgreSQL backups
- backup verification
- restoration procedure
- object storage durability/versioning strategy where appropriate
- disaster recovery documentation

A backup that has never been tested for restoration is not sufficient evidence of recoverability.

---

# 53. Security Boundaries

FLOWVERGE contains at least these security scopes:

1. Platform Scope
2. Organization Scope
3. Project / Resource Scope
4. User Permission Scope
5. Entitlement Scope

Access decisions should consider the appropriate combination.

Example:

Can User X inspect Site Y?

Check:

Authenticated?
→ Organization Active?
→ Required Entitlement Enabled?
→ User belongs to Organization?
→ quality.inspect Permission?
→ User has access to Project/Site?
→ Workflow allows inspection?

Only then allow.

---

# 54. Secrets

Secrets must not be hardcoded into source code.

Examples:

- database credentials
- Firebase service credentials
- storage credentials
- API keys
- AI provider credentials

Use environment/secret-management mechanisms appropriate to deployment.

---

# 55. Development Environments

Architecture should support at least:

Development
Testing/Staging
Production

Production data should not be casually used in development environments.

Configuration should be environment-specific.

---

# 56. Migration Strategy

Architecture migration must be incremental.

General approach:

Baseline Existing App
→ Document Current Behavior
→ Add Target Foundation
→ Migrate Data/Capability
→ Test
→ Compare Behavior
→ Switch
→ Remove Legacy Only When Safe

Do not simultaneously replace database, authentication, storage and UI in one uncontrolled change.

---

# 57. Existing Feature Preservation

Before modifying an existing module:

1. Inspect current implementation.
2. Identify working behavior.
3. Identify dependencies.
4. Identify data involved.
5. Define intended change.
6. Implement incrementally.
7. Test existing behavior.
8. Test new behavior.

Do not rebuild working modules merely because cleaner code could be written.

---

# 58. Production Scalability

Design for reasonable SaaS growth without premature distributed complexity.

Important areas:

- proper PostgreSQL indexes
- pagination
- filtered queries
- bounded API responses
- object storage
- caching only where justified
- asynchronous jobs where genuinely required
- efficient reporting queries

Do not optimize hypothetical scale before measuring real bottlenecks.

---

# 59. Background Jobs

Future background processing may be needed for:

- notifications
- SLA evaluation
- report generation
- imports/exports
- AI processing
- file processing

Introduce job infrastructure when an actual use case requires it.

Do not add distributed queues purely for architectural appearance.

---

# 60. Offline Architecture

Offline field execution is planned after the initial launch foundation.

Current architecture should avoid unnecessary decisions that make offline support impossible later.

Future offline requirements may include:

- local drafts
- queued evidence
- synchronization
- conflict handling
- sync status

Do not build full offline synchronization during the initial foundation phases unless explicitly approved.

---

# 61. Integrations

Future integrations may include:

- Google Sheets
- ERP
- Accounting Systems
- Customer Systems
- Messaging
- Maps
- External Storage
- BI Tools

Integrations must not bypass FLOWVERGE security or silently overwrite authoritative execution history.

---

# 62. Platform Billing

Subscription billing is NOT required in the initial foundation.

However, architecture should support:

Organization
→ Plan
→ Entitlements
→ Limits
→ Subscription/Service Status

A billing provider can be integrated later.

Do not build a complex billing engine now.

---

# 63. Platform Administration Audit

Platform-level critical operations should be audited.

Examples:

- organization created
- organization suspended
- plan changed
- entitlement changed
- organization admin changed
- support access granted
- support access revoked
- critical platform configuration changed

Platform audit and organization operational audit may be logically separated.

---

# 64. Data Ownership

Customer operational data belongs to its organization context.

All records should have an unambiguous ownership path.

Avoid records where the system cannot determine which organization owns the data.

This is especially important for:

- evidence
- audit events
- vendors
- materials
- reports
- AI retrieval

---

# 65. Deletion & Historical Records

Deletion strategy must account for operational traceability.

Critical approved execution records should not be casually hard-deleted.

Depending on entity type, use:

- archival
- soft deletion
- deactivation
- append-only correction
- retention policies

where appropriate.

Exact retention policy will be defined before production launch.

---

# 66. Architecture Invariants

The following are architectural invariants unless explicitly changed through an approved architecture decision:

1. Existing FLOWVERGE is evolved, not rebuilt.
2. PostgreSQL is the production operational database.
3. Firebase Authentication handles identity.
4. FLOWVERGE backend handles authorization.
5. Organization is the primary customer tenant boundary.
6. Platform Admin is separate from organization roles.
7. Entitlements are separate from permissions.
8. Tenant isolation is enforced server-side.
9. Photos/documents use object storage.
10. Critical history remains traceable.
11. Workflow rules are backend-enforced.
12. Inventory uses transaction history.
13. AI respects authorization and tenant boundaries.
14. AI does not become the operational source of truth.
15. The initial architecture is a modular monolith.

---

# 67. Target Architecture Evolution

Current FLOWVERGE
        ↓
Baseline Existing Code
        ↓
PostgreSQL + Tenant Foundation
        ↓
Firebase Auth + Backend RBAC
        ↓
Cloud Evidence Storage
        ↓
Accountability + Audit Foundation
        ↓
Workflow / Templates
        ↓
Issues / SLA / NCR
        ↓
Operational UX
        ↓
Materials / Quality / Commercial
        ↓
Reporting / AI
        ↓
Production Hardening
        ↓
Pilot
        ↓
Market Launch

---

# 68. Architecture Success Test

The architecture should eventually allow an authorized user to select a site and reconstruct:

- organization
- project
- site
- workflow/template version
- stage history
- assigned parties
- actions
- actual performers
- evidence
- submissions
- approvals/rejections
- issues
- material history
- quality inspections
- NCRs
- corrective actions
- re-verifications
- documents
- commercial state
- audit history

while maintaining correct tenant and permission boundaries.

---

# 69. Implementation Control

Architecture.md defines the approved target architecture.

It does NOT authorize AI Studio to implement all architecture changes at once.

Implementation order is controlled by:

Phases.md

Current implementation state is controlled by:

Memory.md

Development behavior is controlled by:

Rules.md

User experience is controlled by:

Design.md

Product requirements are controlled by:

PRD.md

Only the currently approved implementation task should be executed.

---

# 70. Current Architecture Status

Target architecture is APPROVED.

Implementation is NOT assumed complete.

The existing codebase must be inspected before any architecture migration.

Do not interpret this document as evidence that PostgreSQL, Firebase, multi-tenancy, Platform Administration, entitlements, object storage, accountability or audit infrastructure are already implemented.

Memory.md must record actual implementation status.