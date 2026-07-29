# Domain Context — Tools

This file defines the domain vocabulary used across the codebase. Engineering skills read it before exploring; contributors read it before naming things. Do not use synonyms for terms defined here.

## Roles

**Teacher (Owner)**
The authenticated user who creates and manages tool sessions. A teacher logs in via OAuth and owns all sessions they create. There is exactly one active teacher per session.

**Student (Participant)**
Any person who joins a live session via a room URL. Students never authenticate — they join anonymously with a randomly-assigned participant ID.

## Session Concepts

**Planned Session**
A tool session that has been pre-configured by a teacher with a title, tool type, full configuration, and an optional `scheduledFor` date. A planned session has no active PartyKit room — it exists only in the database. The teacher starts it manually from the schedule list when class begins.

- Status: `planned`
- Has: `toolType`, `config` (tool-specific settings), `scheduledFor` (optional), `ownerId`, `title`
- Does NOT have: a live PartyKit room or room ID yet

**Live Session**
A planned session that has been started by its owner. Starting a planned session generates a `roomId`, opens the PartyKit room, and transitions status to `active`. The teacher is redirected to the tool's host page.

- Status: `active`
- Has: everything a planned session has, plus a `roomId`

**Ended Session**
A live session that has been closed. Appears in history.

- Status: `ended`

## Tools

Each tool is a specific type of engagement. All tool sessions share the planned → live → ended lifecycle.

| Tool | `toolType` value | Host route | Player route |
|------|-----------------|------------|--------------|
| Quiz (Kahoot-style) | `kahoot` | `/party/kahoot-host` | `/party/kahoot-player` |
| Live Poll | `poll` | `/party/polls` | `/party/poll-voter` |
| Feedback | `feedback` | `/party/feedback-host` | `/party/feedback-client` |
| Feeling Stream | `feelings` | `/party/feelings` | same page |
| Testimonials | `testimonials` | `/testimonials` | `/testimonials/submit` |
| Certificates | `certificates` | `/certificates` | `/certificates/verify/$id` |

## Schedule

The **Schedule** is the teacher's view of all their planned and recently-ended sessions, sorted by `scheduledFor`. It is the primary planning surface — the teacher creates sessions here, sees what's coming up, and launches live sessions from it.

## Ownership

Every session (planned or live) is owned by the teacher who created it. Ownership is enforced at the server function level — a teacher can only start, edit, or end sessions they own.

## Room

A **room** is the PartyKit WebSocket channel for a live session. Each room has a `roomId` (random 7-character string) scoped to its tool type (e.g. `polls:abc1234`). Rooms are created when a planned session is started and do not exist before that.
