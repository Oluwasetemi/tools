# Certificate Generation & Verification — Design Spec

## Goal

Allow a host to upload a CSV of student names/emails, configure course details and branding, batch-generate certificates, email each student a verification link, and serve a public certificate page that doubles as verification proof.

## Architecture

HTTP-only — no PartyKit server. All operations go through TanStack Start server functions and API routes. Resend handles transactional email. Certificates are identified by UUID; the UUID is the verification token.

**Tech additions:**
- `resend` npm package
- `RESEND_API_KEY` environment variable

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/certificates` | Host | Dashboard — list all certificates grouped by batch, filter by status |
| `/certificates/settings` | Host | Create/edit persistent issuer profile |
| `/certificates/send` | Host | Upload CSV, configure course, preview, fire batch |
| `/certificates/verify/$id` | Public | View certificate + verified badge; revoked certificates show red banner |

**Server API routes:**
- `POST /api/certificates/send` — parse CSV, create DB records, send emails via Resend
- `POST /api/certificates/issuer` — upsert issuer profile

---

## Database Schema (Drizzle + Neon PostgreSQL)

### `certificate_issuers`
```ts
id            serial PRIMARY KEY
orgName       text NOT NULL
logoUrl       text NOT NULL        -- hosted image URL
instructorName text NOT NULL
replyToEmail  text NOT NULL
createdAt     timestamp DEFAULT now()
```

### `certificate_batches`
```ts
id            serial PRIMARY KEY
issuerId      integer REFERENCES certificate_issuers(id)
courseName    text NOT NULL
description   text NOT NULL        -- achievement description on the certificate
sentAt        timestamp DEFAULT now()
totalCount    integer NOT NULL
successCount  integer NOT NULL DEFAULT 0
```

### `certificates`
```ts
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
batchId       integer REFERENCES certificate_batches(id)
issuerId      integer REFERENCES certificate_issuers(id)
studentName   text NOT NULL
studentEmail  text NOT NULL
issuedAt      timestamp DEFAULT now()
expiresAt     timestamp             -- nullable; null = no expiry
isValid       boolean NOT NULL DEFAULT true   -- false = revoked
emailSentAt   timestamp             -- null if email delivery failed
```

---

## CSV Format

Host uploads a plain CSV with two columns. No header row required but supported:

```
student_name,student_email
John Doe,john@example.com
Jane Smith,jane@example.com
```

Course name, description, expiry, and issuer are configured in the send form — not in the CSV.

---

## Send Flow (`POST /api/certificates/send`)

1. Validate `x-internal-secret` header (same pattern as existing internal APIs)
2. Parse CSV rows — skip blank rows, validate each has name + valid email
3. Load issuer profile from DB
4. Create one `certificate_batches` record
5. For each student row:
   a. Insert `certificates` record (UUID auto-generated)
   b. Send email via Resend with certificate link
   c. On success: update `emailSentAt`; on failure: log, leave null
6. Update `certificate_batches.successCount`
7. Return `{ total, sent, failed, batchId }`

Maximum batch size: 500 rows per request (Resend free tier = 3k/month).

---

## Email

**Package:** `resend`
**From:** `replyToEmail` from issuer profile
**Subject:** `Your [courseName] Certificate — [orgName]`
**Body:** HTML email containing:
- Org logo
- "Congratulations, [studentName]" heading
- Course name
- One prominent CTA button: **"View Your Certificate →"** linking to `https://[APP_URL]/certificates/verify/[uuid]`
- Footer with certificate ID in small mono text

---

## Certificate Page (`/certificates/verify/$id`)

**Broadsheet design system** (matching the rest of the app):
- Warm `#F7F3EC` paper background, `#1A1008` near-black ink
- Decorative double-rule border frame
- Org logo centered at top
- `"Certificate of Completion"` — Playfair Display italic, large
- Student name — Playfair Display 900, very large, `#1A1008`
- `"For successfully completing"` label
- Course name — Playfair Display 700, large
- Description text — JetBrains Mono, muted
- Issued date · Expires date (omitted if no expiry)
- Divider rule
- Certificate ID in JetBrains Mono + green **"Verified ✓"** stamp badge
- **"Print / Save as PDF"** button — triggers `window.print()`

**Revoked state:** red `"This certificate has been revoked"` banner replaces the verified badge. All other content still shows.

**Not found:** 404 page with "Certificate not found" message.

---

## Dashboard (`/certificates`)

- Grouped by batch: batch header shows course name, sent date, `X of Y delivered`
- Each row: student name, email, issued date, expiry, status chip (Sent / Failed / Revoked), link icon to open verification page
- Filter by: all / sent / failed / revoked
- Action per row: Revoke (sets `isValid = false`), Resend email (for failed rows)

---

## Settings (`/certificates/settings`)

Simple form: org name, logo URL, instructor name, reply-to email. Upserts a single issuer profile record. Shows a preview of what the certificate header will look like with current settings.

---

## Error Handling

- Invalid CSV rows (missing name or email): skipped, reported in response as `skipped`
- Email send failure: certificate record created, `emailSentAt` stays null, counted in `failed`
- No issuer profile: `/certificates/send` shows an error prompting host to set up settings first
- Resend API error: propagate message, return `500` with details

---

## Out of Scope

- Authentication/accounts (host is implicitly trusted, same as other tools)
- QR codes on certificates (print-to-PDF + URL is sufficient)
- Custom certificate HTML templates per issuer
- Certificate download as server-generated PDF (browser print handles this)
- Bulk revocation
