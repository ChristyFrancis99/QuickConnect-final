# QuickConnect — Implemented vs Pending

> **This is the project handover log for developers and AI coding tools.** Update it after every meaningful implementation session so work can resume even if an AI tool runs out of credits or a session ends.

**Last reviewed:** 2026-11-11  
**Current baseline:** Repository code on `main` at the time this file was created.  
**Status rule:** A screen/demo interaction is not the same as a production integration. Keep those statuses separate.

## 1. Status legend

- [x] **Implemented (prototype):** Present in the repository and usable with demo/sample data.
- [ ] **Pending:** Not implemented yet, or not verified in the repository.
- [~] **In progress:** Work has started but is not complete.
- **Production-ready:** Use this label only after real services, security, persistence, error handling, and tests have been implemented and verified.

## 2. Implemented now

### Application foundation
- [x] React 19 + TypeScript application using TanStack Start.
- [x] File-based routing and shared application shell.
- [x] Responsive navigation with desktop sidebar and mobile navigation sheet.
- [x] Light/dark theme toggle.
- [x] Search UI for sample projects and people.
- [x] Shared UI components, dialogs, notifications, and charts.

### Roles and sign-in prototype
- [x] Four role categories: Outgoing Member, Incoming Member, Project Manager, Organisation Admin.
- [x] Demo team directory and role-to-user mapping.
- [x] Email/username lookup against sample people.
- [x] Demo password check (minimum length only); this is **not secure authentication**.
- [x] Demo Google sign-in flow; this is **not a real Google OAuth integration**.
- [x] Browser localStorage session persistence and sign-out.

### Workspace and handover prototype
- [x] Dashboard welcome message reflects the currently selected demo user.
- [x] Handover approval history and approval activity record the active demo user.
- [x] Dashboard with project counts, sample progress, handover status, readiness indicators, and sample alerts.
- [x] Project list with progress and risk labels.
- [x] Team directory with role and status information.
- [x] Knowledge-source cards for GitHub, Jira, Confluence, Slack, Figma, and Google Drive.
- [x] Frontend demo controls to connect/disconnect sample sources, simulate a refresh, show last demo refresh time, and record source actions in local activity history (no external service calls).
- [x] AI-analysis screen with project filtering, sample knowledge-gap findings, expandable explanations and suggested actions, status counts, and Open / In Progress / Resolved tracking (localStorage-backed demo; no live AI).
- [x] Handover list and create-handover interaction.
- [x] Handover approval interaction and approval history in local app state.
- [x] Knowledge-verification view and readiness report with per-member answer completion, manager-reviewed answers, flagged knowledge gaps, and outstanding handover actions (calculated demo metrics; not AI-graded readiness).
- [x] Incoming-member verification progress by approved handover, saved-answer history, and completion states (frontend prototype; no AI grading).
- [x] Verification answer submission state in the app store.
- [x] Manager review of submitted answers, manual knowledge-gap flags, and feedback visible to incoming members (frontend prototype; no AI grading).
- [x] Knowledge Verification Workspace with persisted assessments, multiple-choice scoring, descriptive-answer manager review, clarification states, and readiness integration (frontend prototype; no backend or AI grading).
- [x] Knowledge Risk Radar with deterministic documentation, ownership, handover, verification, and readiness risks; explainable priority scores; filters; detail evidence; and persisted mitigation workflow (frontend prototype).
- [x] Project Continuity Timeline with recorded handover, verification, risk, and project event history, project summaries, search/date/category filters, role-aware visibility, and browser-local persistence (frontend prototype).
- [x] Activity feed and settings preference UI.
- [x] Persist browser-local settings preferences with validated defaults, controlled switches, and read/write error feedback (frontend demo; no real notification delivery).
- [x] Browser localStorage persistence for dashboard data, handovers, approvals, answers, AI finding statuses, knowledge-source demo state, and activity.

## 3. Pending — highest priority

### P0 — Production foundation
- [x] Add Supabase project URL and publishable-key environment configuration (configuration only; no live client connection yet).
- [ ] Integrate the Supabase client and verify a live, non-privileged connection.
- [ ] Select and integrate a production authentication provider (deferred; keep demo access for hackathon judging).
- [ ] Implement secure sessions, password handling, account recovery, and real Google OAuth if required.
- [~] Database foundation design documented in [DATABASE-DESIGN.md](./DATABASE-DESIGN.md); actual provider selection, provisioning, schema/migrations, and connection remain pending.
- [ ] Replace localStorage as the source of truth with server-side persistence.
- [ ] Enforce role-based access control on the server/API, not only in the UI.
- [ ] Add organisation and project data isolation.
- [ ] Add audit logs for important actions and permission changes.

### P1 — Real knowledge-source integrations
- [ ] Implement GitHub OAuth/app connection and repository selection.
- [ ] Fetch and process repository metadata, commits, pull requests, issues, README files, and selected documentation.
- [ ] Add Jira integration and issue/project ingestion.
- [ ] Add Confluence integration and page ingestion.
- [ ] Add Slack integration with explicit workspace and channel permissions.
- [ ] Add Figma integration for approved design files and decisions.
- [ ] Add Google Drive integration for approved documents.
- [ ] Show real sync status, last sync time, failures, and retry controls.
- [ ] Respect source permissions and provide disconnect/revoke controls.

### P1 — AI knowledge pipeline
- [ ] Build ingestion, parsing, chunking, indexing, and deduplication.
- [ ] Extract claims, decisions, architecture details, workflows, ownership, and dependencies.
- [ ] Store source references and citations for every extracted claim.
- [ ] Detect missing documentation, conflicting claims, stale knowledge, and single-person dependencies.
- [ ] Add evidence-grounded question answering with citations.
- [ ] Keep AI calls server-side through the selected AI provider; never expose secret keys in browser code.
- [ ] Add evaluation tests for extraction quality, answer correctness, citations, and uncertainty handling.

### P2 — Handover and verification completion
- [ ] Generate a structured handover draft from approved project sources.
- [x] Let outgoing members edit knowledge questions and answers after a manager requests changes, then resubmit for approval (frontend prototype).
- [x] Add manager review comments, requested changes, approval/rejection, and local review history (frontend prototype; not a server audit log).
- [x] Generate deterministic demo questions from approved handover knowledge (source-backed question generation remains pending).
- [ ] Support recall, reasoning, scenario, and uncertainty question types.
- [ ] Evaluate free-text answers against source-backed evidence.
- [ ] Provide explanations, citations, follow-up questions, and weak-area feedback.
- [x] Update frontend readiness progress and status from assessment answers and review outcomes (production evidence-backed readiness remains pending).
- [ ] Give managers a readiness report showing gaps, evidence, and recommended next actions.
- [x] Add a manager-facing review queue for submitted verification answers, with reviewed/knowledge-gap states and feedback returned to the incoming member (frontend prototype).

### P3 — Operational readiness
- [ ] Add loading, empty, error, and retry states for all live workflows.
- [ ] Add automated tests for role permissions, handover lifecycle, source ingestion, AI evaluation, and verification.
- [ ] Add observability, structured logs, and safe error reporting.
- [ ] Add deployment configuration, environment documentation, and backup/recovery plan.
- [ ] Review privacy, data retention, consent, and security before using real company data.

## 4. Current limitations — do not mistake these for completed features

| Area | Current reality |
| --- | --- |
| Authentication | Demo user lookup and password-length check; not secure production auth. |
| Google sign-in | Simulated flow; no verified OAuth connection. |
| Database | Supabase URL/key configuration is prepared, but no client requests, schema, or database persistence are connected. |
| Persistence | Browser localStorage; data is local to that browser/device. |
| Knowledge sources | Sample source records with localStorage-backed demo connect/disconnect and simulated refresh controls; no live connectors or external account access verified. |
| AI analysis | Sample findings in UI; no live ingestion or AI analysis verified. |
| Handover | Local prototype state; not yet a server-backed, auditable workflow. |
| Verification | Deterministic local assessment questions, automatic multiple-choice scoring, and manual descriptive review; no AI/evidence-based grading or server persistence. |
| Readiness | Frontend assessment progress and review status are calculated locally; no production verification engine or evidence-backed scoring. |
| Continuity timeline | Records actions from local demo workflows only; no server audit log, external event ingestion, or historical events are invented. |
| Permissions | Role metadata exists in the client; server-side enforcement is pending. |

## 5. Next build sequence

### Frontend-only priorities (hackathon demo)
1. [x] Audit and fix role-specific frontend identity and interaction inconsistencies.
2. [x] Complete the demo handover lifecycle and manager review experience.
3. [x] Complete incoming-member verification screens and feedback states (per-handover progress, saved-answer states, and manager feedback; AI grading remains pending).
4. [x] Add interactive knowledge-source demo management (local connect/disconnect, simulated refresh, and activity history; no live integrations).
5. [x] Improve AI-analysis interactions (project filtering, sample finding details, and local status tracking; no live AI processing).
6. [x] Improve readiness-report interactions using submitted answers, manager reviews, knowledge-gap flags, and handover lifecycle states (local demo calculations; not production readiness).
7. [~] Add defensive mobile layout and empty-data handling to the main dashboard and section views; visual viewport testing, full navigation walkthrough, and live loading/error-path checks remain pending.

Backend integrations and production authentication remain deferred while the hackathon demo is being prepared.


Follow this order unless a technical dependency requires a change:

1. **Production foundation:** database, authentication, organisation model, server-side permissions.
2. **One complete source integration:** start with GitHub; prove connect → fetch → store → cite → refresh.
3. **Knowledge pipeline:** extraction, source references, indexing, and gap detection.
4. **End-to-end handover:** draft → outgoing review → manager approval.
5. **Incoming verification:** source-backed questions → answer evaluation → feedback.
6. **Readiness reporting:** calculate readiness from verified evidence and expose manager actions.
7. **Expand integrations:** Jira, Confluence, Slack, Figma, and Drive.
8. **Hardening:** security, tests, monitoring, deployment, and documentation.

## 6. AI coding tool handoff protocol — READ THIS BEFORE AND AFTER EVERY SESSION

### Before starting work
1. Read this file completely.
2. Read [PROJECT OVERVIEW](./OVERVIEW.md).
3. Inspect the relevant source files and the latest Git history.
4. Check whether another session has already changed the same files.
5. Pick one small, clearly scoped task from the pending list.

### While implementing
1. Work in small, reviewable changes.
2. Do not mark a task complete just because a page or button exists.
3. For integrations, verify a real end-to-end request and its failure path.
4. Add or update tests where practical.
5. Preserve existing working UI and follow `AGENTS.md`, especially its guidance on secrets, generated files, and server-only operations.

### Before ending, switching tools, or running out of credits
1. Update the status checkbox for every task changed in this session.
2. Add a dated entry to the session log below.
3. Record exact files changed and important implementation decisions.
4. Record commands/tests run and whether they passed. Never claim tests passed if they were not run.
5. Write the **very next action** so another AI tool can continue without guessing.
6. Commit/push the code and this tracker together when appropriate.

### Required session update format

Copy this template into the session log after each build session:

```md
### YYYY-MM-DD — Short task name
- **Completed:** What is now implemented and verified.
- **Still pending:** What remains unfinished.
- **Files changed:** Exact repository paths.
- **Checks:** Commands run and results (or "not run").
- **Decisions / blockers:** Important context, errors, credentials needed (never paste secrets).
- **Next action:** The single most useful next task.
```

## 7. Session log

### 2026-11-10 — Knowledge Verification Workspace
- **Completed:** Repaired the existing assessment implementation instead of replacing it. Assessments now retain handover/project/member associations, typed question points and topics, response marks/review metadata, safe per-record localStorage validation, editable pre-submission answers, duplicate-submission protection, marks-based scoring, clarification-driven improvement status, manager review updates, and readiness progress derived from assessment answers.
- **Still pending:** Questions are deterministic demo questions, descriptive grading is manual, persistence is browser-local, and no production backend, AI grading, citations, or external integrations are implemented.
- **Files changed:** `src/lib/assessment-store.tsx`, `src/components/qc/AssessmentWorkspace.tsx`, `src/components/qc/Sections.tsx`, `src/test/assessment-store.test.ts`, `src/test/settings-preferences.component.test.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Full Vitest suite passed with one worker (23/23); targeted assessment tests passed (3/3); production build passed with `NODE_OPTIONS=--max-old-space-size=4096`; `git diff --check` passed. The default parallel test/build commands exceeded this environment's Node memory limit. TypeScript emitted no diagnostics for changed assessment files; unrelated baseline diagnostics remain elsewhere in the repository.
- **Decisions / blockers:** Preserved the existing provider architecture, handover approval/revision workflows, UI styling, and generated route file. The Settings component test was updated to include the already-required `AssessmentProvider`.
- **Next action:** Manually walk through an approved handover as Alex, submit both question types, then review the descriptive response as Christy and confirm the Readiness status and localStorage restoration.

### 2026-11-11 — Knowledge Risk Radar
- **Completed:** Added a Project Manager and Organisation Admin radar section. Risks are deterministically detected from incomplete handovers, overdue pending handovers, unresolved assessments, legacy knowledge-gap reviews, ownerless sample findings, and incomplete approved-handover readiness. The register supports severity/project/category/status filters, title and explanation search, evidence and mitigation detail, owner assignment, notes, status changes, reopening, resolution history, stable deduplication, and browser-local persistence.
- **Still pending:** This remains a frontend demo. It does not query live connectors, run AI analysis, create server audit records, or provide production alerts/work queues.
- **Files changed:** `src/lib/risk-store.tsx`, `src/components/qc/KnowledgeRiskRadar.tsx`, `src/components/qc/AppShell.tsx`, `src/components/qc/Sections.tsx`, `src/lib/data.ts`, `src/routes/__root.tsx`, `src/routes/$section.tsx`, `src/lib/quick-connect-store.tsx`, `src/test/risk-store.test.ts`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Detection/scoring rules:** Documentation risks use handovers with fewer than two knowledge items; overdue risks use scheduled dates before the current date while not approved; verification risks use awaiting-review or needs-improvement assessments and explicitly flagged legacy gaps; ownership risks use existing sample findings mentioning missing owners; readiness risks use approved handovers without Verified assessments. Priority is `severity base + impact + urgency + knowledge availability`, capped at 100.
- **Checks:** Targeted risk tests passed (7/7); full Vitest suite passed with one worker (30/30); production build passed with `NODE_OPTIONS=--max-old-space-size=4096`; targeted ESLint was blocked by repository CRLF/Prettier formatting errors in legacy and newly touched files; full TypeScript output still contains pre-existing diagnostics outside the radar files; `git diff --check` passed.
- **Next action:** Sign in as Christy or a Project Manager, open **Knowledge Risk Radar**, assign an owner, save mitigation notes, move a risk to Resolved, refresh the page, then reopen it to verify the persisted history.

### 2026-11-11 — Project Continuity Timeline
- **Completed:** Added the role-aware **Continuity Timeline** sidebar section for incoming members, project managers, and organisation admins. The timeline records actual handover creation, approval/rejection/change requests/resubmissions, assessment starts/submissions, manager acceptance or clarification requests, risk detection, ownership changes, mitigation, resolution, acceptance, and reopening. It provides project selection, newest-first ordering, actor/date display, search, category/date filters, expandable related-record details, and project continuity summaries.
- **Still pending:** This is browser-local frontend history. It does not import historical activity, create production audit logs, ingest external source events, or fabricate events for actions that happened before timeline recording was added.
- **Files changed:** `src/lib/timeline-store.tsx`, `src/components/qc/ContinuityTimeline.tsx`, `src/routes/__root.tsx`, `src/lib/data.ts`, `src/components/qc/AppShell.tsx`, `src/components/qc/Sections.tsx`, `src/routes/$section.tsx`, `src/lib/quick-connect-store.tsx`, `src/lib/assessment-store.tsx`, `src/lib/risk-store.tsx`, `src/test/timeline-store.test.ts`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Persistence:** Events use `quickconnect.timeline.v1`; malformed JSON and invalid records are ignored safely, event IDs are stable/deduplicated, and provider-independent store tests remain supported.
- **Checks:** Timeline/risk tests passed (9/9); full Vitest suite passed with one worker (32/32); production build passed with `NODE_OPTIONS=--max-old-space-size=4096`; `git diff --check` passed. Targeted ESLint reports repository CRLF/Prettier formatting issues in touched files.
- **Next action:** Sign in as Christy, open **Continuity Timeline**, create and approve a handover, then submit/review an assessment and update a risk to confirm each action appears once with the correct actor and project.

### 2026-11-10 — Handover activity actor attribution
- **Completed:** Updated handover creation to accept an explicit activity actor and passed the authenticated demo user's ID from the handover wizard. Handover creation still preserves its generated knowledge, `Pending approval` status, and project activity text; approval, revision, and resubmission workflows remain unchanged.
- **Still pending:** Activity attribution remains frontend-local demo state until server-backed audit events are implemented.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/components/qc/dialogs.tsx`, `src/test/quick-connect-store.test.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** `npm run test` passed (20/20); new regression test passed targeted ESLint; implementation-file ESLint is blocked by pre-existing CRLF/Prettier errors in the legacy files; `npm run build` passed; `git diff --check` passed.
- **Decisions / blockers:** Kept the selected outgoing member separate from the logged-in actor. No generated routes, Settings behavior, authentication, backend, or external integrations were changed.
- **Next action:** Manually walk through Alex and Christy handover creation in the development browser and confirm the Activity feed actor names.

### 2026-11-10 — Settings component interaction tests
- **Completed:** Added React Testing Library and Vitest coverage for the Settings interface as the Organisation Admin demo role. Tests verify default switch states, independent toggling, successful save feedback, localStorage write-failure feedback, and restoration after remount. The test uses an in-memory browser storage shim because the current Node/jsdom runtime does not expose localStorage.
- **Still pending:** Browser-level visual testing and production/server-backed preferences remain pending.
- **Files changed:** `src/test/settings-preferences.component.test.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** `npm run test` passed (16/16); targeted ESLint passed for `src/test/settings-preferences.test.ts` and `src/test/settings-preferences.component.test.tsx`; `npm run build` passed; `git diff --check` passed.
- **Decisions / blockers:** No production preference implementation was changed. The test mocks only the `sonner` notification dependency and uses the existing application providers.
- **Next action:** Manually verify the Settings interaction and persistence in a development browser.

### 2026-11-10 — Persistent settings preferences
- **Completed:** Replaced uncontrolled settings switches with validated, browser-local preferences for handover due reminders, knowledge risk alerts, and the weekly readiness digest. Preferences load safely on the client, merge partial saved objects with defaults, persist each toggle independently, and report storage failures without crashing. The settings UI now identifies these as demo-only browser preferences and does not imply real notification delivery.
- **Still pending:** Real notification delivery, server-backed preference persistence, and authenticated organisation-level settings remain pending.
- **Files changed:** `src/lib/preferences.ts`, `src/components/qc/Sections.tsx`, `src/test/settings-preferences.test.ts`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** `npm run test` passed (11/11); targeted ESLint passes for the new preference helper and tests but reports existing CRLF/Prettier errors in `src/components/qc/Sections.tsx`; `npm run build` passed; `git diff --check` passed.
- **Decisions / blockers:** Kept storage access client-only and did not modify authentication, backend integrations, database files, or generated routes. Existing unrelated worktree changes were preserved.
- **Next action:** Manually verify toggle persistence across a browser refresh in the development browser.

### 2026-11-08 — Frontend interaction polish, button tactile feedback & responsive bug fixing
- **Completed:**
  - Enhanced `Button` component with tactile active feedback (`active:scale-[0.98] transition-all duration-150`), accessible 2px focus rings (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`), and built-in `loading` prop with animated spinner (`Loader2`).
  - Added simulated sync loading state to Knowledge Sources with realistic 600ms feedback, disabled state during sync, and completion toast.
  - Resolved mobile login viewport clipping (`h-screen overflow-hidden`) so small screens (360px-430px or mobile virtual keyboards) can smoothly scroll vertically to reach all inputs, submit button, SSO buttons, and footer links.
  - Fixed mobile header layout in `AppShell` so SearchBox and the notification Bell icon fit neatly on a single line on mobile instead of forcing the Bell down onto a secondary row.
  - Fixed horizontal overflow in Knowledge Verification sample readiness indicators by wrapping cards gracefully (`flex-wrap items-center justify-between`) on 360px viewports.
  - Hardened modal dialogs (`Profile`, `ProjectDetail`) with safe project lookups to prevent runtime `TypeError` crashes on missing data.
  - Added keyboard submission (`Ctrl+Enter` / `Cmd+Enter`), submitting feedback, and accessibility `aria-label` to the verification answer form in `Verify` dialog.
  - Added tactile active states and focus rings to avatars, cards, and handover wizard step buttons.
  - Updated lingering "QuickConnect" branding strings in `$section.tsx` and `index.tsx` page titles and metadata to "QuickConnect".
- **Still pending:** Live AI pipeline, live source connector OAuth, production Supabase persistence, server authorization.
- **Files changed:** `src/components/ui/button.tsx`, `src/components/qc/Sections.tsx`, `src/components/qc/dialogs.tsx`, `src/components/qc/AppShell.tsx`, `src/components/qc/primitives.tsx`, `src/routes/login.tsx`, `src/routes/$section.tsx`, `src/routes/index.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** `npm run build` (passed, zero errors), `npm test` (passed, 1/1 test passed), `npx eslint` on modified files (passed, 0 errors).
- **Decisions / blockers:** Preserved existing UI layout, demo identity, role routing, and localStorage architecture. All changes are frontend-only.
- **Next action:** Conduct interactive end-to-end user testing of all role flows and handover creation/review lifecycle.

### 2026-11-08 — Rename product to QuickConnect and responsive source audit
- **Completed:** Updated visible product branding and documentation from the previous project name to QuickConnect. Updated the app sidebar, sign-out message, login copy, demo email addresses, sample website project name, README, project overview, database design, and this tracker. Kept repository paths, internal QuickConnect code identifiers, and the existing localStorage key unchanged to avoid breaking imports or existing browser demo data. During the responsive source audit, changed the AI Analysis status summary from three columns at every width to one column on narrow screens and three columns from the small breakpoint upward.
- **Still pending:** Real visual viewport testing at 360px, 768px, and desktop widths; full navigation and role walkthrough; additional responsive fixes based on screenshots/runtime behaviour. Responsive work remains in progress.
- **Files changed:** `README.md`, `docs/OVERVIEW.md`, `docs/DATABASE-DESIGN.md`, `docs/IMPLEMENTED-VS-PENDING.md`, `src/components/qc/AppShell.tsx`, `src/routes/login.tsx`, `src/routes/__root.tsx`, `src/lib/data.ts`, `src/components/qc/Sections.tsx`.
- **Checks:** Re-fetched changed files from GitHub and inspected the updated branding strings and responsive grid class. Build, lint, automated tests, and browser viewport checks were not run.
- **Decisions / blockers:** QuickConnect remains the GitHub repository name and internal store/hook identifiers remain unchanged; these are implementation/repository identifiers, not displayed product branding. The existing login background asset filename also remains unchanged so the current image reference is not broken.
- **Next action:** Pull the changes locally, verify login and role switching with the updated demo emails, then test the app at 360px, 768px, and desktop widths and report any overflow or layout breakage.


### 2026-11-08 — Responsive layout and empty-state hardening
- **Completed:** Made the app header controls and main content width more resilient on narrow screens; reduced the smallest-screen main padding; added clear empty states for projects, team members, knowledge sources, handovers, and activity; made activity and handover content wrap safely; guarded dashboard average calculations when project or verification collections are empty; added a dashboard empty-project state.
- **Still pending:** A real browser/device viewport pass (small phone, tablet, desktop), keyboard/mobile navigation walkthrough, and exercising storage failure/loading behavior end to end. The app's existing localStorage load/save failure feedback remains the only current storage error handling; no live backend loading/retry states exist.
- **Files changed:** `src/components/qc/AppShell.tsx`, `src/components/qc/Sections.tsx`, `src/components/qc/Dashboard.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Source-level inspection of the responsive classes, empty-state branches, zero-length guards, and existing role navigation. Build, lint, automated tests, and browser viewport checks were not run because no repository runtime/browser was available in this session.
- **Decisions / blockers:** Preserved role-specific navigation and the demo data model. Did not introduce backend work or claim visual testing was completed.
- **Next action:** Run the project locally and test 360px, 768px, and desktop widths; walk through each role's navigation and storage failure paths.


### 2026-11-08 — Interactive readiness report
- **Completed:** Replaced fixed readiness percentages on the Readiness Reports page with calculations from approved handovers, expected questions, submitted answers, manager review records, and knowledge-gap flags. Added workspace summary counts for approved handovers, handovers awaiting approval/changes, answers awaiting review, and flagged knowledge gaps. Added per-incoming-member progress, reviewed/unreviewed answer counts, knowledge-gap counts, outstanding handover actions, and a shortcut to the member's verification view.
- **Still pending:** These are browser-local demo metrics, not AI-graded or evidence-based readiness scores. Answer correctness, source evidence, server-side reporting, and responsive/error-state validation remain pending.
- **Files changed:** `src/components/qc/Sections.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched source files from GitHub and checked the calculated question progress, per-member review/gap counts, outstanding handover states, summary counters, and explicit demo limitations. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept the task frontend-only and reused existing handover, answer, and answer-review state. Did not use the old fixed readiness percentages as if they were calculated results. No backend, AI grading, or authentication changes.
- **Next action:** Validate responsive layouts and empty/error states across the main demo workflows.


### 2026-11-08 — Interactive AI analysis demo
- **Completed:** Replaced the static AI Analysis list with a project filter, sample findings, finding explanations, suggested next actions, priority/source labels, and Open / In Progress / Resolved status controls. Added status counts for the selected project. Finding status is saved with the existing browser localStorage data and changes are attributed in the activity feed. Existing saved data without the new findings field falls back to the sample findings.
- **Still pending:** Live AI inference, source ingestion, source-backed citations, automatic knowledge-gap detection, and a production review pipeline. All displayed findings and source references are illustrative demo content.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/components/qc/Sections.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched source files from GitHub and checked the project filter, finding detail fields, status transitions, activity attribution, localStorage compatibility fallback, and tracker update. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept this task frontend-only. No live AI service, external source, backend, or authentication flow was added.
- **Next action:** Improve readiness-report interactions using the existing demo verification and review data, without presenting sample percentages as calculated production readiness.

### 2026-11-08 — Interactive knowledge-source demo management
- **Completed:** Replaced the static source cards with local demo connection controls for GitHub, Jira, Confluence, Slack, Figma, and Google Drive. Admins can connect or disconnect a sample source and run a clearly labelled simulated refresh. The UI displays connection status and the last demo refresh time. Source state is persisted in browser localStorage, and connect/disconnect/refresh actions are added to the activity feed. Existing saved data without source state is normalized to the sample defaults.
- **Still pending:** OAuth, external account access, real API calls, source permission scopes, ingestion, retry/error handling for real syncs, and source-backed AI analysis.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/components/qc/Sections.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched the changed files from GitHub and checked legacy localStorage fallback, source state initialization, connect/disconnect guards, connected-only simulated refresh, visible demo disclaimer, last-refresh rendering, and activity logging. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept this as a frontend-only hackathon demo. No credentials are requested or stored, and no external service is contacted. The displayed source item counts remain sample data.
- **Next action:** Improve the AI-analysis interaction using the existing sample source and handover data, without claiming live AI processing.

### 2026-11-08 — Manager verification answer review
- **Completed:** Added a manager/admin review queue for incoming-member verification answers. Managers can inspect the handover, respondent, question, submitted answer, and timestamp; mark an answer reviewed with optional feedback; or flag a knowledge gap with required feedback. Review status and reviewer attribution are stored in localStorage. Incoming members see the manager's decision, comment, reviewer, and timestamp alongside their saved answer history.
- **Still pending:** AI/evidence-based grading, source citations, automatic knowledge-gap detection, answer editing/resubmission, and readiness scores calculated from reviewed results. This remains a frontend-only demo workflow, not an auditable server review.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/components/qc/Sections.tsx`, `src/components/qc/dialogs.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched the changed files from GitHub and checked legacy localStorage normalization, answer-review state, manager review actions, required gap feedback, reviewer attribution, and incoming-member feedback rendering. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept the feature frontend-only and manual; the UI explicitly does not claim AI grading. Existing demo authentication, sample data, role navigation, and localStorage persistence remain.
- **Next action:** Improve the knowledge-source management interactions, keeping all integrations simulated until a separate backend task is approved.

### 2026-11-08 — Incoming-member verification progress and feedback
- **Completed:** Incoming members now see an overall verification progress summary and individual progress cards for each approved handover assigned to them. Cards show answered/total counts, completion state, and Start/Continue/Review actions. The verification dialog shows per-handover progress, a saved-answer history with timestamps, a clear current question count, and completion messaging. Answer submissions are checked against an approved handover assigned to that person and duplicate answers are blocked.
- **Still pending:** AI/evidence-based grading, explanations and citations, question types, manager review of answer quality, and readiness scores calculated from actual results. The workflow remains a localStorage-backed demo.
- **Files changed:** `src/components/qc/Sections.tsx`, `src/components/qc/dialogs.tsx`, `src/lib/quick-connect-store.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched the updated files and checked progress calculations, person/handover scoping, saved-answer rendering, submission validation, duplicate prevention, and tracker entries. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Did not imply that answers are AI-graded. The UI explicitly describes responses as saved for manager review; no backend or AI integration was added.
- **Next action:** Add a manager-facing review view for incoming-member answers, with a way to mark knowledge gaps and provide feedback.


### 2026-11-08 — Outgoing handover edit and resubmission
- **Completed:** Outgoing members can edit the knowledge questions and answers on a handover marked Changes requested, then save and resubmit it. Resubmission returns the handover to Pending approval, retains prior review comments/history, and adds an activity entry attributed to the outgoing member. The store only accepts resubmission from the handover owner while the status is Changes requested.
- **Still pending:** Adding/removing knowledge items, a richer chronological review timeline, and automated lifecycle tests. Persistence remains browser localStorage.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/components/qc/Sections.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched source files and checked the owner/status guard, trimmed question/answer validation, status reset, activity attribution, and edit/resubmit UI. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept the workflow frontend-only and preserved demo authentication, sample data, and localStorage. Rejected and approved handovers remain non-editable.
- **Next action:** Complete the incoming-member verification flow with clearer per-handover progress and feedback states.


### 2026-11-08 — Manager handover review workflow
- **Completed:** Expanded handover statuses to include Changes requested and Rejected. Added manager review comments, request-changes and reject actions, retained approval attribution, and recorded review history in local app state. Latest manager feedback is visible on the handover row to the handover owner. Existing saved browser data is normalized with an empty review history when the new field is absent.
- **Still pending:** Outgoing members cannot yet edit and resubmit the handover content after a change request; review history is localStorage-backed and is not a server audit log. Add explicit resubmission and richer review timeline in a later frontend task.
- **Files changed:** `src/lib/data.ts`, `src/lib/quick-connect-store.tsx`, `src/components/qc/Sections.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched source files from GitHub and checked the new status model, review actions, persistence compatibility, and feedback rendering. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept the workflow frontend-only with localStorage persistence. Existing demo authentication and sample data remain. Role checks are UI controls, not server authorization.
- **Next action:** Add an outgoing-member edit and resubmit path for handovers marked Changes requested, then validate the full lifecycle.


### 2026-11-08 — Role-based frontend navigation and actions
- **Completed:** Added role-specific sidebar navigation and section-level access guards. Outgoing members see their own handovers and can create handovers for themselves; incoming members see their own verification workflow; project managers can review handovers and readiness; organisation admins retain the full demo workspace. Dashboard actions and summary links now reflect the active role. Handover creation defaults to the active user and prevents outgoing members from selecting another sender.
- **Still pending:** Role-specific project data filtering beyond the handover and verification views; deeper manager review lifecycle; automated role-permission tests. These are frontend demo controls only, not server-enforced security.
- **Files changed:** `src/components/qc/AppShell.tsx`, `src/components/qc/Sections.tsx`, `src/components/qc/dialogs.tsx`, `src/components/qc/Dashboard.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Re-fetched the four changed source files from GitHub and verified expected role filters, access guards, and action conditions. Build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Preserved demo authentication, role switching, existing layout, sample data, and localStorage. UI role restrictions are for the hackathon demo and do not replace backend authorization.
- **Next action:** Review the handover lifecycle and manager review experience as the next frontend-only task.


### 2026-11-08 — Frontend demo identity consistency
- **Completed:** Dashboard greeting now uses the active demo user. Handover approval records and its activity entry now use the active demo user instead of a fixed sample admin.
- **Still pending:** Broader frontend audit, role-specific workflow review, and responsive/error-state validation.
- **Files changed:** `src/components/qc/Dashboard.tsx`, `src/components/qc/Sections.tsx`, `src/lib/quick-connect-store.tsx`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Source-level review only; build, lint, and automated tests were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** Kept the existing demo authentication, role switching, UI layout, sample data, and localStorage persistence. No backend or Supabase work was performed.
- **Next action:** Continue the frontend audit with the next highest-impact role-specific workflow inconsistency.


### 2026-11-08 — Supabase public environment configuration only
- **Completed:** Added a local environment template for the Supabase project URL and publishable key, added a small configuration reader, and ignored local environment files so credentials are not committed. Documented setup and security boundaries.
- **Still pending:** The Supabase SDK/client is not installed or connected, no API request has been made, and no database schema or persistence is implemented. Authentication is deliberately deferred; the existing demo sign-in and sample workflows remain unchanged for hackathon judging.
- **Files changed:** `.gitignore`, `.env.example`, `src/lib/supabase-config.ts`, `README.md`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** GitHub source edits only. Build, lint, tests, and a live Supabase connectivity check were not run because no repository terminal/runtime was available.
- **Decisions / blockers:** The publishable key supplied in chat was not committed to the repository. Copy `.env.example` to `.env.local` locally and enter the project URL and publishable key there. No authentication, login UI, role behavior, database migration, or demo data flow was changed.
- **Next action:** When needed, add the Supabase client SDK and perform a minimal read-only connectivity check; keep authentication and production role enforcement until the final hackathon-hardening phase.

### 2026-11-08 — Remove platform-specific tooling and telemetry
- **Completed:** Replaced the editor-provided Vite wrapper with the standard Vite + TanStack Start + React + Tailwind + Nitro configuration; removed the editor-only dev dependency and project metadata; removed editor-specific error telemetry; kept the existing app error boundary and server error handling; replaced the generated platform-specific repository instructions with neutral project guidance.
- **Still pending:** Build, lint, tests, and local runtime validation have not been run in this session. The database remains a design only; no provider has been selected or connected.
- **Files changed:** `vite.config.ts`, `package.json`, `package-lock.json`, `src/routes/__root.tsx`, editor telemetry module (deleted), editor project metadata (deleted), `AGENTS.md`, `docs/DATABASE-DESIGN.md`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** GitHub source edits only; no local install/build/lint/test was available. Confirmed the platform-specific package and metadata references were removed from the files edited.
- **Decisions / blockers:** Existing QuickConnect screens, routes, stores, and demo workflows were left unchanged. The Vite config now uses the framework's standard plugins; runtime/build validation is still required before considering the removal fully verified.
- **Next action:** Clone/pull `main`, run `npm ci`, `npm run build`, `npm run lint`, and `npm test`; fix any configuration issues before selecting a database provider.

### 2026-11-08 — Database foundation design prepared
- **Completed:** Inspected `AGENTS.md`, the package manifest, project metadata, and the current auth/data stores. Added `docs/DATABASE-DESIGN.md` with the proposed tenant-aware relational model, relationships, security/RLS requirements, indexes, migration sequence, and acceptance criteria.
- **Still pending:** No database was provisioned or connected. At that time, repository instructions prohibited hand-editing database migrations and required changes through the connected platform workflow. Provider confirmation, schema creation, RLS policies, generated types, and server-side persistence were not completed. The current app remains localStorage/demo-backed.
- **Files changed:** `docs/DATABASE-DESIGN.md`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** GitHub source inspection only; build, lint, and tests not run. Documentation write confirmed by GitHub commit response.
- **Decisions / blockers:** Do not create database migrations or select a provider by assumption. Select a database provider and apply the schema using its supported migration workflow. No application UI or runtime code was changed.
- **Next action:** Select and provision a managed database, implement the schema in `docs/DATABASE-DESIGN.md`, and configure tenant/project RLS. Then verify cross-organisation access denial before wiring the frontend.

### 2026-11-08 — Documentation baseline created
- **Completed:** Inspected the current repository structure, package dependencies, route modules, role/auth store, sample data, dashboard, section views, and local app data store. Created this tracker and the project overview.
- **Still pending:** All production integrations and backend work listed above remain pending unless separately verified in code.
- **Files changed:** `docs/OVERVIEW.md`, `docs/IMPLEMENTED-VS-PENDING.md`, `README.md`.
- **Checks:** Repository source inspection only. Build, lint, and tests were not run.
- **Decisions / blockers:** Existing screens and interactions are classified as prototype-level where they use sample data or localStorage. No live source connector, production database, secure authentication, or live AI pipeline was verified.
- **Next action:** Choose the production backend/auth/database approach, then implement the smallest end-to-end foundation slice.

---

**Rule:** Every AI coding tool that changes this project must update this tracker in the same session. If work is incomplete, mark it as in progress or pending and leave a precise next action.


### 2026-11-09 — Project-wide QuickConnect rename
- **Completed:** Renamed the shared application store file, provider, context, API types, hook, storage-key namespace, auth storage-key namespace, and all source imports from QuickConnect to QuickConnect. Updated project documentation and historical naming references.
- **Files changed:** `src/lib/quick-connect-store.tsx`, `src/lib/auth-store.tsx`, `src/routes/__root.tsx`, `src/components/qc/AppShell.tsx`, `src/components/qc/Sections.tsx`, `src/components/qc/Dashboard.tsx`, `src/components/qc/dialogs.tsx`, `README.md`, `docs/OVERVIEW.md`, `docs/DATABASE-DESIGN.md`, `docs/IMPLEMENTED-VS-PENDING.md`.
- **Checks:** Not run from this GitHub-only editing session.
- **Remaining:** The GitHub repository slug is still `QuickConnect`; rename it in GitHub repository Settings when ready. The README clone URL remains unchanged until then.
- **Next action:** Run install/build/lint/tests locally and check browser demo state after the storage-key namespace change.
