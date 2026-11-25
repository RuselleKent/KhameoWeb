# Onboarding API contract (draft)

Status: **draft from the frontend, needs Russel's review.** Every endpoint below is mocked in
`Frontend/src/features/onboarding/onboarding.api.js` with exactly these shapes (mock data in
`Frontend/src/mockdata/onboarding.js`). When an endpoint is ready, set `USE_MOCK = false` there;
no page code should need to change.

Conventions (JSON, Sanctum cookies, CSRF, 422 and 429 shapes) are the same as in `docs/api-auth.md`.

Anything marked **[proposed]** was filled in by the frontend. Jenny is fine with these; Russel still
needs to review them.

Changes:
- Rev 2 (Jenny's decisions): one versioned recording consent, "Not now" rules, separate avatar upload,
  username / bio, `onboarding_path`, and two-factor codes for Hosts.
- Rev 3 (Jenny's decisions): `code` everywhere, username check, remove photo, 5 MB photos. Log in with
  two-factor is in `docs/api-auth.md` section 2.
- Rev 7 (Jenny's decisions): speaking **roles with audiences** replace `occupation`; AI audience suggestions (2c).
- Rev 6 (Jenny's decisions): `host_status`, school / community hosts, `GET /api/host-applications/latest`, coach
  upgrade, invite code format.
- Rev 5: host path; `host_type`, `institution`, `role_title` and the school email endpoints (section 8).
- Rev 4: personal, member and coach paths; more fields on the invite (section 4), `membership` on the 409 (section 5).

## Endpoints at a glance

| # | Method & path | Used by | Auth |
|---|---|---|---|
| 1 | `PATCH /api/user/consent` | /onboarding/consent, later Settings | signed in, verified |
| 2 | `POST /api/user/avatar` | profile step, later Settings | signed in, verified |
| 2a | `DELETE /api/user/avatar` | profile step, later Settings | signed in, verified |
| 2b | `GET /api/usernames/check` | profile step, later Settings | signed in, verified |
| 2c | `POST /api/ai/suggest-audiences` | profile step | signed in, verified |
| 3 | `PATCH /api/user/onboarding` | last onboarding step | signed in, verified |
| 4 | `GET /api/invites/{code}` | member and coach paths | signed in, verified |
| 5 | `POST /api/groups/join` | member and coach paths, later Groups | signed in, verified |
| 6 | `POST /api/user/two-factor/send` | host path | signed in, verified |
| 7 | `POST /api/user/two-factor/confirm` | host path | signed in, verified |
| 8a, 8b | `POST /api/host-applications/school-email/send`, `/verify` **[proposed]** | host path | signed in, verified |
| 8c | `GET /api/host-applications/latest` | /host-status | signed in, verified |
| 8 | `POST /api/host-applications` | host path, later Groups and Settings | signed in, verified, 2FA confirmed |

Every endpoint returns **401** when nobody is signed in, and **403** `{ "code": "email_unverified" }`
when the email isn't verified **[proposed]**.

### 403 codes

| `code` | Meaning | What the frontend does |
|---|---|---|
| `consent_required` | a recording was sent without active consent | opens the consent screen |
| `two_factor_required` | a host application was sent without confirmed 2FA | opens the 2FA step |
| `email_unverified` **[proposed]** | email not verified yet | opens /verify-email |

Shape: `{ "message": "…", "code": "consent_required" }`.

## New fields on the user object

The user object is the one in `docs/api-auth.md`, plus:

| Field | Type | Meaning |
|---|---|---|
| `recording_consent_at` | timestamp or `null` | When the user agreed to recording. `null` = no active consent (never asked, "Not now", or withdrawn). |
| `consent_version` | string or `null` | Version of the consent text last agreed to, e.g. `"2026-11"`. |
| `onboarding_path` | string or `null` | Starting path, for reporting only. |
| `display_name` | string or `null` | Name shown in groups and lobbies. |
| `username` | string or `null` | Unique handle, without the `@`. |
| `bio` | string or `null` | |
| `roles` | array | Speaking roles: `[{ "name": "Student", "audiences": ["Classmates"] }]`, `[]` when there are none. Who the user speaks as, **not** a group role. |
| `avatar_url` | string or `null` | |
| `two_factor_confirmed_at` | timestamp or `null` | When two-factor was confirmed. |
| `host_status` | string | `none`, `pending`, `verified` or `rejected`. **Create group is allowed only when `verified`**; enforce it in the API too. |

Profile fields sit directly on the user **[proposed]**. Group roles (Host, Coach, Member) are **not** part
of the profile; they come from group membership.

---

## 1. Save recording consent — `PATCH /api/user/consent`

There is **one** consent. Khameo exists only for the thesis study, so agreeing to recordings also means
agreeing to their use in the study.

Request:
```json
{ "recording_consent": true }
```

Rules: `recording_consent` required, boolean.
- `true` sets `recording_consent_at` to now and `consent_version` to the current version (`"2026-11"`).
  The server decides the version. Agreeing again to the same version keeps the original time **[proposed]**.
- `false` withdraws consent (from Settings): clears `recording_consent_at`. `consent_version` keeps the
  last version agreed to **[proposed]**.

**200** — the user:
```json
{
  "id": 3,
  "name": "Jane Cruz",
  "email": "jane.cruz@gmail.com",
  "email_verified_at": "2026-11-23T08:04:10.000000Z",
  "recording_consent_at": "2026-11-24T09:00:00.000000Z",
  "consent_version": "2026-11",
  "onboarded_at": null
}
```
(other user fields left out here)

**422**
| Field | When | Message |
|---|---|---|
| `recording_consent` | missing or not a boolean | Choose whether you agree. |

### "Not now"

"Not now" does **not** call this endpoint; `recording_consent_at` stays `null`.

| Without consent the user can | Without consent the user cannot |
|---|---|
| finish onboarding, browse, join groups, see the Library and results | record: Solo Practice, activity submissions, Real Time Rehearsal |

- Every record button opens the consent screen again.
- Every endpoint that accepts a recording returns **403** while `recording_consent_at` is `null`:
  ```json
  { "message": "You need to agree to recording first.", "code": "consent_required" }
  ```

## 2. Upload a photo — `POST /api/user/avatar`

`multipart/form-data`, one field: `avatar`, required, JPG, PNG or WEBP, up to **5 MB**. The backend may
resize it. Stored in Supabase Storage. Replaces the previous photo and sets `avatar_url` on the user.

**200**
```json
{ "avatar_url": "https://…/avatars/3.webp" }
```

**422** **[proposed messages]**
| Field | When | Message |
|---|---|---|
| `avatar` | missing | Choose a photo. |
| `avatar` | wrong type or too big | Upload a JPG, PNG or WEBP up to 5 MB. |

### 2a. Remove the photo — `DELETE /api/user/avatar`

**200** — also when there was no photo **[proposed]**:
```json
{ "avatar_url": null }
```
The frontend asks for confirmation first. Uploading and removing save right away, before section 3.

### 2b. Check a username — `GET /api/usernames/check?username=jane_c`

**200**
```json
{ "available": true }
```
- Compares regardless of case, and the user's own username counts as available **[proposed]**.
- The profile step calls it **400 ms after typing stops** and shows "That username is taken." under the
  field right away. It only calls once the format is valid.
- It is a hint, not a reservation: section 3 still validates.

**422** **[proposed]** — `username` has the wrong length or characters: "Use 3–20 letters, numbers or underscores."

**429** **[proposed]** — too many checks (it could be used to list usernames): `{ "message": "…", "retry_after": 30 }`

### 2c. Suggest audiences — `POST /api/ai/suggest-audiences`

Optional help on the profile step. The default audiences are static in the app
(`Frontend/src/features/onboarding/audiences.js`), so the step works without AI. The backend calls Gemini.

Request: `existing_audiences` is every audience listed for that role now, checked or not.
```json
{ "role": "Student", "existing_audiences": ["Classmates", "Professors", "Thesis Panel"] }
```

**200** — new audiences only, none from `existing_audiences`. Plain text, up to 40 characters each:
```json
{ "audiences": ["Student Council", "Adviser", "Department Faculty", "Scholarship Committee"] }
```
The app also drops repeats, trims and cuts to 40 characters. "Generate again" is the same call; the app then
replaces only the suggestions that aren't checked.

**503** — Gemini is down or over quota: `{ "message": "…", "code": "ai_unavailable" }`. The app shows "AI suggestions
aren’t available right now." with Retry.
**429** — more than **10 a minute** per user: `{ "message": "…", "retry_after": 30 }`
**422** **[proposed]** — `role` empty or longer than 40 characters.

`role` can be anything the user typed: treat it as data in the prompt, never as instructions **[proposed]**.

## 3. Finish onboarding — `PATCH /api/user/onboarding`

Sent once, at the end of onboarding, with every answer. JSON only: it never carries the photo.

Request:
```json
{
  "path": "personal",
  "goals": ["fewer_filler_words", "steady_pace"],
  "profile": {
    "display_name": "Jane Cruz",
    "username": "jane_cruz",
    "bio": "BSCS, ACLC Sta. Maria. Practicing for my thesis defense.",
    "roles": [
      { "name": "Student", "audiences": ["Classmates", "Thesis Panel"] },
      { "name": "Real estate agent", "audiences": [] }
    ]
  }
}
```

| Field | Rules |
|---|---|
| `path` | required: `personal`, `member`, `coach` or `host` |
| `goals` | array, 0–3 items (the step can be skipped). Values listed below **[proposed]** |
| `profile.display_name` | required, up to 80 characters **[proposed limit]** |
| `profile.username` | required, unique, 3–20 characters, letters / numbers / underscore. Unique regardless of case **[proposed]** |
| `profile.bio` | optional, up to 160 characters |
| `profile.roles` | optional array, up to **5**. Replaces `occupation` |
| `profile.roles.*.name` | required, 1–40 characters, unique regardless of case **[proposed]**. The app offers Student, Teacher or faculty, Working professional, Researcher, Event host or emcee, or a custom role |
| `profile.roles.*.audiences` | array of up to **20** names, 1–40 characters each. Only checked audiences are sent; may be empty |

Goal values, from the Figma "What do you want to improve?" step: `fewer_filler_words`, `steady_pace`,
`confident_tone`, `clear_opening`, `strong_closing`, `stay_on_time`.

**200** — the user, with `onboarded_at`, `onboarding_path` and the profile fields set. From then on the
route guards send the user to `/home`.

`path` is only a starting point, stored as `onboarding_path` for reporting. It grants no group role and
there is **no endpoint to change it**. Later, users join groups with section 5 and apply as Host with
section 8, from Groups or Settings.

**422** **[proposed messages]**
| Field | When | Message |
|---|---|---|
| `path` | missing or unknown | Choose how you want to use Khameo. |
| `goals` | more than 3, or an unknown value | Choose up to 3. |
| `profile.display_name` | empty | Enter a display name. |
| `profile.display_name` | too long | Use up to 80 characters. |
| `profile.username` | wrong length or characters | Use 3–20 letters, numbers or underscores. |
| `profile.username` | taken (also if someone took it since the check) | That username is taken. |
| `profile.bio` | too long | Use up to 160 characters. |
| `profile.roles` | more than 5 | Add up to 5 roles. |
| `profile.roles.0.name` | empty or too long | Use 1–40 characters for a role. |
| `profile.roles.0.name` | repeated | You already added this role. |
| `profile.roles.0.audiences` | more than 20 | Check up to 20 audiences per role. |
| `profile.roles.0.audiences` | an empty or too long name | Use 1–40 characters for an audience. |

## 4. Look up an invite — `GET /api/invites/{code}`

Shows what a code is for before joining. Codes are **4–12 letters, numbers and hyphens**, not case-sensitive, with
spaces trimmed. New codes are 8 characters, made by the backend.

**200**, group invite **[proposed fields]**:
```json
{
  "code": "ACLC-4A",
  "type": "group",
  "role": "member",
  "group": {
    "id": 1,
    "name": "ACLC Speech Center",
    "unit": "BSIT 4-A",
    "visibility": "private",
    "members_count": 28,
    "description": "Speech practice and graded talks for BSIT 4-A.",
    "cover_url": null
  },
  "invited_by": { "id": 10, "name": "Maria Santos" },
  "next_event": { "title": "Storytelling Night", "starts_at": "2026-12-04T11:30:00.000000Z" },
  "pending_reviews_count": null
}
```

| Field | Notes |
|---|---|
| `type` / `role` | `group` / `member`, or `coach` / `coach` |
| `group.unit` | section or class, or `null`. The app shows "ACLC Speech Center · BSIT 4-A" |
| `group.visibility` | `public` or `private` |
| `group.description`, `group.cover_url` | may be `null` (no cover → brand gradient) |
| `invited_by` | the group's Primary Host |
| `next_event` | or `null` |
| `pending_reviews_count` | coach invites only, otherwise `null` |

**200**, coach invite: same shape with `"type": "coach"`, `"role": "coach"` and, for example, `"pending_reviews_count": 7`.

**404** — no such code:
```json
{ "message": "We couldn’t find that invite code." }
```
The app shows its own text per path ("We couldn’t find a group with this code…"). A coach code on the Member
path, or the other way round, is told apart by `type`.

## 5. Join a group — `POST /api/groups/join`

Request: `{ "code": "ACLC-4A" }`. Sent when the user presses Join, before the profile step, so the user is
already in the group even if onboarding isn't finished.

**201** — the membership **[proposed fields]**:
```json
{
  "id": 1,
  "group": { "id": 1, "name": "ACLC Speech Center", "unit": "BSIT 4-A" },
  "user_id": 3,
  "role": "member",
  "joined_at": "2026-11-24T09:05:00.000000Z"
}
```
`role` comes from the invite (`member` or `coach`), never from the request. Recording consent is not needed.

**404** — no such code (same body as section 4).
**409** **[proposed]** — already in this group, with the membership they have:
```json
{ "message": "You’re already in this group.", "code": "already_member", "membership": { "id": 1, "role": "member" } }
```
- Same role as the invite: the app simply continues.
- **A coach code and a Member:** the app asks "You’re a Member of BSIT 4-A. Join as Coach instead?". On yes it sends
  `{ "code": "COACH-RINA", "upgrade": true }` **[proposed field]** and gets **200** with the membership, now `"role": "coach"`.
- Any other difference (e.g. a Coach using a member code): the app says which role they have. A code never lowers a role.

**422** — `code` empty: "Enter your invite code."

## 6. Send a two-factor code — `POST /api/user/two-factor/send`

Only for turning two-factor on the first time; codes at log in are in `docs/api-auth.md` section 2.

Emails a 6-digit code to the signed-in user. No body. A new code replaces the old one.

**200** **[proposed body, same as `POST /api/email/resend`]**
```json
{ "message": "We sent a code.", "expires_in": 600, "resend_in": 60 }
```

**429** — called during the cooldown: `{ "message": "Please wait before asking for another code.", "retry_after": 42 }`

## 7. Confirm two-factor — `POST /api/user/two-factor/confirm`

Request: `{ "code": "123456" }`

**200** — the user, with `two_factor_confirmed_at` set. Already confirmed: **200** with the user.

**422** **[proposed]** — the same rules as verify email (`docs/api-auth.md` section 3): 10 minutes, single
use, 3 attempts. `code` is `code_invalid` (with `attempts_left`), `code_expired` or `too_many_attempts`.

## 8. Apply to host — `POST /api/host-applications`

`multipart/form-data`:

| Field | School host | Community host | Rules |
|---|---|---|---|
| `host_type` | `school` | `community` | required |
| `school_email` | required | — | valid, not a free provider (Gmail, Yahoo…) |
| `school_code` | required | — | the 6-digit code that verified `school_email` (8b) |
| `institution` **[proposed]** | required | — | up to 120 characters |
| `role_title` **[proposed]** | required | — | up to 80 characters, e.g. "Instructor, thesis adviser" |
| `role_proof` | required | — | file: JPG, PNG or PDF, up to 5 MB |
| `organization_name` **[proposed name]** | — | required | up to 120 characters |
| `proof_link` **[proposed name]** | — | this or `proof_file` | `https://` link, e.g. an organization page |
| `proof_file` **[proposed name]** | — | this or `proof_link` | file: JPG, PNG or PDF, up to 5 MB |

Both need confirmed 2FA. Only Khameo admins may see the proof, and files are deleted after review (the app says so).
Allowed when `host_status` is `none` or `rejected` (reapply).

**201** — also sets `host_status` to `pending`:
```json
{ "status": "pending" }
```
While it is pending the user can use Khameo (practice, join groups) but **cannot create groups**. That unlocks
when the Administrator approves them.

**403** — 2FA not confirmed (checked first). The app goes back to the 2FA step and keeps the answers and file:
```json
{ "message": "Confirm two-factor first.", "code": "two_factor_required" }
```

**409** **[proposed]** — one is already waiting. The app treats it as submitted:
`{ "message": "You already have an application under review.", "code": "already_pending" }`. Already approved:
`"code": "already_verified"`.

**422** **[proposed messages]**
| Field | When | Message |
|---|---|---|
| `host_type` | missing or unknown | Choose a host type. |
| `school_email` | missing or invalid | Enter a valid school email. |
| `school_email` | free provider | Use your school or organization email, not a free provider. |
| `school_code` | missing, or not the code that verified `school_email` | Verify your school email first. |
| `institution` | missing | Enter your institution. |
| `role_title` | missing | Enter your role. |
| `role_proof` | missing | Upload proof of your role. |
| `role_proof`, `proof_file` | wrong type or too big | Upload a JPG, PNG or PDF up to 5 MB. |
| `organization_name` | missing | Enter your organization or community name. |
| `proof_link` | not an `https://` link | Enter a link that starts with https://. |
| `proof_file` | neither a link nor a file | Add a link or upload a file. |

### 8a. Send a school email code — `POST /api/host-applications/school-email/send` **[proposed]**

Request: `{ "school_email": "jcruz@aclc.edu.ph" }`. Emails a 6-digit code to that address, which is usually not
the account's email.

**200** — `{ "message": "We sent a code.", "expires_in": 600, "resend_in": 60 }`
**422** — `school_email`, as above. **429** — during the cooldown, with `retry_after`.

### 8b. Verify the school email — `POST /api/host-applications/school-email/verify` **[proposed]**

Request: `{ "school_email": "jcruz@aclc.edu.ph", "code": "123456" }`

**200** — `{ "school_email": "jcruz@aclc.edu.ph", "verified": true }`. The same code is then accepted once as
`school_code` in section 8, for at least a day (2FA and the upload come in between).
**422** — the same codes and rules as verify email (`docs/api-auth.md` section 3).

### 8c. Latest application — `GET /api/host-applications/latest`

For the "Host status" screen.

**200**
```json
{
  "status": "rejected",
  "submitted_at": "2026-11-18T08:09:00.000000Z",
  "rejection_reason": "Your faculty ID photo is too blurry to read. Please upload a clearer copy."
}
```
`status` is the same value as `host_status`. `rejection_reason` is `null` unless rejected. A user who never applied
gets `{ "status": "none", "submitted_at": null, "rejection_reason": null }` **[proposed]**. Rejected shows the reason
and a Reapply button.

---

## Onboarding routes

| Route | Screen | Shown when |
|---|---|---|
| `/onboarding/consent` | Recording & AI consent | not asked yet. Steps redirect here until the user agrees or picks "Not now" |
| `/onboarding` | Choose a path (step 1 of 4) | consent answered |
| `/onboarding/personal` | P1 What do you want to improve (step 2) | personal path selected |
| `/onboarding/personal/profile` | P2/P3 Set up your profile (step 3) | personal path selected |
| `/onboarding/personal/ready` | P4 Ready; any choice sends section 3 (step 4) | display name and username filled in, otherwise back to profile |
| `/onboarding/personal/tour` | T1 Take the tour | onboarding saved, otherwise back to ready |
| `/onboarding/member` | M1–M4 Invite code (step 2) | member path selected |
| `/onboarding/member/{profile,ready,tour}` | M5, M6, T1 (steps 3 and 4) | joined with a member code, otherwise back to the code |
| `/onboarding/coach` | C1–C3 Coach code (step 2) | coach path selected |
| `/onboarding/coach/{profile,ready,tour}` | C4, C5, T1 (steps 3 and 4) | joined with a coach code, otherwise back to the code |
| `/onboarding/host` | H1 Host type (step 2) | host path selected |
| `/onboarding/host/school-email` | H2 School email and code (step 2) | school host |
| `/onboarding/host/two-factor` | Two-factor code | school: school email verified |
| `/onboarding/host/role-proof` | H3 Role proof; submits section 8 (step 2) | school host, 2FA confirmed; otherwise back to two-factor |
| `/onboarding/host/community-proof` | Community proof; submits section 8 (step 2) | community host, 2FA confirmed; otherwise back to two-factor |
| `/onboarding/host/submitted` | H5 Application submitted (step 2) | `host_status` is `pending` or `verified`; the steps before it then redirect here |
| `/onboarding/host/{profile,ready,tour}` | H6, H7, T1 (steps 3 and 4) | application sent |
| `/recording-consent` | Recording & AI consent, opened by record buttons | onboarded |
| `/host-status` | Host status from `host_status`; 8c adds the date and reason. Shows if Create group is locked | onboarded |
| `/host-application` and its steps | the same host pages, to apply or reapply later | onboarded, `host_status` is `none` or `rejected` |

- Signed out → `/login`; unverified → `/verify-email`; already onboarded → `/home` (except Ready and Tour).
- Answers are kept in the tab (`sessionStorage`) until they are sent in section 3, so Back and reload
  don't lose them. "Not now" is remembered the same way: a new tab or device asks again.
- "Not yet" and Skip on the code steps switch to the personal path at its profile step, so
  `onboarding_path` is saved as `personal`.
- Record buttons (Solo Practice, submissions, Real Time Rehearsal) use `useRecordingGate`
  (`Frontend/src/features/onboarding/`). Without `recording_consent_at` it opens `/recording-consent`, the same
  consent screen for users who finished onboarding, and they come back to the page they were on.

## Decided

| Question | Decision |
|---|---|
| One consent or two? | One, versioned: `recording_consent_at` + `consent_version`. |
| After "Not now"? | Everything except recording; the API answers 403 `consent_required`. |
| Photo upload | Separate `POST /api/user/avatar`. |
| Profile fields | `display_name`, `username`, `bio`, `roles`. |
| Change path later | No endpoint; `onboarding_path` is for reporting. |
| Host 2FA | Email codes: sections 6 and 7 turn it on; `docs/api-auth.md` section 2 asks at log in. |
| Reason field | `code` everywhere. |
| Taken username | Check endpoint (2b), and the final request still validates. |
| Roles and audiences | Back on the profile step, as in Figma: up to 5 speaking roles, up to 20 audiences each. Replaces `occupation` and the earlier "audiences are out of scope". |
| Invite codes | 4–12 letters, numbers and hyphens; not case-sensitive. |
| Coach code for a Member | Upgrades them after they confirm. |
| Community hosts | In scope: organization name and a link or file, plus 2FA. |
| Host status | `host_status` on the user, and 8c. |
| Reset password | Does not start a session (`docs/api-auth.md` section 6). |
| Remove photo, size | `DELETE /api/user/avatar`; 5 MB as in Figma. |

## Open questions

None for now.
