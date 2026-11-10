# QuickConnect — Database Foundation Design

> **Status:** Design proposal only. No database, migration, or production persistence is created by this document.

## 1. Implementation approach

Choose and configure a database/authentication provider explicitly before implementation. Keep provider credentials in environment variables or a managed secrets store, never in source control. Create schema changes as versioned migrations using the selected provider's supported tooling. This document is a provider-neutral implementation specification; it is not evidence that a database is connected.

The current repository uses React + TanStack Start. The existing `src/lib/auth-store.tsx` and `src/lib/quick-connect-store.tsx` use demo people and browser `localStorage`. Keep those prototype flows clearly separated until a server-backed implementation is verified.

## 2. Initial relational model

Use UUID primary keys, UTC timestamps, foreign keys, and database-enforced organisation scoping. Table and column names below are proposed logical names; adapt naming to the database provider's conventions.

### Core identity and tenancy

| Table | Important columns | Purpose |
| --- | --- | --- |
| `organisations` | `id`, `name`, `slug`, `created_at`, `updated_at` | Tenant/workspace boundary. |
| `user_profiles` | `id` (same identity-provider user UUID), `display_name`, `email`, `created_at`, `updated_at` | App profile; credentials remain with the auth provider. |
| `organisation_memberships` | `id`, `organisation_id`, `user_id`, `role`, `status`, `created_at` | Membership and one of the four QuickConnect roles. |

Allowed role values: `outgoing_member`, `incoming_member`, `project_manager`, `organisation_admin`. Enforce membership uniqueness per organisation/user. Do not store passwords or provider tokens in these tables.

### Project and source catalogue

| Table | Important columns | Purpose |
| --- | --- | --- |
| `projects` | `id`, `organisation_id`, `name`, `description`, `status`, `created_by`, timestamps | Projects belonging to one organisation. |
| `project_memberships` | `id`, `project_id`, `user_id`, `project_role`, `created_at` | Explicit project membership and access. |
| `knowledge_sources` | `id`, `organisation_id`, `project_id`, `provider`, `external_id`, `display_name`, `status`, `last_synced_at`, `created_by`, timestamps | A connected or imported source. Store provider credentials in the approved secret/connector store, never in plaintext rows. |
| `source_documents` | `id`, `source_id`, `external_document_id`, `title`, `uri`, `content_hash`, `content_text`, `metadata_json`, `fetched_at` | Imported document or repository artefact with provenance. |
| `knowledge_claims` | `id`, `project_id`, `claim_text`, `claim_type`, `confidence`, `status`, `created_at`, `updated_at` | Extracted, reviewable project knowledge. |
| `claim_evidence` | `id`, `claim_id`, `source_document_id`, `excerpt`, `uri`, `location_metadata` | Traceable source evidence for each claim. |

### Handover and verification

| Table | Important columns | Purpose |
| --- | --- | --- |
| `handovers` | `id`, `organisation_id`, `project_id`, `outgoing_user_id`, `incoming_user_id`, `status`, `title`, `created_at`, `submitted_at`, `updated_at` | Handover lifecycle record. |
| `handover_sections` | `id`, `handover_id`, `section_key`, `title`, `content`, `sort_order`, `updated_by`, `updated_at` | Editable structured handover content. |
| `handover_reviews` | `id`, `handover_id`, `reviewer_user_id`, `decision`, `comment`, `created_at` | Append-only manager review decisions/comments. |
| `verification_questions` | `id`, `handover_id`, `question_text`, `question_type`, `options_json`, `expected_evidence_json`, `source_claim_id`, `created_at` | Questions grounded in approved claims. |
| `verification_attempts` | `id`, `handover_id`, `user_id`, `started_at`, `submitted_at`, `status` | One learner attempt. |
| `verification_answers` | `id`, `attempt_id`, `question_id`, `answer_text`, `score`, `feedback`, `evidence_json`, `graded_at` | Submitted answer and evidence-based grading output. |
| `readiness_reports` | `id`, `handover_id`, `user_id`, `score`, `status`, `breakdown_json`, `generated_at` | Snapshot calculated from completed verification results, not hard-coded UI percentages. |
| `audit_logs` | `id`, `organisation_id`, `project_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata_json`, `created_at` | Append-only record of security-sensitive and lifecycle actions. |

## 3. Relationships

- An organisation has many memberships and projects.
- A user can belong to multiple organisations; membership role is scoped to an organisation.
- A project belongs to exactly one organisation and has many project memberships and knowledge sources.
- A source has many imported documents; claims can have multiple evidence records.
- A project can have many handovers; each handover has one outgoing member and one incoming member.
- A handover has sections, review events, verification questions, and attempts.
- An attempt belongs to one learner and has one answer per question.
- Readiness reports are derived snapshots tied to a handover and learner.
- Audit events are scoped to the organisation and, when relevant, the project.

## 4. Security and data integrity requirements

1. Enable row-level security (or the provider's equivalent) on every tenant-owned table before connecting real user data.
2. Derive the active user from the verified server-side auth session. Never trust a client-supplied user ID or role for authorisation.
3. Require an active organisation membership for all organisation-scoped reads and writes.
4. Require project membership and role permissions for project-scoped knowledge, handovers, and verification.
5. Restrict organisation-wide administration to organisation admins; restrict handover approval to authorised project managers.
6. Incoming members may access only handovers and sources assigned/approved for them. Outgoing members may edit only their own draft handovers. Managers may review only projects they manage.
7. Treat review history and audit logs as append-only to ordinary application roles.
8. Validate state transitions on the server (draft → submitted → in_review → changes_requested / approved); do not let a client set arbitrary status values.
9. Use foreign keys, unique constraints, check constraints, and indexes for organisation/project foreign keys and common lookup columns.
10. Do not persist passwords, raw OAuth tokens, AI provider keys, or other secrets in application tables or source control.

## 5. Recommended indexes and constraints

- Unique: `organisation_memberships(organisation_id, user_id)`.
- Unique: `project_memberships(project_id, user_id)`.
- Unique where applicable: `knowledge_sources(project_id, provider, external_id)`.
- Index all `organisation_id`, `project_id`, `handover_id`, `source_id`, `user_id`, and timestamp columns used for filtering.
- Check role, provider, question type, handover status, and review decision against explicit allowed values.
- Add a unique constraint for `verification_answers(attempt_id, question_id)` if each attempt permits only one final answer per question.
- Use cascading deletes only for dependent records whose retention policy permits deletion. Prefer archival/soft deletion for audit-relevant business records.

## 6. Migration and delivery sequence

1. Select a managed database and authentication provider based on deployment, security, and team requirements; document the decision.
2. Provision the database and identity provider in the chosen provider's dashboard/CLI.
3. Create versioned migrations in dependency order: organisations and profiles → memberships → projects → sources/documents → claims/evidence → handovers/reviews → verification → readiness/audit.
4. Add and verify tenant/project row-level policies before connecting the UI.
5. Generate provider types through the selected provider's supported tooling and keep generated files untouched by manual edits.
6. Add server-side data access functions in TanStack Start server functions; keep privileged credentials server-only.
7. Migrate one vertical slice first (organisation + project read/write), then handovers and verification.
8. Add integration tests for cross-organisation denial, role boundaries, and valid lifecycle transitions.
9. Only after successful verification, update the implementation tracker to mark the database and persistence tasks complete.

## 7. Acceptance criteria

- A real managed database is provisioned and its provider is documented.
- Schema migrations are version-controlled and applied to the target environment.
- RLS/tenant isolation is tested with users from two organisations.
- The server obtains identity from a verified session and enforces roles on every protected operation.
- At least one organisation/project record can be created, fetched, and updated across sessions without relying on browser `localStorage`.
- No secrets are committed to Git.
- Build, lint, and relevant integration tests pass in the project environment.

Until these criteria are met, describe the database foundation as **designed / pending integration**, not implemented or production-ready.
