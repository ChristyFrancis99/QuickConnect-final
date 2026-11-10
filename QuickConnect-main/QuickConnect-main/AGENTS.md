# Repository guidance

- Preserve the existing QuickConnect product UI and working prototype workflows unless the task explicitly requests a change.
- Read `docs/OVERVIEW.md` and `docs/IMPLEMENTED-VS-PENDING.md` before substantial implementation work.
- Update `docs/IMPLEMENTED-VS-PENDING.md` after each meaningful implementation session. Record files changed, checks run, blockers, and the next action.
- Never commit credentials, API keys, tokens, or other secrets.
- Do not hand-edit generated files; follow the generator or framework workflow that owns them.
- Keep server-only secrets and privileged operations out of browser code.
- Run the relevant build, lint, and test checks when the environment permits, and report accurately when checks were not run.
