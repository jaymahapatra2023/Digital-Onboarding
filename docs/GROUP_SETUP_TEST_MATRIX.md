# Group Setup Story-Level Test Matrix

Companion docs:
- `/Users/jaymahapatra/Desktop/Digital-Onboarding/docs/GROUP_SETUP_EPICS_USER_STORIES.md`
- `/Users/jaymahapatra/Desktop/Digital-Onboarding/docs/GROUP_SETUP_RELEASE_PLAN_AND_ACCEPTANCE.md`

Priority legend:
- P0 = critical path/compliance/security
- P1 = important operational quality
- P2 = optimization/scale

Type legend:
- FE = frontend UX validation
- BE = API/business rule validation
- INT = integration (cross-service)
- E2E = full workflow
- SEC = security/authorization

## E1 Sold Cases and Intake Queue

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E1-001 | P0 | FE | Search by client name/ID | Search valid client name and ID | Matching cases displayed only |
| GS-E1-002 | P0 | FE | Status filters | Filter by each status value | Table shows only selected status cases |
| GS-E1-003 | P1 | FE | Queue sorting | Sort by status/date/name | Correct order and stable paging |
| GS-E1-004 | P0 | BE | Case readiness checks | Attempt Begin Setup for non-ready case | Action blocked with blocker reason |
| GS-E1-005 | P1 | INT | Stale case signal | Case inactive beyond threshold | Stale indicator visible and queryable |

## E2 Access Assignment and Participant Onboarding

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E2-001 | P0 | BE | Employer required | Start setup without Employer Admin | Start blocked with validation message |
| GS-E2-002 | P0 | FE | Add contacts by role | Add Employer/Broker/GA/TPA contacts | Contacts saved with correct role |
| GS-E2-003 | P0 | FE | Edit/delete access contacts | Edit then delete contact | Changes persist; deleted contact removed |
| GS-E2-004 | P1 | INT | Invite and resend | Send invite then resend | Invite status updates and email emitted |
| GS-E2-005 | P0 | SEC | Access scope | Non-assigned user accesses case | Access denied |
| GS-E2-006 | P1 | BE | Ongoing maintenance flag | Toggle flag Yes/No | Permission flag persisted correctly |

## E3 Online vs Offline Path Management

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E3-001 | P0 | E2E | Mode selection confirmation | Choose offline and confirm prompts | Case enters offline mode |
| GS-E3-002 | P0 | BE | Incompatible action lock | Offline case attempts online begin | Online action disabled/blocked |
| GS-E3-003 | P0 | FE | Required docs matrix | Upload subset of required docs | Submit remains disabled |
| GS-E3-004 | P0 | FE | Upload validation | Upload invalid file type/size | Validation error and no save |
| GS-E3-005 | P1 | FE | Retry handling | Trigger upload failure then retry | Retry succeeds and status updates |
| GS-E3-006 | P1 | INT | Ops review routing | Submit complete offline packet | Implementation review event created |

## E4 Online Landing and Orchestration

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E4-001 | P0 | FE | Step status model | Load case with mixed step states | Not started/in progress/complete/blocked rendered accurately |
| GS-E4-002 | P0 | SEC | Role-based step visibility | Login as Broker vs Employer | Only permitted steps editable |
| GS-E4-003 | P1 | FE | Blocker clarity | Attempt blocked step | Human-readable blocker reason displayed |
| GS-E4-004 | P1 | INT | Reference docs panel | Open linked reference docs | Authorized docs load successfully |

## E5 Licensing/Appointment/Compensable Code

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E5-001 | P0 | FE | Add writing producer | Add valid producer | Producer row saved |
| GS-E5-002 | P0 | BE | License verification | Verify status for active producer | Status set to Active |
| GS-E5-003 | P0 | BE | Code verification | Verify compensable code | Verified flag and code persisted |
| GS-E5-004 | P0 | BE | Commission total = 100 | Enter splits totaling != 100 | Next blocked with validation |
| GS-E5-005 | P1 | FE | Distribute equally | Click distribute equally | Splits auto-filled and total 100 |
| GS-E5-006 | P0 | INT | Dependent step gating | Fail verification then go Step 4 | Step 4 blocked |

## E6 Company Information

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E6-001 | P0 | FE | Required fields | Submit with missing required fields | Inline validation errors |
| GS-E6-002 | P0 | BE | Address persistence | Save primary/correspondence addresses | Reload shows exact saved values |
| GS-E6-003 | P1 | FE | Prefill behavior | Load prefilled RFP fields | Prefilled values displayed and marked |
| GS-E6-004 | P1 | INT | Rule-based redirect | Edit underwriting-owned field | Redirect/notification per rule |

## E7 Risk Assessment

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E7-001 | P0 | FE | Add employee risk details | Add pregnancy/health/disability details | Row added and editable |
| GS-E7-002 | P0 | BE | Required risk validation | Leave mandatory risk field blank | Step completion blocked |
| GS-E7-003 | P1 | FE | Review checkpoint | Open review panel | All entered data summarized |
| GS-E7-004 | P1 | INT | Underwriting handoff | Complete step and trigger output | Risk payload available to consumer |

## E8 Commission Agreement Acknowledgement

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E8-001 | P0 | BE | Form generation | Verified producers + 100% split | Commission forms generated |
| GS-E8-002 | P0 | FE | Agreement detail review | Inspect payee/date/split details | Values match source step data |
| GS-E8-003 | P0 | BE | Completion enforcement | Skip acknowledgement and proceed | Proceed blocked |
| GS-E8-004 | P1 | INT | Audit trail | Complete acknowledgement | Audit event emitted with actor/time |

## E9 Renewal Notification Period

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E9-001 | P1 | FE | Renewal selection | Select period and save | Value persists |
| GS-E9-002 | P1 | FE | Finalize visibility | Open Finalize page | Saved renewal period visible |
| GS-E9-003 | P1 | INT | Downstream propagation | Submit case | Renewal value included in downstream payload |

## E10 Group Structure

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E10-001 | P0 | FE | Add class | Add valid class | Class appears in table |
| GS-E10-002 | P0 | FE | Add locations/subsidiaries | Add multiple locations | All locations saved |
| GS-E10-003 | P0 | FE | Add billing addresses | Add other billing address | Address saved and listed |
| GS-E10-004 | P0 | FE | Add departments | Add department entries | Department table updates |
| GS-E10-005 | P0 | FE | Contact roles | Add/update additional roles | Contact records reflect edits |
| GS-E10-006 | P0 | BE | Structural dependencies | Build case structure with missing dependencies | Validation blocks save |
| GS-E10-007 | P1 | FE | Assign classes to locations | Map classes to locations | Mapping persists and visible |

## E11 Billing Setup

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E11-001 | P0 | FE | Billing mode conditional fields | Toggle billing mode values | Relevant fields show/hide correctly |
| GS-E11-002 | P0 | FE | Add payment method | Add valid card/account details | Method saved and selectable |
| GS-E11-003 | P0 | BE | Invalid payment prevention | Save invalid payment data | Save blocked with validation |
| GS-E11-004 | P1 | INT | Billing export contract | Submit case | Billing config payload valid |

## E12 Authorization and Legal Attestations

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E12-001 | P0 | FE | Required acknowledgements | Skip required notice | Cannot proceed |
| GS-E12-002 | P0 | FE | Conditional sections | Set triggering answers | Correct sections appear/disappear |
| GS-E12-003 | P0 | FE | Required uploads | Omit required HIPAA doc | Step incomplete |
| GS-E12-004 | P0 | SEC | Acceptance evidence | Complete attestations | Signer metadata captured |
| GS-E12-005 | P1 | BE | Optional sections | Leave optional section blank | Step still valid if rules allow |

## E13 Finalize Group Setup

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E13-001 | P0 | FE | Consolidated review | Open Finalize page | All major sections present |
| GS-E13-002 | P0 | FE | Edit jump links | Edit from finalize and return | Navigation returns to finalize state |
| GS-E13-003 | P0 | BE | Final validations | Attempt submit with missing required data | Submit blocked with checklist |
| GS-E13-004 | P0 | BE | Post-submit lock | Submit then attempt back-edit | Unauthorized edits blocked |

## E14 Master App and Enrollment Transition

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E14-001 | P0 | E2E | Master app signing | Employer signs master app | Signature persisted and case state updated |
| GS-E14-002 | P0 | FE | Transition/loading flow | Trigger transition with normal latency | Loading state shown then redirect |
| GS-E14-003 | P0 | INT | Enrollment carry-forward | Enter enrollment after transition | Effective date/departments etc. preloaded |
| GS-E14-004 | P1 | FE | Transition timeout handling | Simulate long load/timeout | Retry/escalation message shown |

## E15 Error Management and Ops Controls

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-E15-001 | P1 | FE | Actionable user errors | Trigger known error path | Message includes remediation guidance |
| GS-E15-002 | P1 | INT | Support diagnostics | Open case diagnostics view | Event timeline and error context visible |
| GS-E15-003 | P1 | INT | SLA alerts | Case exceeds inactivity SLA | Alert generated and routed |
| GS-E15-004 | P1 | INT | Ops dashboard metrics | Load ops dashboard | Stuck-step/rework metrics displayed |

## N1 Performance and Reliability

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-N1-001 | P1 | INT | p95 latency targets | Load/save across core steps under load | Meets defined SLO |
| GS-N1-002 | P1 | BE | Resilient draft save | Simulate transient API failures | Retry succeeds without data loss |
| GS-N1-003 | P1 | E2E | Resume behavior | Save draft, logout/login, resume | State restored accurately |

## N2 Security and Privacy Hardening

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-N2-001 | P0 | SEC | RBAC enforcement | Access another user’s case by URL/API | Access denied |
| GS-N2-002 | P0 | SEC | Sensitive action audit | Execute submit/sign/delete actions | Immutable audit records present |
| GS-N2-003 | P0 | SEC | File access controls | Download unauthorized file | Forbidden response |
| GS-N2-004 | P0 | SEC | Session security | Idle timeout/session invalidation | Session expired and re-auth required |

## N3 Accessibility and Usability

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-N3-001 | P1 | FE | Keyboard-only flow | Complete step without mouse | All controls operable |
| GS-N3-002 | P1 | FE | Validation accessibility | Trigger form errors | Screen reader-readable error text |
| GS-N3-003 | P1 | FE | Responsive behavior | Test mobile/tablet breakpoints | Core actions remain usable |

## N4 Data Governance and Retention

| Test ID | Priority | Type | Story/AC focus | Test scenario | Expected result |
|---|---|---|---|---|---|
| GS-N4-001 | P2 | BE | Retention policy enforcement | Run retention job on expired artifacts | Artifacts archived/purged per policy |
| GS-N4-002 | P2 | INT | Purge audit evidence | Execute purge/archive operation | Audit trail includes actor/time/result |
| GS-N4-003 | P2 | INT | Regulatory export | Export filtered case artifacts | Export complete and accurate |

## End-to-end regression scenarios

| Scenario ID | Priority | Flow |
|---|---|---|
| GS-E2E-001 | P0 | Full online flow: sold case -> access assignment -> steps 1-10 -> master app sign -> enrollment transition |
| GS-E2E-002 | P0 | Offline flow: sold case -> offline selection -> form download -> uploads -> submit to implementation |
| GS-E2E-003 | P0 | Mixed-role flow: broker completes producer/structure, employer completes authorizations/signatures |
| GS-E2E-004 | P1 | Recovery flow: draft save, logout, resume, finalize submission |
| GS-E2E-005 | P1 | Exception flow: failed validation in step 1 and remediation to successful completion |

## Test data recommendations

1. At least 3 case types: standard, multi-location complex, high-compliance case.
2. Role personas: broker, GA/TPA, employer admin, support admin.
3. Producer permutations: single producer, multi-producer split, invalid license case.
4. Billing permutations: online payment, non-online, third-party billing.
5. Authorization permutations: HIPAA required/not required, no-claims optional/required.

## Exit criteria by release

R1 exit:
1. All P0 tests pass for E1-E14 and N2 baseline.
2. No Sev1/Sev2 open defects in critical setup paths.

R2 exit:
1. All P1 tests for E15/N1/N3 pass.
2. Measured reduction in stuck cases and support escalations.

R3 exit:
1. N4 governance tests pass.
2. Compliance export and retention jobs validated in UAT.
