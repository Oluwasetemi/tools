# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev           # Start all dev servers via mprocs (Vite on :3000 + PartyKit on :1999)
bun run dev:vite      # Vite only (no PartyKit)
bun run build         # Production build — run this to verify changes compile
bun run test          # Vitest unit tests
bun run party:dev     # PartyKit worker only
bun run party:deploy  # Deploy PartyKit workers to partykit.dev

# Database
bun run db:push       # Push schema changes to the DB (dev/prototyping)
bun run db:generate   # Generate migration files from schema changes
bun run db:migrate    # Run pending migrations
bun run db:studio     # Open Drizzle Studio (visual DB browser)
```

After any code change, run `bun run build` to verify TypeScript compiles. There is no separate typecheck script.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `VITE_DATABASE_URL` — Neon PostgreSQL connection string
- `VITE_PARTYKIT_HOST` — PartyKit host (`localhost:1999` dev, `tools.oluwasetemi.partykit.dev` prod)
- `INTERNAL_API_SECRET` — Shared secret for PartyKit → app internal API calls
- `APP_URL` — App base URL used by PartyKit (`http://localhost:3000` dev)
- `RESEND_API_KEY` — For sending certificate emails

PartyKit production env vars are set via `npx partykit env add KEY` (not in `partykit.json` — the `vars` block there is dev-only).

## Architecture

### Tech Stack

- **TanStack Start** (SSR React framework) + **TanStack Router** (file-based routing)
- **PartyKit** (WebSocket/real-time workers) — separate process, separate deployment
- **Drizzle ORM** + **Neon PostgreSQL** (serverless Postgres)
- **Tailwind CSS v4** with a brutalist design system
- **Resend** for certificate emails

### Route File Conventions

Routes live in `src/routes/` using dot-notation filenames:
- Dots are **both path separators and layout parent indicators** — `certificates.send.tsx` is the child route `/certificates/send` AND inherits the layout from `certificates.tsx`
- When a parent route file contains a loader or DB query, it runs on every child route visit — keep parent route files as transparent layout wrappers (`<Outlet />`) if they have children

### Server-Only Code in Loaders

TanStack Start route `loader` functions run **in the browser** during client-side SPA navigation. Any code that imports `db` (Drizzle + node-postgres) will crash in the browser.

**Rule:** Every `loader` that touches the database must call a `createServerFn`:

```ts
const getData = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(someTable)  // safe — runs on server always
})

export const Route = createFileRoute('/some-path')({
  loader: async () => ({ data: await getData() }),
  component: MyPage,
})
```

### PartyKit ↔ App DB Bridge

PartyKit workers (in `party/`) run on Cloudflare and cannot connect to PostgreSQL directly. They write to the database by POSTing to the app's internal API:

```
PartyKit worker → POST /api/internal/{domain} (with x-internal-secret header) → Drizzle → Neon
```

- Internal API routes: `src/routes/api/internal/{polls,kahoot,feedback,feelings,testimonials}.ts`
- Bridge client: `party/lib/db-client.ts` — `callInternalApi(domain, body)`
- Auth: `timingSafeEqual` comparison of `x-internal-secret` header against `INTERNAL_API_SECRET` env var
- PartyKit connects to the host page via `partysocket` (client) using `getPartykitHost()` from `src/lib/partykit-host.ts`

### Design System

All tool pages use a consistent brutalist design — do not deviate:
- Background: `bg-[#F7F3EC]`
- Borders: `border-2 border-[#1A1008]`
- Press-button shadows: `shadow-[3px_3px_0_#1A1008]` with `hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]`
- Typography: `f-display` (Playfair Display) for headings, `f-mono` (JetBrains Mono) for labels/stats
- Each tool has its own accent color (red `#D4380D`, green `#1B6B3A`, purple `#6D28D9`, amber `#B45309`)
- Top nav: 40px height, `border-b border-[#1A1008]/10`, logo left + tool indicator right
- Full-width header section: `border-b-2 border-[#1A1008]`

### Database Schema (`src/db/schema.ts`)

Six tool domains, each with their own tables:
- **Kahoot**: `kahootGames`, `kahootQuestions`, `kahootPlayers`, `kahootAnswers`
- **Polls**: `polls`, `pollOptions`, `pollVotes`
- **Feedback**: `feedbackSessions`, `feedbackResponses`
- **Feelings**: `feelingSessions`, `feelingEmojis`
- **Testimonials**: `testimonialSessions`, `testimonials`
- **Certificates**: `certificateIssuers`, `certificateBatches`, `certificates`

`db` in `src/db/index.ts` is a lazy proxy — safe to import anywhere but only resolves on first call (which must be server-side).

### Concurrent DB Queries

History pages use `p(items, { concurrency: 5 }).map(async item => ...)` from `@setemiojo/utils` for concurrent per-item DB lookups. Never use sequential `for...await` loops for N+1 patterns.

### Security Rules

- Certificate send/settings mutations use `createServerFn` — there are no public unauthenticated API routes for these
- Internal API routes validate `x-internal-secret` using `timingSafeEqual` (not `!==`)
- `logoUrl` fields must be validated as `https://` before use in emails or HTML

## Agent Skills

### Issue tracker

Issues live in GitHub Issues for this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root when created. See `docs/agents/domain.md`.
