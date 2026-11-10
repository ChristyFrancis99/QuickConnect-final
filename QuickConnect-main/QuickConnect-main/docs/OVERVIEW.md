# QuickConnect — Project Overview

> **Purpose:** A clear handover workspace that helps teams preserve project knowledge when someone leaves, changes roles, or moves to another project.

## 1. Project problem

Important project knowledge often lives in people's heads, private notes, chat threads, code reviews, design files, and scattered documents. When a developer or employee leaves, the next person may not know why decisions were made, how important systems work, where the risks are, or whom to ask. This creates repeated work, delays, avoidable mistakes, and single-person dependencies.

## 2. Our solution

**QuickConnect** brings project knowledge and the handover process into one workspace. It is designed to help teams:

- Collect project context and knowledge from relevant sources.
- Organise that context into structured handover information.
- Identify undocumented decisions, knowledge gaps, and single-person dependencies.
- Let an outgoing member prepare a handover for an incoming member.
- Let managers review handovers and monitor readiness.
- Help incoming members verify their understanding through questions and evidence-backed checks.

The long-term goal is a traceable process: **Capture → Analyse → Handover → Verify → Measure readiness.**

## 3. Users and responsibilities

| Role | Responsibility |
| --- | --- |
| Outgoing Member | Documents project context, explains important workflows, and prepares the handover. |
| Incoming Member | Reviews transferred knowledge, asks questions, and completes verification. |
| Project Manager | Reviews and approves handovers, monitors knowledge gaps, and checks readiness. |
| Organisation Admin | Manages people, permissions, knowledge sources, and organisation settings. |

## 4. Architecture

### Current repository architecture

This repository currently contains a **React application and interactive prototype**, not a deployed production backend.

```text
User
  |
  v
TanStack Start application
  |
  +-- File-based routes (src/routes)
  |
  +-- Shared UI (src/components)
  |     +-- App shell and navigation
  |     +-- Dashboard and section views
  |     +-- Dialogs and reusable UI
  |
  +-- Application state (src/lib)
        +-- auth-store.tsx
        |     +-- Demo user / role selection
        |     +-- Browser localStorage session
        |
        +-- quick-connect-store.tsx
        |     +-- Projects, handovers, approvals, answers
        |     +-- Browser localStorage persistence
        |
        +-- data.ts
              +-- Sample people, projects, handovers,
                  sources, verification and activity data
```

### Intended end-to-end product architecture

The following is the target direction, **not a claim that these integrations are already implemented**.

```text
GitHub / Jira / Confluence / Slack / Figma / Drive
                         |
                         v
              Secure source connectors
                         |
                         v
               Ingestion and indexing
                         |
                         v
            AI extraction and analysis
             |                    |
             v                    v
       Knowledge base       Gap / risk detection
             |                    |
             +---------+----------+
                       |
                       v
              Structured handover
                       |
                Manager review
                       |
                       v
          Incoming-member verification
                       |
                       v
             Readiness report / score
```

A production implementation will need secure connector authorisation, server-side ingestion and processing, persistent storage, source-level permissions, AI orchestration, audit history, and production authentication.

## 5. Technology stack

The following is based on the repository's current `package.json`.

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| UI library | React 19 |
| Full-stack application framework | TanStack Start |
| Routing | TanStack Router |
| Build and development | Vite |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner |
| Tests | Vitest, Testing Library |
| Package manager / scripts | npm |

**Important:** A production database, production authentication provider, and live AI provider are not established by the current dependencies and prototype code. Choose and document those when they are actually integrated.

## 6. Current implementation snapshot

The application currently includes a role-oriented login experience, dashboard, project and team views, knowledge-source status cards, AI-analysis sample findings, handover creation/approval interactions, verification UI, readiness indicators, activity history, and settings UI.

The current data and workflows are primarily demo/sample-driven. The app stores selected session and dashboard state in the browser's localStorage. Source cards and AI findings are sample UI data; they do not prove that live external systems have been connected or that real AI analysis is running.

For the authoritative task-by-task status and next steps, see **[Implemented vs Pending](./IMPLEMENTED-VS-PENDING.md)**.

## 7. How to keep this overview accurate

- Update the technology table when a dependency or architecture decision changes.
- Update the architecture diagram when a real service or data flow is added.
- Do not label a feature production-ready just because its screen or demo interaction exists.
- Keep implementation progress in [IMPLEMENTED-VS-PENDING.md](./IMPLEMENTED-VS-PENDING.md).
