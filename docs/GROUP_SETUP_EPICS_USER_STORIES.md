# Group Setup - Enriched Epics and User Stories

Source: `/Users/jaymahapatra/Desktop/Digital-Onboarding/User Guide_Group Setup.pdf` (115 pages)

This backlog expands the guide into a production-ready product model with business, compliance, operational, and technical context.

## 1) Product context

Digital Group Setup is a multi-party, multi-step onboarding workflow for small market group benefits. It supports brokers, employers, GAs/TPAs, internal operations, and downstream enrollment handoff.

## 2) Core personas

1. Broker user: owns case progression and producer setup.
2. Employer admin: provides employer data, authorizations, signatures.
3. GA/TPA user: supports broker and employer setup tasks.
4. Internal implementation user: reviews offline packets, handles exceptions.
5. Underwriting/operations user: consumes setup outputs and validates risk/compliance.
6. Platform admin/support: manages access, audits, issue resolution.

## 3) Cross-cutting functional capabilities

These apply to all workflow modules and should be treated as shared product capabilities.

### 3.1 Workflow orchestration
1. Dynamic step engine with role-based visibility and editability.
2. Step gating with prerequisite checks and explicit blocker reasons.
3. Save draft, resume, cancel, and restart controls.
4. Versioning for key submitted sections (who changed what and when).

### 3.2 Access and identity
1. Role-based access control by case and step.
2. Contact invitation and verification flow (email-based access grants).
3. Ongoing maintenance access flags and lifecycle management.
4. Delegation/impersonation controls for support/admin users with audit logging.

### 3.3 Notifications and communications
1. Event-driven notification templates (assignment, reminder, pending signature, submitted).
2. SLA reminders for stale cases and pending actions.
3. In-app notification center and email fallback.
4. Escalation routing to implementation/support queues.

### 3.4 Document and file management
1. Structured document taxonomy (master app, census, commission, supplemental).
2. Upload validation (file type/size/malware scan/checksum).
3. Required-document matrix by product/situs/state.
4. Secure storage and download with retention controls.

### 3.5 Compliance, legal, and audit
1. Tamper-evident audit trail for all sensitive actions.
2. E-sign capture with signer identity, timestamp, IP/device metadata.
3. Consent/disclosure acceptance tracking by section.
4. Compliance exports for dispute and regulatory support.

### 3.6 Data quality and validations
1. Field-level and cross-step validation rules.
2. Data quality checks before final submit.
3. Duplicate/conflict detection (contacts, addresses, producer records).
4. Clear remediation guidance for errors.

### 3.7 Reporting and operations dashboard
1. Case funnel metrics by stage and role.
2. Aging/stuck-case monitoring.
3. Submission quality KPIs (rework rate, rejection rate, cycle time).
4. Operational drill-down by broker, employer, and product.

### 3.8 Security and privacy
1. Least-privilege access model.
2. Encryption in transit/at rest for PII/PHI-sensitive data.
3. Session controls, timeout, suspicious activity handling.
4. Download/upload access controls and activity logging.

### 3.9 UX and accessibility
1. Progress indicators with completion confidence.
2. Contextual help and tooltips for domain terms.
3. WCAG-aligned form interactions and keyboard navigation.
4. Responsive behavior for tablet/mobile-assisted completion.

## 4) Module epics and enriched user stories

## EPIC 1: Sold Cases and Intake Queue
Goal: Provide efficient sold-case discovery and setup initiation.

### User stories
1. As a broker user, I want fast search by client name and unique ID so I can find the correct case quickly.
2. As a user, I want status filters and sortable columns so I can prioritize my workload.
3. As an operations lead, I want queue views by stale age and owner so stalled cases are visible.
4. As a system, I want case readiness checks before setup start so users are not routed into incomplete flows.
5. As a user, I want to see a case timeline summary from sold to current status so I understand context instantly.

## EPIC 2: Access Assignment and Participant Onboarding
Goal: Assign correct participants and permissions for group setup.

### User stories
1. As a broker/GA/TPA user, I want to add role-based contacts so the right stakeholders can act.
2. As a system, I need at least one employer admin assigned before setup can start so mandatory employer actions can be completed.
3. As a user, I want to edit/delete assigned contacts so setup participants stay accurate.
4. As a user, I want to set online maintenance access per contact so post-setup access remains controlled.
5. As a contact, I want invitation and access confirmation messages so I can enter the portal confidently.
6. As support, I want to re-send invitations and unlock access so user issues can be resolved quickly.

## EPIC 3: Online vs Offline Setup Path Management
Goal: Support online and offline completion with controlled transitions.

### User stories
1. As a user, I want to choose online or offline mode with clear consequences so I can pick the right path.
2. As a system, I want to lock incompatible actions after mode selection so there is no contradictory progress.
3. As a user, I want downloadable offline packet instructions and required forms so offline completion is possible.
4. As a user, I want guided file upload with validation and retry so offline packet submission is reliable.
5. As implementation staff, I want submitted offline packets routed to review queues so manual processing starts promptly.
6. As a system, I want required-file completeness validation before offline submit so incomplete packets are blocked.

## EPIC 4: Group Setup Landing and Step Orchestration
Goal: Present role-specific required actions and orchestrate step progression.

### User stories
1. As a user, I want a step-by-step landing page with status and blockers so I know what to do next.
2. As a system, I want role-based step availability so users only see permitted actions.
3. As a user, I want right-rail reference documents and sold-case context so I can complete forms accurately.
4. As a user, I want explicit step ownership indicators (broker vs employer tasks) so coordination is clear.

## EPIC 5: Step 1 - Licensing, Appointment, and Compensable Code
Goal: Validate producer eligibility and compensation prerequisites.

### User stories
1. As a broker user, I want to add/remove writing producers so producer roster is accurate.
2. As a user, I want producer licensing/appointment verification so ineligible producers are flagged.
3. As a user, I want compensable code verification so compensation setup is valid.
4. As a user, I want commission split management totaling 100% so legal compensation forms can be generated.
5. As a system, I want to block downstream commission acknowledgement when validation fails so compliance risk is reduced.
6. As a user, I want clear remediation guidance when a producer fails verification so I can resolve issues quickly.

## EPIC 6: Step 2 - Company Information
Goal: Capture complete employer profile and eligibility/billing context.

### User stories
1. As an employer user, I want to capture legal/basic company information and addresses so account setup is accurate.
2. As a user, I want contribution setup inputs so funding assumptions are explicit.
3. As a user, I want ERISA fields and declarations so required legal context is captured.
4. As a system, I want prefill from sold-case/RFP data and flag variances so duplicate entry and mismatch risk are reduced.
5. As a user, I want correspondence and mailing details validated so communication and billing are correct.

## EPIC 7: Step 3 - Risk Assessment
Goal: Collect underwriting-risk factors with data integrity controls.

### User stories
1. As an employer user, I want to provide pregnancy, disability, and health-risk information so underwriting receives required inputs.
2. As a user, I want add/edit employee risk detail in structured drawers so data entry remains consistent.
3. As a system, I want range and completeness validation on risk fields so unusable submissions are prevented.
4. As underwriting, I want summarized risk outputs for review so decisions are faster and auditable.

## EPIC 8: Step 4 - Commission Agreement Acknowledgement
Goal: Generate and execute commission acknowledgement artifacts.

### User stories
1. As a broker/GA/TPA user, I want agreement forms generated from verified producer and split data so documentation is accurate.
2. As a user, I want to review effective date, payee, and split details before acknowledgement so errors are caught early.
3. As a system, I want this step enforced before final setup submission so required legal artifacts are complete.
4. As support/ops, I want status visibility on pending acknowledgements so I can unblock completion.

## EPIC 9: Step 5 - Renewal Notification Period
Goal: Capture renewal notice preferences used in servicing and renewals.

### User stories
1. As an employer user, I want to select renewal notification timing so renewal operations follow employer preference.
2. As a system, I want persisted and reviewable renewal settings so users can confirm at finalize step.
3. As servicing operations, I want renewal setting outputs available downstream so notifications are correctly scheduled.

## EPIC 10: Step 6 - Group Structure
Goal: Build employer organizational structure for eligibility, billing, and enrollment mapping.

### User stories
1. As a user, I want to create classes with descriptions/rules so eligibility is structured.
2. As a user, I want to manage locations/subsidiaries and additional billing addresses so multi-site organizations are represented.
3. As a user, I want to define departments and role contacts so administrative ownership is clear.
4. As a user, I want to build and review case structure mappings so class-location-department assignments are valid.
5. As a system, I want dependency validations across classes/locations/billing/contacts so structural integrity is enforced.
6. As a user, I want to assign classes to locations in bulk where possible so setup time is reduced.

## EPIC 11: Step 7 - Billing Setup
Goal: Configure billing behavior, remittance preferences, and payment methods.

### User stories
1. As an employer user, I want to define billing model and responsible entities so invoicing is correct.
2. As a user, I want to add and confirm payment methods for online payment so recurring collections can occur.
3. As a system, I want billing mode-based conditional fields so users complete only relevant information.
4. As finance operations, I want billing setup outputs normalized for downstream billing systems so handoff is seamless.

## EPIC 12: Step 8 - Authorization and Legal Attestations
Goal: Collect all required disclosures, authorizations, and policy declarations.

### User stories
1. As an employer user, I want to complete online access and privacy acknowledgements so legal disclosures are accepted.
2. As a user, I want to complete intermediary compensation, third-party billing, gross-up, HIPAA, disability taxation, and beneficial interest sections so compliance requirements are met.
3. As a user, I want to upload required supporting forms where needed so authorization records are complete.
4. As a system, I want conditional rendering and requiredness by prior answers so the authorization flow stays relevant and complete.
5. As compliance, I want immutable acceptance evidence with signer metadata so audits and disputes can be supported.

## EPIC 13: Step 9 - Finalize Group Setup
Goal: Provide full review and controlled final submission.

### User stories
1. As a user, I want a complete review of all prior steps so I can verify correctness before submit.
2. As a user, I want section-level edit links from finalize so corrections are efficient.
3. As a system, I want final data completeness and rule checks before submit so rejected downstream handoffs are minimized.
4. As a system, I want post-submit lock behavior and submission receipt so state integrity and user confidence are maintained.

## EPIC 14: Step 10 - Master Application and Transition to Enrollment
Goal: Complete master application signature and transition to enrollment workflow.

### User stories
1. As an employer user, I want to sign the master application digitally so legal completion is captured.
2. As a system, I want transition-state handling while core data initializes so the user experience is stable.
3. As a user, I want direct handoff into enrollment with carry-forward data so no duplicate entry is needed.
4. As operations, I want transition audit events and failure alerts so handoff issues are quickly resolved.

## EPIC 15: Error Management, Support, and Operational Controls
Goal: Ensure recoverability, supportability, and operational transparency at scale.

### User stories
1. As a user, I want clear errors and recovery actions when any step fails so I can continue with minimal support dependency.
2. As a support user, I want case-level diagnostics and event history so I can troubleshoot quickly.
3. As an admin, I want configurable notification templates and SLAs so communication is consistent.
4. As operations, I want dashboards for cycle time, stuck steps, and submission quality so process performance can improve continuously.

## 5) Non-functional epics (recommended)

## EPIC N1: Performance and reliability
1. As a user, I want each step load/save under defined latency targets so long forms remain usable.
2. As a system, I want resilient save/retry behavior for transient failures so data loss is prevented.

## EPIC N2: Security and privacy hardening
1. As a security officer, I want end-to-end PII/PHI controls and auditability so regulatory requirements are met.
2. As a platform team, I want robust auth/session/authorization controls so cross-case data leakage is prevented.

## EPIC N3: Accessibility and usability
1. As a user, I want keyboard/screen-reader compatible workflows so completion is possible for all users.
2. As product, I want consistent UX patterns and contextual guidance so training burden decreases.

## EPIC N4: Data governance and retention
1. As compliance, I want retention/deletion rules by artifact type so governance policies are enforced.
2. As operations, I want data export and lineage for critical setup fields so downstream reconciliation is possible.

## 6) Suggested delivery sequencing
1. Foundation: Epics 1 to 4 + N2 baseline + audit/event model.
2. Core onboarding: Epics 5 to 9.
3. Compliance completion: Epics 10 to 12.
4. Submission and handoff: Epics 13 and 14.
5. Operational maturity: Epic 15 + N1/N3/N4.

## 7) Recommended next artifacts
1. Acceptance criteria per story.
2. Story priority (P0/P1/P2) with release slices.
3. API contract map by epic.
4. UI screen inventory and test case matrix.
