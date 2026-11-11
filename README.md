# QuickConnect

A unified application combining the QuickConnect marketing homepage and workspace dashboard.

- `/` — Public marketing homepage
- `/login` — Workspace sign-in
- `/dashboard` — Workspace dashboard
- `/:section` — Projects, team, handovers, verification, readiness, timeline and other dashboard sections

## Local development

Use Node.js 22.

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The project uses **TanStack Start + Nitro**. It is not a static-only Vite SPA: production hosting must run the Nitro server/functions so direct visits to `/login`, `/dashboard`, and dynamic section routes are handled correctly.

## Deploy to Netlify

The repository includes `netlify.toml` with the Nitro Netlify preset, build command, publish directory, and baseline security/cache headers.

1. Import `ChristyFrancis99/QuickConnect-final` into Netlify and select the `main` branch.
2. Let Netlify read the repository's `netlify.toml`; do not add a catch-all rewrite to `/index.html`.
3. Use Node.js 22 for the build.
4. Deploy a preview first and verify the homepage, login, dashboard, and a nested section by opening each URL directly and refreshing it.
5. Check the Netlify deploy log for successful Nitro function and static asset output.

## Environment variables

`.env.example` documents optional Supabase public configuration values. Copy it to `.env.local` for local work and add deploy-time values in the hosting provider's environment settings. Never commit real credentials or server-side secrets. The current prototype does not yet connect to Supabase.

## Important production limitation

QuickConnect currently deploys as a **frontend demo/prototype**, not a production multi-tenant service. Sign-in and Google sign-in are simulated, and workspace data is stored in browser localStorage. There is no live database, server-enforced role access, real source integrations, or live AI pipeline. Do not use real company, employee, or confidential project data until those production foundations are implemented and security-reviewed.
