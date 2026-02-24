# Group Setup Release Plan, Prioritization, and Acceptance Criteria

Companion to: `/Users/jaymahapatra/Desktop/Digital-Onboarding/docs/GROUP_SETUP_EPICS_USER_STORIES.md`

## 1) Priority framework

- P0: Required for compliant end-to-end group setup and enrollment transition.
- P1: Strong operational and UX improvements that materially reduce rework and cycle time.
- P2: Scale, optimization, analytics maturity, and governance hardening.

## 2) Epic prioritization

| Epic | Name | Priority | Why |
|---|---|---|---|
| E1 | Sold Cases and Intake Queue | P0 | Entry point for all setup flows |
| E2 | Access Assignment and Participant Onboarding | P0 | Required parties and permissions gating |
| E3 | Online vs Offline Setup Path Management | P0 | Business-critical alternate path |
| E4 | Group Setup Landing and Step Orchestration | P0 | Role-based progression and blockers |
| E5 | Licensing/Appointment/Compensable Code | P0 | Producer validation and compensation prerequisite |
| E6 | Company Information | P0 | Core employer profile input |
| E7 | Risk Assessment | P0 | Underwriting-critical data |
| E8 | Commission Agreement Acknowledgement | P0 | Legal/commission prerequisite |
| E9 | Renewal Notification Period | P1 | Important servicing data, not setup blocker in all cases |
| E10 | Group Structure | P0 | Eligibility/billing/enrollment data model core |
| E11 | Billing Setup | P0 | Financial setup prerequisite |
| E12 | Authorization and Legal Attestations | P0 | Compliance/legal completion |
| E13 | Finalize Group Setup | P0 | Controlled submission checkpoint |
| E14 | Master App and Enrollment Transition | P0 | Contract completion and handoff |
| E15 | Error Management and Ops Controls | P1 | Reduces operational failures and support burden |
| N1 | Performance and Reliability | P1 | Protects completion rates and trust |
| N2 | Security and Privacy Hardening | P0 | Mandatory for PII/PHI-sensitive workflows |
| N3 | Accessibility and Usability | P1 | Required for broad adoption and quality |
| N4 | Data Governance and Retention | P2 | Compliance lifecycle and enterprise readiness |

## 3) Release roadmap

## Release R1 (MVP - Compliant E2E Group Setup)
Scope: Must-have capabilities to complete group setup online/offline and transition to enrollment.

Included epics:
1. E1, E2, E3, E4
2. E5, E6, E7, E8
3. E10, E11, E12
4. E13, E14
5. N2 baseline controls

Exit criteria:
1. User can complete online setup from sold case through signed master app.
2. User can complete offline flow with required docs and submit packet.
3. Role-based step gating and required validations are enforced.
4. Full audit log exists for sensitive and submit/sign actions.
5. Transition to enrollment works with carry-forward data.

## Release R2 (Operational Excellence)
Scope: Improve throughput, reduce support load, and harden reliability.

Included epics:
1. E9, E15
2. N1, N3
3. Cross-cutting enhancement: notification SLA rules, richer diagnostics dashboard.

Exit criteria:
1. Stuck-case and SLA alerts operational.
2. End-user errors include actionable recovery guidance.
3. Performance SLOs met for key steps.
4. Accessibility standards pass defined audit threshold.

## Release R3 (Scale and Governance)
Scope: Enterprise-grade governance, analytics, and lifecycle controls.

Included epics:
1. N4
2. Advanced reporting and quality analytics extensions from E15.

Exit criteria:
1. Retention/deletion policy automation implemented by artifact class.
2. Submission quality and cycle-time analytics available by broker/employer/product.
3. Exportability and lineage available for regulatory and operational audit.

## 4) Acceptance criteria by epic

## E1 - Sold Cases and Intake Queue (P0)
1. User can search by client name and unique ID with expected results under 2 seconds for standard dataset.
2. Status filters return only matching records.
3. Case action panel shows valid start/continue actions based on case state.
4. Stale case indicator appears based on configured inactivity threshold.

## E2 - Access Assignment and Participant Onboarding (P0)
1. System blocks setup start if no Employer Admin exists.
2. Role-based contact add/edit/delete persists correctly and is auditable.
3. Invitation/resend flows send notification and update status.
4. Online maintenance access flag is saved and reflected in permissions.

## E3 - Online vs Offline Setup Path Management (P0)
1. User can choose online/offline mode with explicit confirmation.
2. Offline selection disables incompatible online actions until mode is changed by allowed policy.
3. Required offline file matrix is enforced before submit.
4. Upload workflow supports retry and shows success/failure states clearly.
5. Offline submission triggers implementation review event.

## E4 - Group Setup Landing and Step Orchestration (P0)
1. Landing page displays all applicable steps with status (not started/in progress/complete/blocked).
2. Role-based step visibility/editability is enforced.
3. Step blockers include human-readable reasons.
4. Context documents load with access control.

## E5 - Licensing/Appointment/Compensable Code (P0)
1. Users can add/remove writing producers with validation.
2. Licensing/appointment verification returns status per producer.
3. Compensable code verification persists verified state.
4. Commission split must total exactly 100% before step completion.
5. System blocks dependent commission acknowledgement until validation passes.

## E6 - Company Information (P0)
1. Required company fields cannot be bypassed.
2. Address and correspondence sections validate and persist correctly.
3. Contribution and ERISA fields save and reload accurately.
4. Prefilled values from upstream sources are identifiable and editable per business rules.

## E7 - Risk Assessment (P0)
1. Risk sections support create/edit/delete where applicable.
2. Required risk fields enforced before step completion.
3. Review checkpoint summarizes all entered risk data.
4. Submitted risk data is available to underwriting consumers.

## E8 - Commission Agreement Acknowledgement (P0)
1. Agreement data reflects verified producers and commission splits.
2. Required fields (effective date/payee/split details) are present and valid.
3. Step cannot be marked complete without required acknowledgement action.
4. Status changes are captured in audit history.

## E9 - Renewal Notification Period (P1)
1. User can select renewal period from allowed options.
2. Selection is displayed in review/finalize.
3. Updated value propagates to downstream servicing payload.

## E10 - Group Structure (P0)
1. User can add/manage classes, locations, departments, and contacts.
2. Billing address rules enforce required dependencies.
3. Case structure build validates class-location mappings.
4. Assign class to locations supports multi-row workflows without data loss.

## E11 - Billing Setup (P0)
1. Billing options render conditionally based on chosen model.
2. Payment method add/confirm workflow persists valid methods.
3. Invalid payment setup blocks next step with clear message.
4. Billing configuration is exported to downstream billing consumer contract.

## E12 - Authorization and Legal Attestations (P0)
1. Required disclosures/authorizations cannot be skipped.
2. Conditional sections appear/disappear based on prior answers.
3. Required document uploads are enforced where mandated.
4. Acceptance evidence captures user, timestamp, and context metadata.

## E13 - Finalize Group Setup (P0)
1. Finalize page aggregates all critical setup data.
2. Editable sections route user back to source step and preserve navigation context.
3. Submission is blocked until all required validations pass.
4. Post-submit lock prevents unauthorized edits.

## E14 - Master App and Enrollment Transition (P0)
1. Employer can sign master app with verifiable signature evidence.
2. Transition page handles loading state and timeout behavior gracefully.
3. Enrollment handoff receives required carry-forward fields.
4. Failure path includes retry/escalation options.

## E15 - Error Management and Ops Controls (P1)
1. User-facing errors provide actionable guidance.
2. Support can view event timeline and failure context per case.
3. SLA alerts fire for configured inactivity and pending actions.
4. Ops dashboard exposes stuck-step and rework metrics.

## N1 - Performance and Reliability (P1)
1. Key read/write actions meet defined p95 latency targets.
2. Draft saves are resilient to transient failures with retry.
3. No data loss across logout/login resume scenarios.

## N2 - Security and Privacy Hardening (P0)
1. RBAC denies unauthorized case/step/data access.
2. Sensitive data encrypted in transit and at rest.
3. Sensitive actions logged with immutable audit records.
4. File upload/download controls enforce least privilege.

## N3 - Accessibility and Usability (P1)
1. Core workflows support keyboard-only navigation.
2. Form controls and validation messaging meet accessibility checks.
3. Responsive layouts preserve usability on common viewport ranges.

## N4 - Data Governance and Retention (P2)
1. Artifact retention rules can be configured and enforced.
2. Purge/archive jobs run with audit evidence.
3. Regulatory export supports filtered retrieval of key records.

## 5) Suggested implementation order (story slices)

Slice A (R1 start):
1. E1, E2, E4 baseline + N2 auth/audit base.

Slice B:
1. E5, E6, E7.

Slice C:
1. E8, E10, E11.

Slice D:
1. E12, E13, E14.

Slice E (R2):
1. E3 hardening, E9, E15, N1, N3.

Slice F (R3):
1. N4 and advanced operational analytics.

## 6) Recommended planning metadata per story (for Jira/Azure)

1. Story points and team owner (FE/BE/QA/UX).
2. Dependency links (blocked by / blocks).
3. Compliance tag (PII/PHI/legal/e-sign).
4. Test strategy tag (unit/integration/UAT/regression).
5. Release target and rollout strategy (feature flag, pilot cohort).
