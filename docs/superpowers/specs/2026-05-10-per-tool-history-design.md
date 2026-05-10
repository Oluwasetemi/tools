# Per-Tool History Pages — Design Spec

## Goal

Add a `/history` sub-route to each interactive tool so users can browse past sessions and their results, all server-rendered from the existing PostgreSQL data.

## Architecture

- **Pattern:** TanStack Start file-based routing. Each history page lives at `src/routes/<tool>.history.tsx` and exports a `loader` (server function) that queries Drizzle directly — identical to the existing `certificates.tsx` pattern.
- **Data loading:** All data for a history page (list + full detail) is fetched in a single loader call at page load. No client-side fetching.
- **Expand/collapse:** Each session row is expandable inline via `useState`. No separate detail route.
- **Navigation:** Each tool's host page gains a `History →` link in its top-right action bar. Each history page has a `← Back to [Tool]` link in its nav.
- **Visual design:** Same brutalist design language as all other pages — `#F7F3EC` background, `border-2 border-[#1A1008]`, press-button shadows, `f-mono`/`f-display` fonts — using each tool's existing accent color.

## Routes

| File | Route | Tool accent color |
|---|---|---|
| `src/routes/party.polls.history.tsx` | `/party/polls/history` | `#0C3D6B` (ink blue) |
| `src/routes/party.kahoot-host.history.tsx` | `/party/kahoot-host/history` | `#D4380D` (red-orange) |
| `src/routes/party.feedback-host.history.tsx` | `/party/feedback-host/history` | `#1B6B3A` (green) |
| `src/routes/party.feelings.history.tsx` | `/party/feelings/history` | `#6D28D9` (purple) |
| `src/routes/testimonials.history.tsx` | `/testimonials/history` | `#6D28D9` (purple) |

## Per-Page Data & Display

### Polls (`/party/polls/history`)

**Loader query:** `polls` JOIN `pollOptions` (grouped by pollId for vote counts).

**List row:** question text (truncated), total votes, winning option + percentage, created date, status badge (Active / Ended).

**Expanded detail:** all options rendered as vote-bar rows (same style as the live poll view), room ID, ended-at timestamp if closed.

**Empty state:** "No polls yet. Run your first poll to see history here."

---

### Kahoot (`/party/kahoot-host/history`)

**Loader query:** `kahootGames` JOIN `kahootPlayers` (count + max score to find winner).

**List row:** game name, player count, winner name + score, created date, state badge (Waiting / Ended).

**Expanded detail:** leaderboard of top 10 players (rank, name, score), question count, started-at / ended-at timestamps.

**Empty state:** "No games yet. Host your first quiz to see history here."

---

### Feedback (`/party/feedback-host/history`)

**Loader query:** `feedbackSessions` JOIN `feedbackResponses` (count grouped by sessionId).

**List row:** session title, feedback type badge (Emoji / Text / Score), response count, created date, status badge (Active / Closed).

**Expanded detail:** all responses listed — emoji responses as large glyphs, text responses as quote blocks, score responses as a number distribution bar.

**Empty state:** "No feedback sessions yet. Start a session to see history here."

---

### Feelings (`/party/feelings/history`)

**Loader query:** `feelingSessions` JOIN `feelingEmojis` (count + frequency map grouped by sessionId).

**List row:** session date (formatted), total emoji count, top 3 emojis with their counts.

**Expanded detail:** full emoji frequency table sorted by count descending, session duration if `endedAt` is set.

**Empty state:** "No feeling streams yet. Open a room to see history here."

---

### Testimonials (`/testimonials/history`)

**Loader query:** `testimonialSessions` JOIN `testimonials` (counts by status: pending / approved / rejected).

**List row:** campaign title, approved count / total submitted, created date, status badge (Active / Closed).

**Expanded detail:** approved testimonials rendered as quote cards (student name + content), rejected/pending counts shown as a small summary line.

**Empty state:** "No campaigns yet. Create a campaign to see history here."

---

## Host Page Changes

Each of the following files gets a `History →` button added to its existing top-right action bar (alongside the existing Copy URL / New Room buttons):

- `src/routes/party.polls.tsx`
- `src/routes/party.kahoot-host.tsx`
- `src/routes/party.feedback-host.tsx`
- `src/routes/party.feelings.tsx`
- `src/routes/testimonials.tsx`

The button links to the corresponding history route. Style: same press-button style as existing action buttons, with the tool's accent color as background.

## Error Handling

- DB errors in the loader are caught and render an inline error banner (same `border-[#D4380D]` error style used elsewhere).
- Empty tables render the empty state message — no error.

## Out of Scope

- Pagination (all sessions loaded at once; acceptable for current data volumes)
- Deleting history entries
- Exporting history to CSV
- Authentication / access control
