# FLOWVERGE
## Product Requirements Document — PRD.md

Status: APPROVED
Product: FLOWVERGE
Product Type: Field Project Execution & Operations Intelligence Platform
Development Approach: Evolve the existing FLOWVERGE application; do not rebuild from scratch.

---

# 1. Product Vision

FLOWVERGE is a Field Project Execution & Operations Intelligence Platform for organizations managing distributed, site-based infrastructure projects.

FLOWVERGE connects:

Planning
→ Site Execution
→ Teams & Vendors
→ Materials
→ Evidence
→ Issues
→ Approvals
→ Quality
→ Handover
→ Commercial Readiness
→ Management Intelligence

into one operational system.

FLOWVERGE should help organizations understand:

- What needs to happen?
- Who is responsible?
- Who currently owns the next action?
- What is blocking execution?
- Is the work actually completed?
- What evidence proves completion?
- Who performed the work?
- Who submitted it?
- Who reviewed and approved it?
- Are projects/sites on target?
- Where is time, quality, material or commercial value being lost?
- What requires management attention now?

---

# 2. Product Positioning

FLOWVERGE is NOT:

- a generic task manager
- a simple site tracker
- a photo storage application
- an Excel dashboard replacement
- a full ERP/accounting system
- an AI chatbot with project data
- a solar-only or telecom-only application

FLOWVERGE is an operational execution and control platform for distributed infrastructure projects.

Its value comes from connecting:

Work
+ Ownership
+ Workflow
+ Evidence
+ Materials
+ Quality
+ Issues
+ Approvals
+ SLA
+ Commercial Readiness
+ Historical Traceability
+ Intelligence

---

# 3. Target Market

Initial focus:

- Solar EPC
- Telecom Rollout
- EV Infrastructure
- Fiber Deployment
- Infrastructure Installation
- Infrastructure Maintenance
- Custom Site-Based Infrastructure Projects

These verticals must operate on one configurable platform.

Industry-specific behavior should primarily be represented through:

- Project Templates
- Workflow Templates
- Stages
- Tasks
- Checklists
- Custom Fields
- Evidence Requirements
- Approval Rules
- SLA Rules
- Quality Rules
- Document Requirements

Do not create separate core applications for each industry.

The architecture must remain extensible to broader field operations in the future.

---

# 4. Core Product Principles

FLOWVERGE must be:

## Action-First

Users should immediately see what requires their action.

## Exception-Driven

Surface:

- blocked sites
- overdue actions
- SLA risks
- approval delays
- material shortages
- quality failures
- missing evidence
- commercial blockers
- unassigned critical actions

## Role-Based

Users receive interfaces and capabilities appropriate to their responsibilities.

## Evidence-Driven

Critical execution states should be supported by evidence and operational records where required.

## Accountable

Important actions must have ownership.

## Traceable

Critical execution, review, approval, rejection, correction, override and re-verification history must retain attribution.

## Configurable

Different infrastructure workflows should use the same core platform wherever practical.

---

# 5. FLOWVERGE SaaS Platform Structure

FLOWVERGE is a multi-organization SaaS platform.

Hierarchy:

FLOWVERGE Platform
→ Platform Administration
→ Customer Organization
→ Projects
→ Regions / Clusters
→ Sites
→ Workflows
→ Stages
→ Tasks / Actions

The platform layer and customer organization layer are separate security scopes.

---

# 6. Platform Administration

FLOWVERGE requires a protected Platform Administration capability for the FLOWVERGE operator.

Platform administration may manage:

- Organizations
- Organization Status
- Plans
- Entitlements
- Feature/Module Access
- Usage
- Limits
- Subscription Status
- Organization Admin Assignment
- Platform Configuration
- Platform Health
- Platform Audit
- Controlled Support Operations

Platform administration must not be treated as a normal organization role such as Project Manager or Quality Engineer.

Customer users must not have access to platform administration functionality.

---

# 7. Organization Provisioning

The FLOWVERGE Platform Owner/Admin should be able to provision customer organizations.

Example:

Organization:
ABC Infrastructure Pvt Ltd

Status:
ACTIVE

Plan:
Professional

Entitlements:
- Projects & Sites
- Workflow
- Evidence
- Issues
- Quality
- Materials
- Reports

Optional Entitlements:
- AI Intelligence
- Client Portal
- Advanced Integrations

Limits may include:

- Users
- Active Projects
- Storage
- Other service limits

Exact commercial packages will be determined later.

The architecture must support entitlements without requiring separate customer codebases.

---

# 8. Platform vs Customer Administration

FLOWVERGE uses three operational control levels.

## Platform Level

FLOWVERGE operator manages:

- organizations
- plans
- entitlements
- limits
- subscription/service state
- platform operations

## Organization Level

Customer Organization Admin manages:

- organization users
- memberships
- roles
- permissions
- projects
- templates
- vendors
- teams
- warehouses
- organization configuration

## Project / Execution Level

Operational users manage:

- sites
- workflows
- tasks
- evidence
- issues
- approvals
- quality
- materials
- documents
- commercial readiness

The FLOWVERGE operator should not need to manage every customer employee, project or site.

---

# 9. Customer Data Access

Platform administration does NOT automatically imply unrestricted operational access to customer data.

Customer operational data access by FLOWVERGE support/platform personnel should eventually be:

- explicit
- permission-controlled
- purpose-limited
- time-limited where appropriate
- auditable

Support access must not become an invisible bypass of tenant isolation.

---

# 10. Multi-Tenancy

Organization is the primary customer security boundary.

Example:

FLOWVERGE
├── Organization A
│   ├── Users
│   ├── Projects
│   ├── Sites
│   ├── Vendors
│   └── Warehouses
│
└── Organization B
    ├── Users
    ├── Projects
    ├── Sites
    ├── Vendors
    └── Warehouses

Organization A must not access Organization B's operational data.

Tenant isolation must be enforced server-side.

Frontend visibility is never sufficient authorization.

---

# 11. Entitlements

FLOWVERGE should support organization-level service entitlements.

Examples:

- Core Project Management
- Site Execution
- Workflow Engine
- Evidence Management
- Issues & SLA
- Quality / NCR
- Materials / Warehouse
- Commercial Readiness
- Advanced Reporting
- AI Intelligence
- Client Portal
- Integrations

Entitlements determine whether an organization may use a capability.

Entitlements are different from permissions.

Example:

Organization entitlement:
Quality Management = enabled

User permission:
quality.inspect = allowed

Both conditions may be required.

---

# 12. Core Platform Hierarchy

Primary operational hierarchy:

Organization
→ Project
→ Region / Cluster where applicable
→ Site
→ Workflow
→ Stage
→ Task / Action

Supporting domains:

- Users
- Memberships
- Roles
- Permissions
- Teams
- Vendors
- Templates
- Checklists
- Evidence
- Issues
- NCRs
- SLA
- Approvals
- Quality
- Materials
- Warehouses
- Documents
- Commercial Readiness
- Notifications
- Audit History
- Reporting
- Intelligence

---

# 13. Project Management

Authorized customer users can create and manage projects.

A project may contain:

- project details
- customer/client
- project template/type
- region
- clusters
- sites
- teams
- vendors
- workflow
- target dates
- SLA configuration
- material requirements
- quality requirements
- document requirements
- commercial configuration

Projects should use reusable templates where appropriate.

---

# 14. Site Management

Site is a first-class execution entity.

A site may contain:

- Site ID
- Site Name
- Project
- Region / Cluster
- Address
- Latitude / Longitude
- Customer Reference
- Assigned Team
- Assigned Vendor
- Responsible Roles
- Current Workflow Stage
- Current Action
- Status
- Target Dates
- Tasks
- Checklists
- Evidence
- Issues
- NCRs
- Approvals
- Materials
- Quality Inspections
- Documents
- Commercial Readiness
- Activity / Audit History

A site should become a complete digital execution record from allocation through closure.

---

# 15. Workflow Engine

FLOWVERGE supports configurable workflows.

Example:

Survey
→ Feasibility
→ Approval
→ Civil
→ Installation
→ Quality
→ Handover
→ Commercial Closure

Another project may use:

Survey
→ Design
→ Approval
→ Civil
→ Electrical
→ Equipment Installation
→ Testing
→ Commissioning
→ Handover

Both should use the same workflow engine.

Each stage may define:

- responsible role
- tasks
- checklists
- evidence requirements
- dependencies
- SLA
- approval requirements
- completion rules
- allowed transitions

Users must not arbitrarily bypass workflow controls.

Authorized overrides may exist but must be traceable.

---

# 16. Templates

Reusable templates may include:

- Solar EPC
- Telecom Rollout
- EV Deployment
- Fiber Deployment
- Infrastructure Maintenance
- Custom Infrastructure

Templates may configure:

- stages
- tasks
- roles
- checklists
- custom fields
- evidence requirements
- SLA
- approvals
- quality requirements
- documents
- completion rules

Configuration should be preferred over industry-specific code.

---

# 17. Accountability Engine

FLOWVERGE must distinguish:

Responsibility
= broader responsibility for project/site/process.

Accountability
= who currently owes the next action/result.

Activity History
= who actually performed each action.

For applicable actions record:

- owner
- responsible party
- actual performer
- assigned by
- assigned at
- due date / SLA
- dependencies
- status
- result
- evidence
- escalation
- history

Important actions should not silently remain PENDING without ownership.

If assignment cannot be resolved:

UNASSIGNED

must be surfaced as an exception.

---

# 18. Accountability Transfer

Accountability may transfer automatically as workflow events occur.

Example:

Survey Pending
→ Supervisor owns action

Survey Submitted
→ PM Reviewer owns action

Deviation Required
→ Approver owns decision

Approval Completed
→ Execution Team owns next work

Material Shortage
→ Warehouse/Material Owner owns blocker

Installation Submitted
→ QC owns inspection

QC Rejected
→ Vendor/Team owns rectification

Rectification Submitted
→ QC owns reinspection

Documents Missing
→ Documentation Owner owns action

Overall project responsibility may remain with the Project Manager while another person owns the current action.

---

# 19. Execution Traceability

Critical operational history must retain attribution.

Where applicable, FLOWVERGE should preserve:

- who was responsible
- who actually performed the work
- vendor/team involved
- who submitted it
- who reviewed it
- who approved/rejected it
- timestamps
- evidence available at that time
- applicable checklist
- applicable template/workflow/specification version
- changes/corrections
- overrides
- later inspections
- re-verification findings

Historical records must not be silently rewritten.

---

# 20. Traceability Example

Scenario:

A vendor installs material that does not comply with the approved specification.

The work is submitted.

A Quality Engineer inspects and approves the work.

Months later, re-verification identifies the non-conforming material.

FLOWVERGE must preserve:

Original Execution:
- vendor
- team
- supervisor
- work date
- evidence
- reported material/specification

Original QC:
- inspector
- checklist
- evidence reviewed
- result
- approval
- date/time

Re-verification:
- inspector
- date
- finding
- evidence
- required specification
- result
- NCR/corrective action

The original QC result must not be overwritten.

Example:

Original QC:
PASSED — QE A — 13 Aug 2026

Re-verification:
FAILED — QE B — 18 Feb 2027

Both remain historically visible.

FLOWVERGE records factual history.

It must not automatically infer bribery, fraud, negligence or intent.

Investigation determines misconduct.

FLOWVERGE provides the evidence chain.

---

# 21. Audit Trail

Critical actions should create append-oriented audit/event history.

Examples:

- assignments
- workflow transitions
- checklist submissions
- evidence submissions
- approvals
- rejections
- QC results
- NCR creation/closure
- corrective actions
- re-verification
- material transactions
- overrides
- critical administrative changes
- permission changes
- entitlement changes
- commercial state changes

Audit records should preserve where applicable:

- actor
- action
- entity
- timestamp
- previous state
- new state
- reason/context

Authorized users should be able to reconstruct a site's operational history.

---

# 22. Evidence Management

Evidence is a first-class operational record.

Evidence may relate to:

- site
- stage
- task
- checklist item
- issue
- NCR
- quality inspection
- approval
- document requirement

Metadata may include:

- uploader
- capture timestamp
- upload timestamp
- location metadata
- project
- site
- stage
- checklist
- storage reference
- review status
- revision/history relationship

Lifecycle may include:

Captured
→ Submitted
→ Reviewed
→ Approved / Rejected

GPS capture alone must not be represented as proof that work was verified.

---

# 23. Evidence Experience

Users should be able to view evidence through:

- checklist/evidence requirement view
- gallery
- full viewer
- metadata
- workflow/stage filters
- review status
- history
- before/after comparison
- map view where useful

FLOWVERGE should surface:

- missing mandatory evidence
- rejected evidence
- evidence awaiting review
- quality-related evidence

Management should not need to manually browse thousands of photographs.

---

# 24. Issues & Blockers

Operational blockers should use structured issue records instead of relying only on remarks.

Issue may contain:

- category
- severity
- description
- project/site
- raised by
- owner
- opened date
- SLA
- evidence
- status
- resolution
- resolved by
- resolved date

Categories may include:

- Material
- Approval
- Site Access
- Owner/Landlord
- Design
- Space/Obstruction
- Quality
- Vendor
- Customer Dependency
- Weather
- Other

FLOWVERGE should explain why a site is blocked and who currently owns the resolution.

---

# 25. NCR & Re-Verification

FLOWVERGE supports Non-Conformance Records.

Typical lifecycle:

Finding
→ NCR
→ Responsible Owner
→ Corrective Action
→ Evidence
→ Reinspection / Re-verification
→ Closure

Original inspection results remain preserved.

Re-verification adds a new historical result; it does not erase the previous result.

---

# 26. SLA & Escalation

Actions/issues/workflows may have configurable SLA rules.

Example:

On Track
→ Attention
→ Overdue
→ Escalated

FLOWVERGE should identify:

- owner
- target
- elapsed time
- remaining time
- overdue duration
- escalation state

SLA rules may vary by template/project/customer.

---

# 27. Approvals

Reusable approvals may apply to:

- workflow stages
- surveys
- deviations
- designs
- quality
- material requests
- documents
- commercial actions
- configured processes

Approval records should preserve:

- requester
- request time
- approver
- related entity
- evidence/context
- decision
- decision time
- remarks
- history

---

# 28. Quality Management

Typical flow:

Work Completed
→ Inspection
→ Checklist
→ PASS / REJECT

If rejected:

Finding
→ NCR / Issue
→ Corrective Action
→ New Evidence
→ Reinspection
→ Closure

Quality data may later support:

- first-pass rate
- rework
- NCR rate
- repeat NCRs
- vendor performance
- team performance
- recurring quality patterns

---

# 29. Materials & Warehouse

FLOWVERGE should support:

- Material Master
- Warehouses
- Receipts
- Issues
- Transfers
- Returns
- Adjustments
- Site Allocations
- Material Requests
- Shortages
- Low-Stock Alerts

Inventory should use transaction history.

Material transactions should preserve relevant actors and timestamps.

---

# 30. Material-to-Execution Traceability

Where applicable:

Required Material
→ Allocation
→ Warehouse Issue
→ Site Receipt
→ Installation
→ Evidence
→ Quality

This supports investigation of:

- incorrect material
- approved material not used
- shortages
- quantity differences
- material-related quality failures

The system provides facts rather than automatically assigning misconduct.

---

# 31. Teams & Vendors

FLOWVERGE should support:

- Teams
- Team Members
- Vendors
- Project Assignments
- Site Assignments
- Workload
- Execution History

Once trustworthy data exists, performance indicators may include:

- on-time completion
- SLA compliance
- first-pass QC
- NCRs
- rework
- overdue actions
- repeat issues

Performance scores must be explainable from underlying records.

---

# 32. Control Tower

Management receives an exception-driven portfolio view.

Possible indicators:

- Total Sites
- Active Sites
- Completed Sites
- Blocked Sites
- At-Risk Sites
- SLA Breaches
- Approval Delays
- Material Blockers
- Quality Failures
- Commercial Blockers
- Project Health
- Execution Map

Important metrics must drill down to authoritative underlying records.

---

# 33. My Actions

My Actions answers:

WHAT REQUIRES THIS USER'S ACTION NOW?

Possible sources:

- tasks
- approvals
- issues
- SLA escalations
- QC inspections
- reinspections
- material requests
- rejected submissions
- document actions
- commercial actions

My Actions is an execution queue, not another analytics dashboard.

---

# 34. Field Experience

Primary mobile flow:

My Sites
→ Site
→ Next Action
→ Checklist
→ Evidence
→ Report Issue
→ Submit

Field users should clearly see:

- assigned sites
- current stage
- next action
- remaining requirements
- evidence requirements
- blockers
- submission status

---

# 35. Warehouse Experience

Warehouse users primarily see:

- pending requests
- stock
- low-stock alerts
- receipts
- issues
- transfers
- returns
- allocations
- overdue material actions

---

# 36. Quality Experience

Quality users primarily see:

- inspections
- pending reviews
- rejected work
- NCRs
- corrective actions
- rectification submissions
- reinspections
- evidence
- quality history

---

# 37. Documents & Handover

FLOWVERGE supports configurable document requirements.

Examples:

- survey documents
- drawings
- quality documents
- handover documents
- client acceptance
- JMS/JMR-type documents
- customer-specific requirements

Requirements may vary by project/template/customer.

---

# 38. Commercial Readiness

FLOWVERGE tracks operational commercial readiness without becoming a full accounting system.

Possible lifecycle:

Physical Complete
→ Quality Complete
→ Documents Complete
→ Client Acceptance
→ Billing Ready
→ Submitted
→ Approved / Closed

Management should identify completed sites that are not commercially ready and why.

---

# 39. Reporting

Reports may include:

- project progress
- site status
- stage aging
- issues
- SLA
- approvals
- quality
- NCR
- materials
- warehouse
- vendor/team performance
- documents
- commercial readiness
- accountability
- audit history

Report numbers must reconcile with operational records.

---

# 40. AI & Operational Intelligence

AI is an assistance/intelligence layer over authorized FLOWVERGE data.

AI may:

- summarize
- troubleshoot
- analyze blockers
- explain project status
- draft reports
- identify patterns
- recommend actions
- answer authorized operational queries

Examples:

Why is Karnataka Solar behind target?

Which sites are blocked by materials?

Which approvals have been pending for more than 48 hours?

Who approved the original QC for Site X?

Which sites passed QC but later failed re-verification?

Which vendor has repeated material-specification NCRs?

AI must respect the user's permissions and tenant boundary.

---

# 41. AI Limitations

AI must not:

- become the authoritative source of project facts
- bypass permissions
- fabricate operational data
- rewrite audit history
- independently approve critical work
- independently reject critical work
- change permissions
- bypass entitlements
- perform critical commercial/material operations without approved controls

---

# 42. Future Intelligence

After sufficient trustworthy historical data exists:

- Delay Risk Prediction
- Material Shortage Prediction
- Quality Risk
- Vendor Risk
- Commercial Risk
- Workforce Optimization
- Project Health Forecasting
- Recommended Interventions

Predictive features should not be prioritized before trustworthy operational data exists.

---

# 43. Notifications

Prioritize actionable events:

- task assigned
- approval assigned
- issue assigned
- SLA approaching
- SLA breached
- submission rejected
- material request
- QC failure
- reinspection required
- major escalation

Low-value activity should remain in history instead of creating notification noise.

---

# 44. Search

Authorized users should quickly find:

- Project
- Site ID
- Site Name
- Vendor
- Issue
- NCR
- Document

Future intelligent search may support natural-language operational queries.

---

# 45. Customer Roles & Permissions

Potential organization roles include:

- Organization Admin
- Project Head
- Project Manager
- Cluster/Area Manager
- Supervisor
- Site Engineer
- Technician
- Vendor
- Warehouse User
- Quality Engineer
- Commercial/Documentation User
- Client/Viewer in future

Access must ultimately be permission-based rather than dependent only on hardcoded role names.

Platform-level roles remain separate from organization roles.

---

# 46. UX Direction

FLOWVERGE should feel:

- professional
- operational
- technical
- clean
- trustworthy
- fast
- structured

Primary philosophy:

Action-First
Exception-Driven
Role-Based
Evidence-Driven

Management asks:
Where are my projects going wrong?

PM asks:
What requires my attention?

Field User asks:
What do I need to do next?

Warehouse asks:
What material requires action?

Quality asks:
What requires inspection, correction or re-verification?

Platform Admin asks:
Which organizations are active, what services do they have, and is the platform operating correctly?

---

# 47. Data Principles

Production operational database:
PostgreSQL

Identity:
Firebase Authentication

Authorization:
FLOWVERGE backend

Photos/Documents:
Cloud Object Storage

PostgreSQL stores:
- operational records
- file references
- metadata

No production Base64 media storage.

External systems may integrate with FLOWVERGE but must not silently create conflicting authoritative execution states.

---

# 48. Security Principles

FLOWVERGE must provide:

- authenticated identities
- backend authorization
- permission-based access
- tenant isolation
- project/resource controls
- entitlement enforcement
- secure file access
- input validation
- secret management
- audit history
- secure production configuration

Platform privileges and customer privileges must remain distinct.

Frontend hiding is not security.

---

# 49. Reliability Principles

Critical business operations should not leave partial state.

Example:

Stage Approval
+ Stage Completion
+ Next Action
+ Audit Record

should behave consistently where required.

Failures must be visible.

FLOWVERGE must not display successful completion when critical underlying operations failed.

---

# 50. Existing Application

FLOWVERGE is NOT being built from scratch.

A substantial existing application already exists.

Working functionality must be inspected and preserved where appropriate.

The target architecture does not authorize a full rewrite.

Migration/refactoring must occur incrementally according to Phases.md.

---

# 51. Production Objective

Transform the existing FLOWVERGE application into a:

- persistent
- secure
- multi-tenant
- configurable
- traceable
- scalable
- market-ready

infrastructure execution platform.

Priority:

Foundation
→ Execution Engine
→ Operational Experience
→ Operational Completion
→ Production Hardening
→ Pilot
→ Launch
→ Expansion
→ Advanced Intelligence

---

# 52. Pilot Success

Pilot should validate whether real users can:

- manage projects/sites
- execute workflows
- submit evidence
- identify blockers
- manage accountability
- approve work
- perform QC
- create/close NCRs
- re-verify work
- trace materials
- manage documents
- understand commercial readiness
- reconstruct site history

Key test:

Select a completed site and ask:

"Tell me everything that happened to this site from allocation to closure."

FLOWVERGE should reconstruct the operational chain.

---

# 53. Product Success Indicators

Pilot data should establish measurable targets for:

- reduced manual reporting
- faster issue resolution
- reduced approval delays
- improved SLA compliance
- evidence completeness
- reduced rework
- QC first-pass rate
- material visibility
- commercial closure time
- management visibility
- accountability
- reduction in spreadsheet/messaging dependence

Do not invent target improvements before baseline data exists.

---

# 54. Long-Term Vision

FLOWVERGE evolves from:

PROJECT TRACKING
→ PROJECT EXECUTION CONTROL
→ OPERATIONS INTELLIGENCE
→ AI-ASSISTED INFRASTRUCTURE OPERATIONS

without losing the core principle:

Important operational conclusions must trace back to trustworthy data, evidence, ownership and history.

---

# 55. Final Product Principle

For an important site, authorized users should eventually be able to determine:

WHAT happened?
WHAT should have happened?
WHO performed it?
WHO submitted it?
WHO inspected it?
WHO approved/rejected it?
WHEN did it happen?
WHAT evidence existed?
WHAT specification applied?
WHAT material was issued?
WHAT went wrong?
WHO currently owns resolution?
WHAT changed afterward?
WAS it re-verified?
WHAT is the current operational state?
WHAT is the current commercial state?

This traceable execution chain is a core FLOWVERGE capability.

---

# 56. Implementation Boundary

This PRD defines the approved product direction.

It does NOT authorize implementation of every requirement immediately.

Implementation is controlled by:

Architecture.md
Rules.md
Phases.md
Memory.md

Existing working functionality must be preserved.

Only explicitly approved implementation tasks should be executed.