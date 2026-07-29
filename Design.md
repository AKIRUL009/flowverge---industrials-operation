# FLOWVERGE
## Product Design System & UX Specification — Design.md

Status: APPROVED
Product: FLOWVERGE
Design Direction: Operational SaaS Platform
Primary Philosophy: Action-First, Exception-Driven, Role-Based, Evidence-Driven

---

# 1. DESIGN OBJECTIVE

FLOWVERGE manages complex infrastructure execution.

The UI must make that complexity understandable rather than exposing the entire system to every user.

The design should help users answer:

Platform Admin:
Which organizations are active, what services are enabled, and what requires platform attention?

Management:
Where are projects going wrong?

Project Manager:
What requires my attention now?

Field User:
What do I need to do next?

Warehouse User:
What material requires action?

Quality Engineer:
What requires inspection, rectification, or re-verification?

The product should feel like an infrastructure operations platform, not a generic task manager.

---

# 2. DESIGN PRINCIPLES

FLOWVERGE UI must be:

- Action-First
- Exception-Driven
- Role-Based
- Evidence-Driven
- Consistent
- Fast
- Responsive
- Traceable
- Professional
- Operational

Users should not need to understand the full system architecture to complete their work.

---

# 3. INFORMATION PRIORITY

Screens should generally prioritize:

1. What requires action?
2. What is wrong or at risk?
3. What is the current state?
4. Who owns it?
5. What is due?
6. What evidence/history exists?
7. What additional information is available?

Do not place passive statistics above urgent operational actions without a clear reason.

---

# 4. APPLICATION STRUCTURE

FLOWVERGE has two primary application scopes:

A. Customer Workspace
B. Platform Administration

They share the same FLOWVERGE product identity but have separate navigation and authorization boundaries.

---

# 5. CUSTOMER WORKSPACE

Potential main navigation:

Home / Control Tower
My Actions
Projects
Sites
Issues
Quality
Materials
Documents
Reports
Administration

Navigation visibility depends on:

- organization entitlement
- user permission
- resource access
- role context

Do not show every module to every user.

---

# 6. PLATFORM ADMINISTRATION

Platform Administration should use a clearly separate protected interface.

Potential navigation:

Overview
Organizations
Plans & Entitlements
Usage
Platform Operations
Support Access
Platform Audit
Platform Settings

Platform Admin should immediately understand:

- number of organizations
- active/suspended organizations
- entitlement distribution
- usage/limit concerns
- platform issues
- support operations requiring attention

Platform Administration must not look like a customer project workspace.

---

# 7. PLATFORM ADMIN OVERVIEW

Example:

FLOWVERGE PLATFORM

Organizations: 24
Active: 22
Suspended: 2

Needs Attention

3 organizations approaching user limits
1 storage threshold warning
2 support requests
1 platform service warning

Recent Platform Activity

Organization created
Entitlement changed
Organization suspended
Admin assigned

Metrics must come from authoritative platform data.

---

# 8. ORGANIZATION MANAGEMENT

Platform Admin organization list may show:

Organization
Plan
Status
Users
Projects
Storage/Usage
Created
Actions

Selecting an organization opens:

Overview
Entitlements
Limits
Organization Admins
Usage
Subscription/Service Status
Platform Audit
Support Access

Do not expose customer operational project data by default merely because the user is a Platform Admin.

---

# 9. ORGANIZATION PROVISIONING

Provisioning should use a structured flow.

Example:

Create Organization

Step 1
Organization Details

Step 2
Plan

Step 3
Entitlements

Step 4
Limits

Step 5
Organization Admin

Step 6
Review & Activate

Avoid presenting dozens of configuration fields on one screen.

---

# 10. ENTITLEMENT UI

Platform Admin should be able to understand which services an organization can use.

Example:

Core Platform
✓ Projects & Sites
✓ Workflow
✓ Evidence

Operations
✓ Issues & SLA
✓ Quality
✓ Materials

Intelligence
✓ Advanced Reporting
○ AI Intelligence

Extensions
○ Client Portal
○ Integrations

Changes to important entitlements should require clear confirmation and be auditable.

---

# 11. CUSTOMER HOME

The home experience should depend on user responsibilities.

Do not force one identical dashboard onto:

- Organization Admin
- Project Manager
- Supervisor
- Warehouse User
- Quality Engineer
- Vendor

The system may share components while presenting different priorities.

---

# 12. MANAGEMENT CONTROL TOWER

Management needs portfolio visibility.

Primary question:

WHERE ARE WE LOSING CONTROL?

Suggested structure:

Header
→ Filters
→ Portfolio Health
→ Needs Attention
→ Project Performance
→ Geographic/Operational View
→ Recent Critical Activity

---

# 13. CONTROL TOWER METRICS

Possible top-level indicators:

Total Sites
Completed
Active
Blocked
At Risk

Secondary operational indicators:

SLA Breaches
Approval Delays
Material Blockers
Quality Failures
Commercial Blockers
Unassigned Critical Actions

Avoid displaying too many KPIs simultaneously.

Prioritize what affects execution.

---

# 14. NEEDS ATTENTION

This is one of the most important components.

Example:

NEEDS ATTENTION

8 SLA Breaches
6 Material Blockers
4 Approvals > 48h
3 QC Failures
2 Commercial Blockers
2 Unassigned Actions

Each item should be clickable.

Click:

6 Material Blockers

→ show the affected sites/actions.

Never create a metric that cannot be explained by underlying records.

---

# 15. PROJECT MANAGER HOME

PM experience should prioritize:

My Actions
Project Health
Blocked Sites
Overdue Actions
Pending Approvals
Material Problems
Quality Problems
Commercial Blockers

A PM should not need to open five modules to discover today's problems.

---

# 16. MY ACTIONS

My Actions is an execution queue.

Possible tabs/filters:

All
Overdue
Due Soon
Approvals
Issues
Quality
Materials
Documents

Each action should show:

Action
Site/Project
Priority
Due/SLA
Current State
Relevant Context

Example:

Review Survey
IN-1455049
Due in 3h

Approve Deviation
IN-3259455
OVERDUE 6h

Review NCR Rectification
IN-1355126
Due Today

Clicking an action should take the user directly to the context required to complete it.

---

# 17. UNASSIGNED ACTIONS

Important unassigned work must be visible.

Example:

UNASSIGNED

QC Inspection
IN-XXXXX
Created 5h ago

Do not hide unassigned actions in generic pending counts.

Management should be able to resolve ownership quickly.

---

# 18. PROJECT WORKSPACE

Project page may contain:

Overview
Sites
Workflow
Issues
Quality
Materials
Documents
Commercial
Team
Reports
Activity

The exact tabs shown depend on entitlements and permissions.

---

# 19. PROJECT OVERVIEW

Project overview should answer:

- What is the overall status?
- Are we on target?
- How many sites are complete?
- What is blocked?
- What is overdue?
- Where are quality problems?
- Are materials affecting execution?
- What prevents commercial closure?

Do not turn the overview into a wall of charts.

---

# 20. SITE LIST

Site list is a major operational interface.

Useful columns may include:

Site ID
Site Name
Region/Cluster
Stage
Status
Current Owner
Next Action
SLA
Blocker
Vendor/Team
Target Date

Support:

- Search
- Filters
- Sorting
- Saved views later
- Pagination

Avoid forcing users to horizontally scroll through dozens of columns.

Allow context-specific views where useful.

---

# 21. SITE STATUS

Status must communicate meaningful operational state.

Examples:

Not Started
Active
Blocked
Awaiting Approval
Awaiting QC
Rectification
Completed
Commercial Pending
Closed

Avoid uncontrolled status values created independently by different modules.

---

# 22. SITE WORKSPACE

Site should behave like a digital execution record.

Suggested header:

Site ID
Site Name
Project
Current Stage
Current Owner
Status
SLA
Primary Action

Suggested tabs:

Overview
Tasks
Evidence
Issues
Approvals
Quality
Materials
Documents
History

Commercial may appear where applicable.

---

# 23. SITE OVERVIEW

Site Overview should answer:

WHERE IS THIS SITE NOW?

Example:

Current Stage
Installation

Current Owner
Vendor Team 04

Next Requirement
Submit Electrical Checklist

SLA
5h 32m remaining

Blockers
None

Evidence
12 / 14 Required

Quality
Not Started

Commercial
Not Ready

Below this:

Workflow Timeline
Open Actions
Issues
Recent Evidence
Recent Activity

---

# 24. SITE WORKFLOW TIMELINE

Provide a clear progression.

Example:

✓ Survey
✓ Feasibility
✓ Approval
✓ Civil
● Installation
○ Quality
○ Handover
○ Commercial

Selecting a stage should reveal:

- status
- owner
- tasks
- checklist
- evidence
- submissions
- approvals
- issues
- history

Do not represent workflow only as a percentage.

---

# 25. CURRENT OWNER

Where accountability applies, make ownership visible.

Example:

CURRENT ACTION

Submit Installation Evidence

Owner
Ravi Kumar

Vendor
ABC Infra

Due
Today, 5:00 PM

Status
IN PROGRESS

This is more useful than simply:

Installation — 70%

---

# 26. FIELD USER EXPERIENCE

Field UX should be mobile-first and simplified.

Primary navigation:

My Sites
My Actions
Notifications
Profile

Avoid showing:

- portfolio analytics
- platform administration
- complex financial reporting
- irrelevant modules

to normal field users.

---

# 27. FIELD HOME

Example:

MY DAY

3 Sites Assigned
2 Actions Due Today
1 Rejected Submission

MY SITES

IN-1455049
Installation
Next: Electrical Checklist

IN-3259455
Civil
Next: Upload Foundation Evidence

IN-1355126
Rectification
QC Rejected

The field user should immediately know what to do.

---

# 28. FIELD SITE FLOW

Preferred flow:

My Sites
→ Select Site
→ See Next Action
→ Complete Checklist
→ Capture Evidence
→ Report Issue if needed
→ Submit

Reduce unnecessary navigation.

---

# 29. FIELD CHECKLIST

Checklist items should clearly indicate:

Required
Optional
Completed
Missing
Rejected

Example:

INSTALLATION CHECKLIST

Structure

✓ Foundation
✓ Structure Alignment
✓ Fasteners

Panels

✓ Front View
○ Serial Number Photo — REQUIRED

Electrical

✓ Cable Routing
○ MPPT Connection — REQUIRED

2 requirements remaining

[Submit] disabled until completion rules are satisfied.

Where authorized override exists, it should use a separate explicit action.

---

# 30. EVIDENCE CAPTURE

Evidence capture should communicate what is required before the user takes/uploads a photo.

Example:

REQUIRED EVIDENCE

Cable Routing

Instructions:
Capture the complete cable route from panel structure to equipment entry.

Requirements:
Photo required
Location capture required

[Capture Photo]

After capture:

Preview
Retake
Add Remark
Submit

Do not make users guess what photograph is required.

---

# 31. EVIDENCE GALLERY

Evidence view should support grouping by:

- Stage
- Checklist
- Type
- Status
- Date

Example:

Installation

Structure       5
Panels          4
Electrical      3

Review States:

Approved
Pending
Rejected

Management should be able to locate evidence quickly without browsing one giant folder.

---

# 32. EVIDENCE VIEWER

Selecting evidence should show:

Large Preview

Metadata:
Site
Project
Stage
Checklist Requirement
Uploaded By
Captured At
Uploaded At
Location Metadata
Review Status
Revision

Related:
Approval
QC
Issue/NCR
Previous Submission

Available actions depend on permissions.

---

# 33. EVIDENCE STATUS

Use clear states:

Draft
Submitted
Pending Review
Approved
Rejected
Superseded

Avoid using ambiguous terms such as "verified" unless actual verification occurred.

---

# 34. EVIDENCE HISTORY

If evidence is resubmitted:

Submission 1
Rejected — 12 Aug

Submission 2
Approved — 13 Aug

Both should remain available to authorized users.

UI should make current evidence clear without hiding history.

---

# 35. BEFORE / AFTER

For rectification, maintenance, or quality cases, support comparison where useful.

Example:

BEFORE
Non-compliant cable routing

AFTER
Corrected cable routing

Related NCR:
NCR-0042

This improves review speed.

---

# 36. ISSUES UI

Issue page/card should show:

Issue Type
Severity
Site
Description
Owner
Raised By
Opened
SLA
Evidence
Status
Resolution

Example:

MATERIAL SHORTAGE

Site
IN-1455049

Missing
6 sq.mm Cable — 40 m

Owner
Warehouse Hubballi

SLA
OVERDUE 4h

Do not bury the owner and SLA inside remarks.

---

# 37. BLOCKED SITE EXPERIENCE

When a site is blocked, clearly show why.

Example:

SITE BLOCKED

Reason
Material Shortage

Issue
ISS-1023

Owner
Warehouse

Since
26 Jul 2026 14:20

Impact
Installation cannot proceed

[View Issue]

A red status alone is insufficient.

---

# 38. APPROVAL EXPERIENCE

Approver should receive enough context to decide without searching across unrelated screens.

Example:

APPROVAL REQUEST

Site
IN-1455049

Type
Survey Deviation

Requested By
Project Manager

Reason
Required layout differs from approved survey.

Evidence
4 items

Requested
2h ago

[Review Evidence]

[Reject]
[Approve]

Decision should support remarks where required.

---

# 39. APPROVAL HISTORY

Show:

Requested By
Requested At
Reviewed By
Decision
Decision Time
Remarks

If approval occurs multiple times due to revision, show each decision separately.

---

# 40. QUALITY HOME

Quality user home should prioritize:

Pending Inspections
Overdue Inspections
Reinspection Required
Open NCRs
Rectification Submitted
Repeated Failures

Example:

QUALITY ACTIONS

8 Pending Inspections
3 Reinspections
4 Rectifications Awaiting Review
2 Overdue

---

# 41. QUALITY INSPECTION

Inspection screen may show:

Site Information
Work Submission
Checklist
Evidence
Material/Specification Context
Previous Findings
Inspection Result

Possible actions:

PASS
REJECT / CREATE FINDING

Do not force QE to navigate away repeatedly to understand the work being inspected.

---

# 42. QC REJECTION

When rejecting work, capture structured information.

Example:

FINDING

Category
Material Specification

Severity
Major

Finding
Installed cable does not match approved specification.

Evidence
[Attach]

Required Action
Replace cable and resubmit evidence.

Owner
Vendor ABC

This may create an NCR depending on workflow rules.

---

# 43. NCR EXPERIENCE

NCR page should clearly show:

Original Finding
Inspection
Responsible Party
Corrective Action
Corrective Evidence
Reinspection
Status
History

Timeline example:

12 Aug
Original Inspection — FAILED

12 Aug
NCR Created

13 Aug
Rectification Submitted

14 Aug
Reinspection — PASSED

14 Aug
NCR Closed

Do not hide the original failure after closure.

---

# 44. RE-VERIFICATION

Re-verification must appear as a new inspection event.

Example:

ORIGINAL QC

13 Aug 2026
QE A
PASS

RE-VERIFICATION

18 Feb 2027
QE B
FAIL

Finding:
Material specification mismatch.

The UI must not replace PASS with FAIL.

It must display the historical sequence.

---

# 45. SITE HISTORY

History is one of FLOWVERGE's core capabilities.

Provide a chronological operational timeline.

Example:

09:12
Site assigned to Team 04

10:31
Survey started by Ravi

12:42
Survey evidence submitted

14:08
Survey approved by PM

...

History should support filters:

All
Workflow
Evidence
Approvals
Quality
Materials
Issues
Administration where relevant

---

# 46. HISTORY DETAIL

Selecting an important history event may show:

Actor
Action
Timestamp
Previous State
New State
Reason
Related Evidence
Related Record

History should help answer:

Who did this?

not merely:

Something changed.

---

# 47. MATERIALS HOME

Warehouse/material user experience should prioritize:

Pending Requests
Low Stock
Overdue Requests
Incoming Material
Issues
Transfers
Returns

Example:

MATERIAL ACTIONS

12 Pending Requests
4 Low Stock Items
3 Overdue Issues
2 Transfers Awaiting Receipt

---

# 48. MATERIAL REQUEST

Example:

MATERIAL REQUEST

Site
IN-1455049

Material
6 sq.mm Cable

Quantity
40 m

Requested By
Supervisor

Required By
Tomorrow

Warehouse
Hubballi

Stock
125 m

[Reject]
[Issue Material]

---

# 49. MATERIAL TRANSACTION HISTORY

Material page should show ledger-style history.

Example:

27 Jul
RECEIVE
+500 m

28 Jul
ISSUE
-40 m
Site IN-1455049

28 Jul
ISSUE
-30 m
Site IN-3259455

29 Jul
RETURN
+5 m
Site IN-1455049

Available
435 m

Users should be able to understand how the balance was reached.

---

# 50. MATERIAL TRACEABILITY UI

Where applicable, site materials should show:

Required
Allocated
Issued
Received
Installed
QC Result

Do not claim Installed merely because material was issued.

---

# 51. DOCUMENTS

Documents should be grouped by business requirement.

Example:

Survey Documents
3 / 3

Quality Documents
4 / 5

Handover Documents
2 / 4

Client Acceptance
Pending

Avoid one unstructured document dump.

---

# 52. COMMERCIAL READINESS

Commercial screen should explain readiness.

Example:

COMMERCIAL READINESS

Physical Work
✓ Complete

Quality
✓ Complete

Documents
⚠ 1 Missing

Client Acceptance
○ Pending

Billing Ready
NO

Blocker
Handover Certificate Missing

This is more useful than simply showing:

Billing Pending.

---

# 53. REPORTING

Reports should prioritize useful operational questions.

Examples:

Project Progress
Stage Aging
Blocked Sites
SLA Performance
Approval Aging
Quality Performance
NCR
Materials
Vendor Performance
Commercial Readiness

Support filters and drill-down.

Do not create charts merely to fill dashboard space.

---

# 54. VENDOR PERFORMANCE

Performance should show underlying reasons.

Example:

Vendor ABC

Sites Completed
48

On-Time
83%

First-Pass QC
76%

Open NCR
3

Rework
8%

Users should be able to drill into the records producing these metrics.

Do not create opaque scores without explanation.

---

# 55. SEARCH

Provide quick search for authorized resources.

Search examples:

Site ID
Site Name
Project
Vendor
Issue
NCR
Document

Search results should clearly indicate entity type and context.

Example:

IN-1455049
SITE
Karnataka Solar / Dharwad

---

# 56. FILTERS

Operational lists should support meaningful filters.

Examples:

Project
Region
Cluster
Stage
Status
Owner
Vendor
SLA
Issue Type
Quality State
Date

Do not create dozens of permanently visible filter controls.

Use a compact filter experience.

---

# 57. STATUS VISUALIZATION

Status should use:

Text
+ visual indicator

Do not rely solely on color.

Example:

● BLOCKED
⚠ OVERDUE
✓ COMPLETE
○ PENDING

Icons shown here are conceptual; implementation should use the approved icon system.

---

# 58. STATUS SEMANTICS

Use consistent semantic states across the product.

Examples:

Success
Completed / Approved / Passed

Warning
Attention / Due Soon

Danger
Blocked / Rejected / Overdue / Failed

Neutral
Draft / Not Started / Informational

Do not assign different meanings to the same status treatment across modules.

---

# 59. COLOR SYSTEM

Use a restrained professional color system.

Primary:
FLOWVERGE brand accent

Neutral:
Backgrounds
Surfaces
Borders
Text hierarchy

Semantic:
Success
Warning
Danger
Information

Avoid excessive bright colors.

Do not make every dashboard card a different color.

Final exact brand colors may be refined during visual implementation.

---

# 60. THEME

FLOWVERGE should support a clean professional application theme.

Primary production experience should be consistent across:

- dashboards
- forms
- tables
- site workspace
- mobile execution
- platform administration

Dark mode may be supported where practical but should not delay core production readiness.

---

# 61. TYPOGRAPHY

Use a modern, highly readable sans-serif UI font.

Typography hierarchy should clearly distinguish:

Page Title
Section Title
Card Title
Body
Secondary Text
Metadata

Avoid excessive font sizes or decorative typography.

Operational readability is more important than visual novelty.

---

# 62. SPACING

Use a consistent spacing system.

Screens should have enough whitespace to remain readable without wasting large amounts of screen area.

Operational tables and mobile screens may use denser layouts than marketing pages.

---

# 63. CARDS

Use cards for grouped information such as:

Current Action
Issue Summary
Approval Request
Quality Finding
Readiness
Platform Alerts

Do not wrap every piece of information in a separate card.

---

# 64. TABLES

Tables are appropriate for high-volume operational data.

Use:

- clear headers
- useful sorting
- filtering
- pagination
- sticky headers where beneficial
- responsive alternatives on mobile

Do not put every possible field into the default table.

---

# 65. MOBILE TABLES

Avoid wide desktop tables on mobile.

Use card/list representations for site/action records where appropriate.

Example:

IN-1455049

Installation
BLOCKED

Owner: Ravi
Issue: Material Shortage
SLA: Overdue 4h

[Open]

---

# 66. FORMS

Forms should:

- group related fields
- clearly identify required fields
- show validation near the problem
- preserve user input after recoverable errors
- avoid unnecessary fields

Long forms should use sections or steps where appropriate.

---

# 67. CONFIRMATION

Require clear confirmation for important destructive or high-impact actions.

Examples:

Suspend Organization
Reject Approval
Override Workflow
Adjust Inventory
Close NCR
Delete/Archive where permitted

Confirmation should explain the consequence.

Avoid confirmations for harmless routine navigation.

---

# 68. OVERRIDE UX

Workflow overrides should be visually distinct from normal execution.

Example:

OVERRIDE WORKFLOW

Current Stage
Installation

Requested Change
Skip Quality

Reason
[Required]

Warning:
This action will be recorded in audit history.

[Cancel]
[Confirm Override]

Only authorized users should see the action.

---

# 69. EMPTY STATES

Empty states should explain what the user can do next.

Bad:

No Data

Better:

No open NCRs.

There are currently no quality non-conformances requiring action.

Do not clutter empty states with unnecessary illustration.

---

# 70. LOADING STATES

Show clear loading state for operations that are not immediate.

Do not allow users to repeatedly submit the same critical action because the interface appears frozen.

---

# 71. SUCCESS FEEDBACK

After important actions, clearly communicate what happened.

Example:

Survey submitted successfully.

Next action:
PM Review

Owner:
Amit Sharma

This reinforces accountability transfer.

---

# 72. ERROR FEEDBACK

Error messages should explain:

- what failed
- what the user can do
- whether data was saved

Bad:

Something went wrong.

Better:

Evidence upload failed. Your checklist changes were saved, but the photo was not uploaded. Retry the upload before submitting the stage.

Do not claim success when a critical operation failed.

---

# 73. NOTIFICATIONS

Notifications should focus on action.

Examples:

Survey review assigned to you.

QC inspection due in 3 hours.

Material request is overdue.

Your submission was rejected.

Avoid notifying users about every minor activity.

---

# 74. NOTIFICATION NAVIGATION

Selecting a notification should take the user directly to the relevant context.

Not:

Notification
→ Dashboard
→ Search
→ Site
→ Stage
→ Action

Prefer:

Notification
→ Relevant Action

---

# 75. BREADCRUMBS / CONTEXT

For complex desktop workflows, maintain context.

Example:

Projects
/ Karnataka Solar
/ IN-1455049
/ Quality

Users should know where they are.

---

# 76. MAP EXPERIENCE

Map views may help with:

- site distribution
- blocked sites
- project progress
- evidence location
- field planning

Maps should complement operational data.

Do not force map visualization when a list/table answers the question better.

---

# 77. AI ASSISTANT UX

AI should appear as an assistant to operational data.

Example questions:

Why is this project behind?

Show material-blocked sites.

Which approvals are overdue?

Who approved the original QC at this site?

AI responses should link or reference underlying records where practical.

AI should not visually appear more authoritative than the actual operational record.

---

# 78. AI UNCERTAINTY

If AI lacks enough data, show that clearly.

Example:

I cannot determine why Site IN-XXXXX is blocked because no active issue or blocker record is available.

Do not fabricate a reason.

---

# 79. AI RECOMMENDATIONS

Recommendations should distinguish:

FACT

from

RECOMMENDATION

Example:

Fact:
8 sites are blocked by material shortages.

Recommendation:
Prioritize Cable Type X allocation because it affects 5 of the 8 blocked sites.

---

# 80. AUDIT UX

Audit/history is primarily read-only.

Authorized users may:

- view
- filter
- search
- inspect related records

Do not provide ordinary edit/delete controls for critical historical events.

---

# 81. PERMISSION-DENIED UX

If a user lacks permission:

Do not expose sensitive data and then disable editing.

Return an appropriate restricted state.

Example:

You do not have permission to view this quality record.

Avoid revealing protected details in error messages.

---

# 82. ENTITLEMENT-DISABLED UX

If a capability is not included for an organization, customer users should receive a clear product-level state.

Example:

Advanced Quality Management is not enabled for this organization.

Do not make entitlement-disabled functionality look broken.

Commercial upgrade UX can be added later.

---

# 83. SUSPENDED ORGANIZATION UX

A suspended organization should receive a controlled state according to service policy.

Do not let the normal application partially function in unpredictable ways.

Platform Admin should see the suspension status clearly.

---

# 84. RESPONSIVE PRIORITIES

Desktop:
Management
PM
Warehouse
Reporting
Platform Administration

Mobile:
Field execution
Site actions
Evidence
Issues
Quality inspections where appropriate

Core operational workflows should remain usable across supported devices.

---

# 85. PERFORMANCE UX

Avoid loading unnecessary data before rendering useful content.

Large:

Site Lists
Evidence Galleries
Audit Histories
Material Transactions

should support pagination/lazy loading or equivalent patterns.

Users should see useful feedback during long operations.

---

# 86. ACCESSIBILITY

Where practical:

- controls have labels
- keyboard navigation works
- focus state is visible
- contrast is sufficient
- status is not color-only
- forms expose clear errors
- buttons have understandable names

Accessibility should be considered part of product quality.

---

# 87. DESIGN COMPONENTS

Prefer reusable primitives for:

Buttons
Inputs
Selects
Date Controls
Status Badges
Cards
Tables
Dialogs
Drawers
Tabs
Timeline
Evidence Viewer
Action Card
Issue Card
Approval Card
Metric Card
Empty State
Loading State

Do not independently redesign the same UI pattern in each module.

---

# 88. ICONOGRAPHY

Use one consistent icon library already compatible with the project where practical.

Do not mix multiple icon styles without reason.

Icons should support meaning, not replace important text.

---

# 89. DESIGN SYSTEM EVOLUTION

Do not redesign the entire existing application in one phase.

When working on a module:

- inspect existing UI
- preserve functional behavior
- introduce shared components incrementally
- improve consistency
- avoid unrelated visual rewrites

The design system should emerge through controlled implementation.

---

# 90. CUSTOMER BRANDING

Initial FLOWVERGE should maintain one strong product identity.

Future enterprise capability may allow:

- organization logo
- limited brand accent
- customer-facing report branding

Do not build a complex white-label engine during the foundation phase.

---

# 91. LANGUAGE & LOCALIZATION

Initial product language may remain English.

Architecture/UI should avoid unnecessary decisions that make future localization difficult.

Do not hardcode business logic based on visible English labels.

---

# 92. DATE & TIME

Display date/time in a user-friendly format.

Store canonical timestamps appropriately in the backend.

Where distributed operations require it, clearly handle timezone context.

Audit timestamps must not be ambiguous.

---

# 93. NUMBERS & UNITS

Operational quantities should show their units.

Examples:

40 m
6 kW
12 panels

Do not show ambiguous numbers where units materially affect interpretation.

---

# 94. DESTRUCTIVE ACTIONS

Use stronger visual hierarchy for destructive actions.

Do not place:

Delete
Approve

as visually identical adjacent actions.

Deletion should be uncommon for traceable operational records.

Archive/deactivate may be more appropriate.

---

# 95. DEFAULT VIEWS

Default views should answer the user's most common operational question.

Examples:

PM
→ My Actions / Exceptions

Field
→ My Sites

QE
→ Pending Inspections

Warehouse
→ Pending Requests

Platform Admin
→ Organizations / Platform Attention

Do not default every role to the same analytics dashboard.

---

# 96. PRODUCT FEEL

FLOWVERGE should feel like:

An operational command system.

Not:

A collection of unrelated CRUD screens.

Navigation, actions, evidence, accountability and history should feel connected.

---

# 97. DESIGN SUCCESS TEST

Take one site.

An authorized user should be able to understand:

Current Status
Current Stage
Current Owner
Next Action
SLA
Blockers
Evidence
Approvals
Quality
Materials
Documents
Commercial Readiness
History

without manually combining information from multiple disconnected modules.

---

# 98. FIELD SUCCESS TEST

Give a field user an assigned site.

Without training on the entire platform, the user should be able to determine:

Where do I go?
What do I need to do?
What evidence is required?
What remains incomplete?
How do I report a blocker?
How do I submit?

If this is confusing, the field UX has failed.

---

# 99. MANAGEMENT SUCCESS TEST

Management should be able to open FLOWVERGE and quickly answer:

Which projects/sites need attention?

Why?

Who owns the problem?

How long has it been pending?

What is the impact?

What evidence/history supports the conclusion?

---

# 100. PLATFORM ADMIN SUCCESS TEST

FLOWVERGE operator should be able to determine:

Which organizations exist?
Which are active?
Which plan/service does each receive?
What entitlements are enabled?
Are limits being approached?
Who is the organization admin?
What platform actions occurred?
Is support access active?

without entering each customer's operational workspace.

---

# 101. FINAL DESIGN PRINCIPLE

FLOWVERGE should hide unnecessary complexity while exposing operational truth.

Every major interface should prioritize:

ACTION
→ OWNER
→ STATUS
→ DEADLINE
→ EXCEPTION
→ EVIDENCE
→ HISTORY

The system should make the next required action obvious and historical accountability easy to reconstruct.

---

# IMPLEMENTATION CONTROL

Design.md defines the approved product UX direction.

It does NOT authorize a full UI redesign.

Existing FLOWVERGE screens must first be inspected.

UI improvements should be implemented incrementally according to Phases.md.

Do not change working screens merely to make them visually match this document.

For every UI implementation:

1. Identify the user role.
2. Identify the user's primary question.
3. Identify required actions.
4. Identify exceptions.
5. Identify required information.
6. Apply authorization.
7. Apply responsive behavior.
8. Preserve traceability.
9. Test the actual workflow.

Current implementation status belongs in Memory.md.