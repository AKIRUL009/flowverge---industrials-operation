# FLOWVERGE
## AI & Development Rules — Rules.md

Status: APPROVED
Product: FLOWVERGE

These rules govern all AI-assisted and human development of FLOWVERGE.

They apply together with:

- PRD.md
- Architecture.md
- Design.md
- Phases.md
- Memory.md

If implementation conflicts with these rules, stop and report the conflict before making an uncontrolled architectural change.

---

# 1. EXISTING APPLICATION RULE

FLOWVERGE already exists and is partially implemented.

DO NOT rebuild FLOWVERGE from scratch.

Before changing an existing feature:

1. Inspect the current implementation.
2. Understand what already works.
3. Identify dependencies.
4. Identify stored data involved.
5. Determine the smallest safe change.
6. Implement incrementally.
7. Test existing behavior.
8. Test new behavior.

Do not replace working functionality merely because another implementation appears cleaner.

---

# 2. SOURCE-OF-TRUTH DOCUMENTS

Development must follow:

PRD.md
= what FLOWVERGE should become.

Architecture.md
= approved technical architecture.

Rules.md
= development boundaries.

Design.md
= approved UX/UI principles.

Phases.md
= implementation sequence.

Memory.md
= actual current implementation state and decisions.

These documents describe different concerns and should not be treated as interchangeable.

---

# 3. DOCUMENTATION IS NOT IMPLEMENTATION

Never assume a capability exists because it appears in PRD.md or Architecture.md.

Example:

Architecture.md says production uses PostgreSQL.

That does NOT mean PostgreSQL is already active.

Inspect the actual code before making implementation claims.

Memory.md must distinguish:

PLANNED
IN PROGRESS
IMPLEMENTED
TESTED
PRODUCTION READY

where appropriate.

---

# 4. ONE APPROVED TASK AT A TIME

Do not implement multiple phases because they are described in the documentation.

Work only on the currently approved task.

Example:

If the approved task is:

"Create PostgreSQL organization schema"

do NOT also:

- redesign authentication
- migrate evidence storage
- redesign dashboards
- add AI
- rebuild workflow
- change unrelated UI

unless required for the approved task and explicitly identified.

---

# 5. NO UNCONTROLLED REFACTORING

Do not perform large unrelated refactors while implementing a small task.

Refactoring is allowed when:

- required for the approved implementation
- clearly justified
- scope is understood
- existing behavior is preserved
- tests are performed

Do not turn every implementation task into a codebase cleanup project.

---

# 6. CONFIGURE BEFORE CUSTOM CODING

FLOWVERGE serves multiple infrastructure verticals.

Prefer configuration through:

- templates
- workflows
- stages
- checklists
- evidence requirements
- SLA rules
- approval rules
- quality rules
- document requirements
- custom fields

before creating industry-specific business logic.

Do not create separate core systems for:

Solar
Telecom
EV
Fiber

unless a genuine domain requirement cannot reasonably use the shared platform.

---

# 7. MODULAR MONOLITH RULE

FLOWVERGE initially uses a modular monolith.

Do not introduce microservices unless an approved architecture decision explicitly requires them.

Maintain logical domain boundaries inside the application.

---

# 8. DATABASE RULE

PostgreSQL is the approved production operational database.

The existing SQLite implementation must not be deleted before:

- current schema is inspected
- actual usage is understood
- target schema is defined
- migration is tested
- data is validated
- dependent functionality is tested

Do not perform a destructive blind migration.

---

# 9. SINGLE AUTHORITATIVE DATA ACCESS STRATEGY

Inspect the existing codebase for:

- SQLite
- Prisma
- Drizzle
- PostgreSQL
- other persistence implementations

Determine what is actually active.

Do not maintain multiple competing production data-access layers without an approved reason.

Record the selected strategy in Memory.md.

---

# 10. MIGRATION SAFETY

Database migrations must be:

- explicit
- reviewable
- reversible where practical
- tested before production use
- designed to preserve existing data

Never silently drop important production data.

Destructive migrations require explicit approval.

---

# 11. TRANSACTION RULE

Critical business operations must be atomic where partial completion would create inconsistent business state.

Example:

Approval Decision
+ Stage Completion
+ Next Stage Activation
+ Next Action Creation
+ Audit Event

should use a transaction where appropriate.

Do not report success when only part of the critical operation succeeded.

---

# 12. FIREBASE AUTHENTICATION RULE

Firebase Authentication handles identity.

Firebase answers:

WHO IS THE USER?

FLOWVERGE backend determines:

WHAT CAN THE USER DO?

Do not make Firebase custom claims the sole authoritative source for dynamic FLOWVERGE operational authorization unless explicitly approved.

---

# 13. BACKEND AUTHORIZATION RULE

All protected operations require backend authorization.

Frontend hiding is NOT authorization.

Never rely solely on:

- hidden buttons
- hidden routes
- disabled UI
- frontend role checks

to protect business operations.

---

# 14. PLATFORM VS ORGANIZATION SECURITY

Platform-level roles and customer organization roles are separate security scopes.

PLATFORM_ADMIN

must not be treated as simply another customer role such as:

ORGANIZATION_ADMIN
PROJECT_MANAGER
QUALITY_ENGINEER

Customer users must not obtain platform privileges through organization role changes.

---

# 15. PLATFORM ADMIN DATA ACCESS

Platform administration does not automatically mean unrestricted access to customer operational data.

Support/customer-data access should eventually be:

- explicit
- scoped
- purpose-limited
- permission-controlled
- auditable
- time-limited where appropriate

Do not create a hidden super-admin bypass into all customer operational data.

---

# 16. TENANT ISOLATION RULE

Organization is the primary customer tenant boundary.

Every tenant-owned operation must resolve and enforce organization context server-side.

Never trust an organizationId supplied by the frontend without verifying access.

Tenant isolation applies to:

- API reads
- API writes
- searches
- reports
- exports
- files
- evidence
- AI retrieval
- background processing

Cross-tenant data leakage is a critical security defect.

---

# 17. ENTITLEMENTS ARE NOT PERMISSIONS

Organization entitlement determines whether the organization has access to a product capability.

Permission determines whether a particular user may perform an operation.

Example:

QUALITY entitlement = enabled

AND

quality.inspect permission = allowed

may both be required.

Do not merge entitlement and user authorization into one uncontrolled concept.

---

# 18. ORGANIZATION STATUS

Suspended, inactive or otherwise restricted organizations must be handled server-side according to approved service rules.

Do not depend on UI state alone to disable an organization.

---

# 19. RBAC RULE

Prefer permissions over scattered hardcoded role-name checks.

Good:

user has quality.inspect

Avoid:

if role == "QE"

throughout unrelated business logic.

Roles may group permissions.

Business authorization should evaluate actual permission/resource rules.

---

# 20. RESOURCE ACCESS RULE

Having a permission does not automatically grant access to every resource.

Example:

A user with:

site.view

may still only have access to assigned projects or authorized organization resources.

Authorization may require:

Authentication
+ Tenant Membership
+ Entitlement
+ Permission
+ Resource Access
+ Workflow Rule

---

# 21. OBJECT STORAGE RULE

Production photos and documents must use approved cloud object storage.

PostgreSQL stores:

- references
- metadata
- relationships
- audit information

Do not store production photos/documents as Base64 blobs in PostgreSQL.

---

# 22. FILE ACCESS SECURITY

Do not expose permanent unrestricted object-storage URLs when files are protected.

File access must respect:

- organization
- project/resource access
- permission
- entitlement where applicable

Use secure retrieval/signed access or equivalent approved mechanisms.

---

# 23. EVIDENCE IS A BUSINESS RECORD

Evidence must not be treated as an unrelated image gallery.

Where applicable, evidence should be connected to:

Site
Stage
Task
Checklist
Issue
NCR
Inspection
Approval
Document Requirement

Evidence should answer what operational requirement it supports.

---

# 24. EVIDENCE HISTORY RULE

Do not silently replace historical evidence associated with critical approvals or inspections.

If new evidence replaces/revises previous evidence, preserve the historical relationship where required.

Example:

Submission 1
→ Rejected

Submission 2
→ Approved

Both should remain traceable.

---

# 25. GPS RULE

GPS metadata indicates location information.

It does NOT automatically prove that:

- work was performed correctly
- the user was physically present
- evidence is genuine
- QC is valid

Do not label GPS-captured evidence as "verified" without an actual verification process.

---

# 26. WORKFLOW RULE

Workflow transitions must be enforced by backend/domain logic.

Before completing a stage, evaluate configured requirements such as:

- required tasks
- checklist
- evidence
- dependencies
- approvals
- blocking issues
- quality conditions

Do not allow arbitrary stage completion through direct frontend state manipulation.

---

# 27. WORKFLOW OVERRIDE RULE

Authorized workflow overrides may exist.

Every critical override should record:

- actor
- timestamp
- reason
- previous state
- resulting state

Overrides must not silently bypass history.

---

# 28. TEMPLATE VERSION RULE

Templates may evolve.

Historical execution must remain understandable using the template/checklist/specification version that applied at that time.

Do not make historical records depend solely on the latest mutable template.

---

# 29. ACCOUNTABILITY RULE

Important actionable work should have a clear owner.

FLOWVERGE should distinguish:

Responsibility
Current Accountability
Actual Performer

Do not treat these as the same field where their meanings differ.

---

# 30. UNASSIGNED ACTION RULE

If an important action cannot be assigned, do not silently leave it as generic PENDING.

Represent:

UNASSIGNED

and surface it as an operational exception requiring resolution.

---

# 31. ACCOUNTABILITY TRANSFER RULE

When ownership transfers:

Supervisor
→ PM
→ Approver
→ Execution Team
→ QC

do not overwrite historical ownership.

Current ownership changes.

Historical ownership remains traceable.

---

# 32. ACTUAL PERFORMER RULE

Where operationally important, record the person/team/vendor that actually performed the work separately from the person responsible for the broader process.

This supports later accountability and quality analysis.

---

# 33. AUDIT HISTORY RULE

Critical business actions require append-oriented audit/event history.

Examples:

- assignments
- stage transitions
- submissions
- approvals
- rejections
- inspections
- NCRs
- corrections
- re-verification
- material transactions
- permission changes
- entitlement changes
- critical admin actions
- commercial status changes

Do not rely only on application logs for business traceability.

---

# 34. AUDIT IMMUTABILITY RULE

Ordinary application operations must not silently rewrite or delete critical historical audit facts.

Corrections should create new history.

Example:

Original QC:
PASS

Later Re-verification:
FAIL

Do NOT rewrite the original QC to FAIL.

Both facts must remain.

---

# 35. FACTS VS ACCUSATIONS RULE

FLOWVERGE records operational facts.

It must not automatically label a user/vendor as:

- corrupt
- fraudulent
- negligent
- bribed
- dishonest

based only on inconsistent operational records.

The platform may surface:

- discrepancies
- unusual patterns
- repeated failures
- conflicting records
- risk indicators

Human investigation determines misconduct.

---

# 36. QUALITY HISTORY RULE

Every inspection/reinspection should be a distinct historical record where applicable.

Do not overwrite an earlier inspection with a later inspection result.

---

# 37. NCR RULE

Non-conformance lifecycle should preserve:

Finding
→ NCR
→ Owner
→ Corrective Action
→ Evidence
→ Reinspection
→ Closure

Closing an NCR does not erase the original non-conformance.

---

# 38. MATERIAL LEDGER RULE

Inventory must use transaction history.

Examples:

RECEIVE
ISSUE
TRANSFER
RETURN
ADJUSTMENT

Do not use an arbitrary editable "current stock" number as the authoritative inventory record.

Current stock should derive from valid transactions.

---

# 39. MATERIAL ADJUSTMENT RULE

Inventory adjustments require appropriate authorization.

Important adjustments should record:

- actor
- reason
- quantity
- material
- warehouse/site
- timestamp
- evidence/reference where required

Do not silently change inventory balances.

---

# 40. MATERIAL TRACEABILITY RULE

Where the process requires it, preserve the chain:

Requirement
→ Allocation
→ Issue
→ Receipt
→ Installation
→ QC

Do not claim that warehouse issue automatically proves material installation.

---

# 41. APPROVAL RULE

Approval is a business record.

Approval history should preserve:

- requester
- approver
- decision
- timestamp
- related entity
- remarks
- supporting context/evidence

Do not overwrite approval history when later decisions occur.

---

# 42. SLA RULE

SLA logic should be centralized/configurable.

Do not implement conflicting SLA calculations separately in multiple screens.

SLA states should derive from authoritative dates/rules.

---

# 43. ISSUE RULE

Operational blockers should use structured issues where appropriate.

Do not rely entirely on free-text remarks for blockers requiring:

- ownership
- severity
- SLA
- resolution
- evidence
- history

---

# 44. COMMERCIAL RULE

FLOWVERGE tracks operational commercial readiness.

Do not turn FLOWVERGE into a full accounting system during the initial product scope.

Commercial state should derive from configured operational requirements where possible.

---

# 45. REPORTING RULE

Reports and dashboards must derive from authoritative operational records.

Do not maintain separate manually editable dashboard totals.

Every important metric should be explainable and drillable.

---

# 46. MY ACTIONS RULE

My Actions should aggregate actual actionable domain records.

Do not create duplicate "action copies" merely for the dashboard if the source records can be referenced.

One business action should have one authoritative state.

---

# 47. CONTROL TOWER RULE

Control Tower is an operational intelligence/aggregation layer.

It must not become a separate source of truth.

Metrics should derive from underlying domain data.

---

# 48. AI AUTHORIZATION RULE

AI has no security bypass.

AI data retrieval and tool execution must respect:

- authentication
- tenant
- entitlement
- permission
- resource access

exactly as ordinary application operations do.

---

# 49. AI FACTUALITY RULE

AI must not invent:

- site status
- approvals
- material transactions
- QC results
- evidence
- users
- dates
- project metrics

If authoritative data is unavailable, the AI should say the data is unavailable rather than fabricate an answer.

---

# 50. AI WRITE RULE

Initially prioritize AI read/analysis/assistance capabilities.

AI must not autonomously perform critical operations such as:

- approve work
- reject work
- modify permissions
- modify entitlements
- adjust inventory
- close commercial records
- delete audit history

without an explicitly approved controlled workflow.

---

# 51. INPUT VALIDATION RULE

All externally supplied input must be validated server-side.

Do not rely only on browser/client validation.

Validate:

- identifiers
- enums
- quantities
- dates
- workflow transitions
- permissions
- file metadata
- organization/resource context

where applicable.

---

# 52. ERROR HANDLING RULE

Do not hide critical failures.

If a critical operation fails:

- return an appropriate error
- preserve consistency
- log technical details safely
- show useful user-facing feedback

Do not display:

SUCCESS

when the underlying critical operation failed.

---

# 53. SECURITY SECRET RULE

Never hardcode:

- database passwords
- Firebase service credentials
- cloud-storage credentials
- private API keys
- AI provider secrets

Use approved environment/secret-management mechanisms.

Do not commit secrets to source control.

---

# 54. LOGGING RULE

Application logs should contain useful operational debugging information.

Do not log:

- passwords
- authentication tokens
- private credentials
- unnecessary sensitive customer data

Audit history and application logs serve different purposes.

---

# 55. PRODUCTION ERROR RULE

Do not expose raw stack traces, database details, secrets or internal infrastructure information to production users.

---

# 56. TESTING RULE

A feature is not complete merely because code was generated.

Relevant tests must be run.

Depending on the task, this may include:

- unit tests
- integration tests
- API tests
- migration tests
- authorization tests
- tenant-isolation tests
- workflow tests
- UI tests
- regression tests

Report what was actually tested.

Do not claim "tested" when tests were not executed.

---

# 57. TENANT SECURITY TEST RULE

Multi-tenancy changes require explicit isolation testing.

At minimum verify:

Organization A user
cannot read Organization B data

and

Organization A user
cannot modify Organization B data.

Test protected files/reports where applicable.

---

# 58. AUTHORIZATION TEST RULE

Protected operations require tests for:

- allowed user
- denied user
- missing permission
- wrong tenant
- invalid resource
- disabled entitlement where applicable

Do not test only the successful path.

---

# 59. MIGRATION TEST RULE

Before switching persistence:

- migrate representative data
- compare record counts where meaningful
- validate relationships
- test application behavior
- test rollback/recovery approach where practical

Do not assume a successful migration command means the application migration is correct.

---

# 60. BUILD RULE

After relevant code changes, run the appropriate:

- type checking
- build
- tests
- linting where configured

Do not declare completion while the project has known build-breaking errors caused by the task.

---

# 61. DEPENDENCY RULE

Do not add a new dependency when existing platform/library functionality adequately solves the problem.

Before adding a dependency:

- explain why it is needed
- verify compatibility
- prefer maintained packages
- avoid unnecessary duplication

Do not randomly replace established libraries.

---

# 62. VERSION RULE

Do not upgrade major framework/library versions during unrelated feature work.

Major upgrades should be deliberate tasks because they can create unrelated regressions.

---

# 63. DELETE RULE

Do not delete:

- working modules
- database migrations
- user data
- evidence
- audit records
- configuration
- legacy code still in use

without verifying that it is safe and within the approved task.

---

# 64. HISTORICAL DATA RULE

Critical historical operational records should use an appropriate strategy such as:

- archival
- deactivation
- soft deletion
- versioning
- append-only correction

rather than casual hard deletion.

Exact retention rules will be finalized before production launch.

---

# 65. API RULE

Backend APIs should follow a consistent structure for:

- authentication
- authorization
- validation
- error handling
- tenant enforcement
- response behavior

Do not create one-off insecure endpoints to make a UI feature work quickly.

---

# 66. PAGINATION RULE

Do not return unbounded datasets for large operational collections.

Use pagination/filtering for resources such as:

- sites
- audit history
- evidence
- transactions
- issues
- reports

where scale requires it.

---

# 67. PERFORMANCE RULE

Optimize measured or reasonably expected bottlenecks.

Use:

- proper indexes
- bounded queries
- pagination
- efficient relationships
- caching where justified

Do not introduce unnecessary distributed infrastructure for hypothetical scale.

---

# 68. BACKGROUND JOB RULE

Introduce background processing when there is an actual requirement such as:

- notification processing
- SLA evaluation
- report generation
- imports/exports
- AI processing

Do not add queues/workers merely because they appear architecturally sophisticated.

---

# 69. OFFLINE RULE

Offline field support is planned for a later phase.

Do not build full offline synchronization during current foundation work unless explicitly approved.

However, avoid unnecessary architectural choices that make future offline support impossible.

---

# 70. UI ROLE RULE

Different users should receive experiences appropriate to their jobs.

Do not force every user into the same management dashboard.

Examples:

Field:
My Sites → Next Action → Checklist → Evidence → Submit

PM:
Control → Exceptions → My Actions → Projects

Warehouse:
Requests → Stock → Transactions

Quality:
Inspections → NCR → Reinspection

Platform Admin:
Organizations → Entitlements → Usage → Platform Operations

---

# 71. UI AUTHORIZATION RULE

The UI should hide or disable actions the user cannot perform for usability.

But backend authorization remains mandatory.

---

# 72. DESIGN CONSISTENCY RULE

Follow Design.md.

Do not introduce arbitrary:

- colors
- typography
- button styles
- cards
- spacing systems
- navigation patterns

during feature implementation.

Reuse approved design primitives/components where practical.

---

# 73. ACTION-FIRST RULE

Operational interfaces should prioritize:

What requires action now?

before large volumes of passive information.

---

# 74. EXCEPTION-FIRST RULE

Management interfaces should prioritize:

- blockers
- overdue work
- SLA risk
- missing evidence
- QC failure
- material shortages
- approval delays
- commercial blockers

rather than displaying only generic totals.

---

# 75. FIELD SIMPLICITY RULE

Field workflows should minimize unnecessary navigation and data entry.

Do not expose management complexity to users whose job is primarily to execute site work.

---

# 76. ACCESSIBILITY & USABILITY RULE

New UI should use reasonable:

- labels
- contrast
- focus behavior
- error messages
- touch targets
- responsive behavior

Do not rely only on color to communicate critical status.

---

# 77. RESPONSIVE RULE

Core execution workflows should work on expected field/mobile screen sizes.

Do not design critical site execution functionality exclusively for desktop.

---

# 78. NO FAKE DATA RULE

Do not use fabricated production-looking metrics to make dashboards appear complete.

Seed/demo data must be clearly identified as demo/test data.

---

# 79. NO FAKE IMPLEMENTATION RULE

Do not create placeholder buttons or screens that appear operational without clearly identifying incomplete functionality.

If a feature is not implemented, do not represent it as production-ready.

---

# 80. NO SILENT FALLBACK RULE

Do not silently fall back to insecure or fake behavior when production configuration is missing.

Example:

If production database configuration is missing, do not quietly use an in-memory database and report the service as healthy.

---

# 81. ENVIRONMENT RULE

Keep environment-specific configuration separate.

At minimum architecture should support:

Development
Testing/Staging
Production

Do not hardcode production behavior into local development.

---

# 82. BACKUP RULE

Production database/storage changes must consider backup and recovery.

Before high-risk production migrations, confirm an appropriate recovery path.

---

# 83. OBSERVABILITY RULE

Production-critical functionality should eventually provide enough observability to diagnose:

- failures
- slow operations
- database issues
- storage issues
- background processing problems

Do not depend solely on users reporting that something is broken.

---

# 84. PLATFORM AUDIT RULE

Critical platform operations require audit history.

Examples:

- organization created
- organization suspended
- entitlement changed
- plan changed
- organization admin changed
- support access granted/revoked

Platform audit should remain distinguishable from normal customer project activity.

---

# 85. SUBSCRIPTION RULE

Do not build a complex billing engine during foundation work.

Architecture should support:

Organization
→ Plan
→ Entitlements
→ Limits
→ Service/Subscription Status

Actual billing provider integration is a later approved capability.

---

# 86. INTEGRATION RULE

External integrations must not silently overwrite authoritative FLOWVERGE execution history.

Integrations must respect:

- tenant isolation
- authorization
- validation
- audit requirements

where applicable.

---

# 87. MEMORY UPDATE RULE

After completing an approved implementation task, update Memory.md with:

- task completed
- files/modules changed
- migrations created
- important decisions
- tests run
- test results
- known issues
- remaining work
- next recommended task

Memory.md must reflect reality.

Do not record a feature as implemented if it is only planned.

---

# 88. PHASE CONTROL RULE

Phases.md defines implementation order.

Do not skip foundation work merely because a later feature is more visually interesting.

If a phase dependency must change, document the reason and obtain approval before changing the roadmap.

---

# 89. STOP ON ARCHITECTURE CONFLICT

If an approved task requires violating an architecture invariant:

STOP.

Report:

- the conflict
- why it exists
- affected modules
- possible options
- recommended decision

Do not silently change the architecture.

---

# 90. STOP ON HIGH-RISK UNKNOWN

If implementation reveals uncertainty that could cause:

- data loss
- tenant leakage
- authentication failure
- evidence loss
- audit corruption
- major workflow breakage

STOP before performing the destructive/high-risk operation.

Report the finding and proposed solution.

---

# 91. DO NOT INVENT REQUIREMENTS

Do not invent:

- business rules
- permissions
- roles
- workflows
- approval requirements
- commercial rules
- SLA values
- metrics
- customer requirements

when they are not defined.

Ask for/record a decision where the missing requirement materially affects implementation.

---

# 92. DO NOT INVENT EXISTING BEHAVIOR

If current code behavior is unclear:

inspect it.

Do not guess.

The existing application is evidence of current implementation.

The documentation is evidence of target direction.

Both must be compared.

---

# 93. CHANGE REPORT RULE

After an implementation task, report:

CHANGED
- files
- schema
- APIs
- UI
- configuration

PRESERVED
- important existing behavior

TESTED
- tests actually executed

NOT TESTED
- relevant tests not executed

KNOWN ISSUES
- remaining defects/risks

NEXT
- recommended next approved task

---

# 94. COMPLETION DEFINITION

A task is not DONE solely because code exists.

DONE means, where applicable:

- implementation completed
- build/type checks pass
- relevant tests pass
- security considered
- tenant boundaries tested
- migration validated
- existing behavior checked
- documentation/memory updated
- known issues reported

---

# 95. PRODUCTION READY DEFINITION

Do not call FLOWVERGE production-ready merely because it deploys.

Production readiness requires appropriate validation of:

- authentication
- authorization
- tenant isolation
- database persistence
- migrations
- storage
- backups
- error handling
- logging/monitoring
- performance
- security
- critical workflows
- evidence
- audit integrity
- recovery
- deployment configuration

---

# 96. PILOT RULE

Real pilot usage is part of development.

Do not assume simulated testing will reveal all field execution problems.

Pilot findings should become structured:

- defects
- UX improvements
- missing rules
- performance issues
- workflow changes

before broad market launch.

---

# 97. SECURITY OVER SPEED

Do not knowingly weaken:

- tenant isolation
- authorization
- audit integrity
- evidence security
- data integrity

just to complete a feature faster.

---

# 98. DATA INTEGRITY OVER UI CONVENIENCE

If a UI shortcut would corrupt operational truth, do not implement the shortcut.

The underlying business record is more important than making every operation one click.

---

# 99. TRACEABILITY OVER SILENT CORRECTION

When critical historical information changes:

preserve the original fact
+
record the new fact.

Do not silently rewrite history for cosmetic cleanliness.

---

# 100. FINAL DEVELOPMENT PRINCIPLE

FLOWVERGE should become easier to operate as it becomes more powerful.

Complexity belongs primarily in:

- domain rules
- automation
- authorization
- workflow engine
- accountability
- audit system

not in unnecessary user steps.

Every implementation decision should protect:

SECURITY
+ DATA INTEGRITY
+ ACCOUNTABILITY
+ TRACEABILITY
+ CONFIGURABILITY
+ USABILITY
+ EXISTING WORKING FUNCTIONALITY

---

# IMPLEMENTATION CONTROL

Rules.md defines development behavior.

It does NOT authorize implementation.

Before modifying application code:

1. Read PRD.md.
2. Read Architecture.md.
3. Read Rules.md.
4. Read Design.md.
5. Read Phases.md.
6. Read Memory.md.
7. Inspect relevant existing code.
8. Confirm the currently approved task.
9. Modify only what is necessary.
10. Test.
11. Report results.
12. Update Memory.md when approved work is completed.

Until a specific implementation task is approved, inspect and report only.