# Testimonial Gathering Tool — Design Spec

## Goal

Allow a host to open a testimonial collection campaign (room), share a submission link with students, moderate submissions in a live queue, and display approved testimonials on a public wall — all in real-time via PartyKit.

## Architecture

PartyKit-based, following the same pattern as polls, feedback, and feelings. One PartyKit room per campaign. Persistence via internal HTTP API route (`/api/internal/testimonials`) using the existing `x-internal-secret` pattern. No email required.

**PartyKit party:** `"testimonials"` registered in `partykit.json` → `party/testimonials.ts`

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/testimonials` | Host | Dashboard — list all campaigns, create new room, copy links |
| `/testimonials/host?room=xxx` | Host | Live moderation queue — see submissions arrive, approve/reject |
| `/testimonials/submit?room=xxx` | Public | Student submission form |
| `/testimonials/wall?room=xxx` | Public | Live approved testimonials wall |

All `/testimonials/*` routes bypass `StackedLayout` (same pattern as `/party/*` routes — update bypass condition in `__root.tsx`).

---

## Database Schema (Drizzle + Neon PostgreSQL)

### `testimonial_sessions`
```ts
id        serial PRIMARY KEY
roomId    text NOT NULL UNIQUE
title     text NOT NULL           -- e.g. "React Workshop — May 2026"
createdBy text NOT NULL           -- host connection ID
isActive  boolean NOT NULL DEFAULT true
createdAt timestamp DEFAULT now()
```

### `testimonials`
```ts
id          serial PRIMARY KEY
sessionId   integer REFERENCES testimonial_sessions(id)
roomId      text NOT NULL          -- denormalized for fast lookup
studentName text NOT NULL
content     text NOT NULL
status      text NOT NULL DEFAULT 'pending'  -- 'pending' | 'approved' | 'rejected'
submittedAt timestamp DEFAULT now()
moderatedAt timestamp              -- null until host approves/rejects
```

---

## PartyKit Server (`party/testimonials.ts`)

### State (in-memory + room.storage)
```ts
session: TestimonialSession | null
testimonials: Map<string, Testimonial>   // id → testimonial
hostId: string | null
dbSessionId: number | null
```

### Message Protocol

**Client → Server:**
```ts
{ type: 'create_session', title: string }
{ type: 'submit_testimonial', studentName: string, content: string }
{ type: 'moderate_testimonial', id: string, action: 'approve' | 'reject' }
{ type: 'close_session' }
{ type: 'get_state' }
```

**Server → Client:**
```ts
{ type: 'session_created', session: TestimonialSession }
{ type: 'session_state', session: TestimonialSession, testimonials: Testimonial[] }
{ type: 'testimonial_submitted', testimonial: Testimonial }
{ type: 'testimonial_moderated', testimonial: Testimonial }
{ type: 'session_closed', session: TestimonialSession }
{ type: 'connection_count', count: number }
{ type: 'error', message: string }
```

### Bootstrap pattern
- `onStart()`: restore session + testimonials map + hostId + dbSessionId from storage
- `create_session`: **await** `create_session` DB call before broadcasting (same bootstrap fix as other servers)
- `submit_testimonial`: fire-and-forget `submit_testimonial` DB call
- `moderate_testimonial`: fire-and-forget `moderate_testimonial` DB call; only host can moderate
- `close_session`: only host can close; fire-and-forget `close_session` DB call

---

## Internal API (`POST /api/internal/testimonials`)

Same `x-internal-secret` auth pattern. Operations:

| `body.type` | Action |
|---|---|
| `create_session` | Insert `testimonial_sessions`, return `{ id }` |
| `submit_testimonial` | Insert `testimonials` with `status = 'pending'`, return `{ id }` |
| `moderate_testimonial` | Update `testimonials.status` + `moderatedAt`, return `{ ok }` |
| `close_session` | Set `testimonial_sessions.isActive = false`, return `{ ok }` |

---

## UI Design

### Broadsheet design system — purple accent (`#6D28D9`)

**Host dashboard (`/testimonials`)**
- Purple `h-1` accent stripe
- "TOOLS." back-link top nav
- Playfair Display heading: `"Testimonials."`
- "New Campaign" button with press-shadow — opens form: campaign title → creates room → shows host URL + participant URLs to copy
- List of past campaigns: title, date, count (X approved / Y total), links to host view + wall

**Submission form (`/testimonials/submit?room=xxx`)**
- Purple accent stripe, minimal top bar with "TOOLS." + room code
- Broadsheet card with hard shadow
- States:
  - **Waiting**: spinner + "Session not started yet"
  - **Active**: Name input + Testimonial textarea (min 20 chars) + Submit button
  - **Submitted**: Thank-you card — `"Thank you, [name]!"` with checkmark
  - **Closed**: `"This session is no longer accepting testimonials"`
- Validation: both fields required, content min 20 characters

**Moderation queue (`/testimonials/host?room=xxx`)**
- Three-column stat strip: `[N] Pending · [N] Approved · [N] Rejected`
- Live pending section at top — testimonials appear with slide-in animation as submitted
- Each pending card: student name (Playfair Display bold) + content text + **"✓ Approve"** (green press-shadow) + **"✗ Reject"** (red press-shadow) buttons
- Approved/Rejected sections below, collapsed by default with count badge
- "Close Session" button at top-right — stops new submissions

**Public wall (`/testimonials/wall?room=xxx`)**
- Warm `#F7F3EC` background, `"[Campaign Title]"` heading
- Masonry-style 2–3 column grid of approved cards
- Each card: large `"` quotation mark in Playfair Display, testimonial text in Playfair Display italic, `— Student Name` in JetBrains Mono below
- New approvals animate in (slide up) without page refresh
- Empty state: `"Be the first to share your experience"`
- Connection count indicator

---

## Data Flow

```
Student submits form
  → PartyKit: submit_testimonial (broadcast to all — host sees it in queue)
  → DB: INSERT testimonials (status = 'pending')

Host clicks Approve
  → PartyKit: moderate_testimonial { id, action: 'approve' }
  → PartyKit: broadcast testimonial_moderated to all connections
  → Wall clients: card animates in
  → DB: UPDATE testimonials SET status = 'approved', moderatedAt = now()
```

---

## Error Handling

- Duplicate submissions: `submit_testimonial` only accepted if student hasn't submitted (tracked by connection ID in memory — one submission per WebSocket connection)
- Non-host moderation attempt: `error` message sent back, no state change
- DB failure on submit: testimonial still shown in UI (in-memory), DB sync failure logged
- Session not found: 404 page with "Campaign not found" message on wall + submit routes

---

## Out of Scope

- Photo / avatar upload
- Star ratings
- Export to CSV
- Embedding wall as iframe on external sites
- Email notifications to host on new submission
- Editing submitted testimonials
