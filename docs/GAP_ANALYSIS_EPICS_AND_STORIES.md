# Epics and User Stories for Digital Onboarding Application Gaps

This document outlines the epics and user stories required to address the functionality gaps identified during the codebase analysis.

---

## Epic 1: Implement Backend Services and Data Persistence

**Description:** This epic covers the foundational work of connecting the frontend UI to a functional backend. The goal is to transform the application from a UI facade into a data-driven application where user progress is saved and loaded from a central database.

**User Stories:**

*   **Story:** As a developer, I want to create API endpoints and database models for each step of the workflow (Group Structure, Risk Assessment, etc.) so that user data can be persisted.
*   **Story:** As a user, I want my progress to be saved automatically when I move from one step to the next so that I don't lose my work if I close the browser.
*   **Story:** As a user, I want the application to load my previously saved data when I return to a case so that I can continue where I left off.
*   **Story:** As a developer, I want to replace all hardcoded placeholder data in the frontend (e.g., group numbers, product lists, user roles) with data fetched from the backend so that the UI reflects the real state of the case.
*   **Story:** As a user, I want a "Save as Draft" button within complex steps like "Group Structure" so that I can save my progress without having to complete the entire step.

---

## Epic 2: Implement Critical Business Workflows

**Description:** This epic focuses on implementing the major business rules that trigger changes in the application's workflow state. This is crucial for moving beyond the "happy path" and handling real-world scenarios.

**User Stories:**

*   **Story:** As an underwriter, I want the system to automatically flag a case for manual review when a user indicates there are significant health risks so that I can assess the risk profile before approval.
*   **Story:** As a sales representative, I want the system to trigger a "requote" workflow when a user changes the Situs State or contribution levels beyond the allowed threshold so that the pricing can be recalculated accurately.
*   **Story:** As a developer, I want to implement a state machine on the backend to manage the workflow status (e.g., `IN_PROGRESS`, `PENDING_REVIEW`, `REQUOTE_REQUIRED`) so that the application can react to different states.
*   **Story:** As a user, I want to be clearly notified and redirected when my changes require a requote or an underwriting review so that I understand what is happening and what to do next.

---

## Epic 3: Integrate Third-Party Services

**Description:** This epic covers the integration with external services for license verification, payment processing, and email notifications, which are critical for a functional application.

**User Stories:**

*   **Story:** As a broker, I want to verify a producer's license status and compensable code against a live, authoritative system so that I can ensure compliance and data accuracy.
*   **Story:** As a developer, I want to integrate a PCI-compliant payment gateway (e.g., Stripe, Braintree) to securely tokenize and process online credit card and bank account payments.
*   **Story:** As a user, I want to receive a real confirmation email after my payment is successfully processed so that I have a record of the transaction.
*   **Story:** As a sales representative, I want an automated email notification to be sent when a new sold case has been inactive for more than 24 hours so that I can follow up with the user.
*   **Story:** As a developer, I want to implement a secure file storage solution (e.g., AWS S3) to handle the upload of the HIPAA Business Associate Agreement.

---

## Epic 4: Implement Role-Based Access Control (RBAC) and Logic

**Description:** This epic focuses on ensuring the UI and workflow adapt to the specific role of the logged-in user, as described in the user guide.

**User Stories:**

*   **Story:** As a developer, I want to create a robust RBAC system on the backend that defines permissions for different roles (e.g., Employer, Broker, TPA).
*   **Story:** As an Employer user, I want to see a `Group ID` in the client list instead of a `Unique ID` to match my business context.
*   **Story:** As a Broker, I want exclusive access to the "Commission Agreement Acknowledgement" step so that only authorized users can perform this action.
*   **Story:** As a TPA user, I want the "Bill Type" in the Billing Setup step to correctly display "Self Administered Premium (SAP) Bill".
*   **Story:** As a developer, I want the frontend to query the user's role and permissions to conditionally render UI elements and control access to entire workflow steps, such as hiding the "Authorization" forms that are not applicable to the group.

---

## Epic 5: Address Minor Feature and UI Gaps

**Description:** This epic is a collection of smaller, but still important, functional and UI gaps that were identified across the application.

**User Stories:**

*   **Story:** As a user, I want to be presented with a legally binding e-signature form (declaration checkbox and name input) before submitting my initial payment to authorize the transaction.
*   **Story:** As a user adding a new contact, I want a checkbox to "copy the Executive Contact's information to all other roles" to save time on data entry.
*   **Story:** As a developer, I want to ensure the data summary on the "Finalize" page is consistent with the data fields collected in the preceding steps.
*   **Story:** As a user, I want to see the fully generated Master Application document before I am asked to e-sign it.
*   **Story:** As a user, I want the "Begin Enrollment" button to navigate me to the enrollment module after I have successfully completed the group setup.

---

## Epic 6: UI/UX Modernization and Enhancement

**Description:** This epic covers suggested improvements to the UI/UX to make the application more intuitive, user-friendly, and modern, building upon the excellent existing prototype.

**User Stories:**

*   **Story:** As a user, I want to see a dashboard view on the 'My Clients' page with summary cards and charts so that I can get an at-a-glance overview of my workload and priorities.
*   **Story:** As a user, I want the 'Group Structure' step to be presented as a central hub with clear navigation to each sub-section so that the complex task of defining the group feels more manageable.
*   **Story:** As a user, I want to see a persistent sidebar showing all workflow steps at all times so that I always know where I am in the overall process.
*   **Story:** As a user, I want to see info icons with helpful tooltips for complex fields so that I can understand what is being asked without leaving the page.
*   **Story:** As a user, I want to be directed to a clear status page when my work requires a manual review so that I understand what is happening, what to expect, and what I can do next.
*   **Story:** As a user, I want to edit simple items like department names directly in the table so that I can make quick corrections without the interruption of a modal dialog.
*   **Story:** As a developer, I want to add subtle animations and transitions to UI elements so that the application feels more responsive, polished, and modern.
*   **Story:** As a user, I want actionable empty states with integrated buttons (e.g., "Add Your First Location") so that I am guided on what to do next.
