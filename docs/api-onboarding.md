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
  username / bio / occupation, `onboarding_path`, and two-factor codes for Hosts.
- Rev 3 (Jenny's decisions): `code` everywhere, username check, remove photo, 5 MB photos. Log in with
  two-factor is in `docs/api-auth.md` section 2.

## Endpoints at a glance

| # | Method & path | Used by | Auth |
|---|---|---|---|
| 1 | `PATCH /api/user/consent` | /onboarding/consent, later Settings | signed in, verified |
| 2 | `POST /api/user/avatar` | profile step, later Settings | signed in, verified |
| 2a | `DELETE /api/user/avatar` | profile step, later Settings | signed in, verified |
| 2b | `GET /api/usernames/check` | profile step, later Settings | signed in, verified |
| 3 | `PATCH /api/user/onboarding` | last onboarding step | signed in, verified |
| 4 | `GET /api/invites/{code}` | member and coach paths | signed in, verified |
| 5 | `POST /api/groups/join` | member and coach paths, later Groups | signed in, verified |
| 6 | `POST /api/user/two-factor/send` | host path | signed in, verified |
| 7 | `POST /api/user/two-factor/confirm` | host path | signed in, verified |
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
| `occupation` | string or `null` | What the user does (student, teacher, professional…). Not a group role. |
| `avatar_url` | string or `null` | |
| `two_factor_confirmed_at` | timestamp or `null` | When two-factor was confirmed. |

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
The frontend asks for confirmation first.

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
    "occupation": "Student"
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
| `profile.occupation` | optional, one value, up to 60 characters **[proposed limit]** |

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
| `profile.occupation` | too long | Use up to 60 characters. |

## 4. Look up an invite — `GET /api/invites/{code}`

Shows what a code is for before joining. Codes are not case-sensitive **[proposed]**.

**200**, group invite **[proposed fields]**:
```json
{
  "code": "SPEAK-2026",
  "type": "group",
  "role": "member",
  "group": { "id": 1, "name": "BSCS 4A Public Speaking", "members_count": 24 },
  "invited_by": { "id": 10, "name": "Maria Santos" }
}
```

**200**, coach invite: same shape with `"type": "coach"` and `"role": "coach"`.

**404** — no such code:
```json
{ "message": "We couldn’t find that invite code." }
```

## 5. Join a group — `POST /api/groups/join`

Request: `{ "code": "SPEAK-2026" }`

**201** — the membership **[proposed fields]**:
```json
{
  "id": 1,
  "group": { "id": 1, "name": "BSCS 4A Public Speaking" },
  "user_id": 3,
  "role": "member",
  "joined_at": "2026-11-24T09:05:00.000000Z"
}
```
`role` comes from the invite (`member` or `coach`), never from the request. Recording consent is not needed.

**404** — no such code (same body as section 4).
**409** **[proposed]** — already in this group: `{ "message": "You’re already in this group.", "code": "already_member" }`
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

| Field | Rules |
|---|---|
| `school_email` | required, valid email |
| `school_code` | required |
| `role_proof` | required file: JPG, PNG or PDF, up to 5 MB **[proposed]** |

**201**
```json
{ "status": "pending" }
```

**403** — 2FA not confirmed (checked first):
```json
{ "message": "Confirm two-factor first.", "code": "two_factor_required" }
```

**409** **[proposed]** — one is already waiting: `{ "message": "You already have an application under review.", "code": "already_pending" }`

**422** **[proposed messages]**
| Field | When | Message |
|---|---|---|
| `school_email` | missing or invalid | Enter a valid school email. |
| `school_code` | missing | Enter your school code. |
| `role_proof` | missing | Upload proof of your role. |
| `role_proof` | wrong type or too big | Upload a JPG, PNG or PDF up to 5 MB. |

---

## Onboarding routes

| Route | Screen | Shown when |
|---|---|---|
| `/onboarding/consent` | Recording & AI consent | not asked yet. Steps redirect here until the user agrees or picks "Not now" |
| `/onboarding` | Choose a path (step 1 of 4) | consent answered |
| `/onboarding/{personal,member,coach,host}` | Step 2 of each path (placeholder for now) | that path is selected |
| `/onboarding/host/two-factor` | Two-factor code | host path, before role proof |
| `/onboarding/host/role-proof` | H3 Role proof (placeholder for now) | host path, 2FA confirmed; otherwise back to two-factor |

- Signed out → `/login`; unverified → `/verify-email`; already onboarded → `/home`.
- Answers are kept in the tab (`sessionStorage`) until they are sent in section 3, so Back and reload
  don't lose them. "Not now" is remembered the same way: a new tab or device asks again.
- Record buttons (Solo Practice, submissions, Real Time Rehearsal) belong to users who are already
  onboarded, and `/onboarding/*` sends those users to `/home`. Those features need the consent screen on
  a route outside onboarding.

## Decided

| Question | Decision |
|---|---|
| One consent or two? | One, versioned: `recording_consent_at` + `consent_version`. |
| After "Not now"? | Everything except recording; the API answers 403 `consent_required`. |
| Photo upload | Separate `POST /api/user/avatar`. |
| Profile fields | `display_name`, `username`, `bio`, `occupation`. Figma's "role" is "who you speak as" (example: Student), so it is `occupation`. |
| Change path later | No endpoint; `onboarding_path` is for reporting. |
| Host 2FA | Email codes: sections 6 and 7 turn it on; `docs/api-auth.md` section 2 asks at log in. |
| Reason field | `code` everywhere. |
| Taken username | Check endpoint (2b), and the final request still validates. |
| Audiences | Out of scope for onboarding; target audience belongs to the Solo Practice session setup (SRS 5.1). `occupation` is a single choice. |
| Remove photo, size | `DELETE /api/user/avatar`; 5 MB as in Figma. |

## Open questions

1. **Occupation options.** `occupation` is one value. Free text as in Figma (current), or a fixed list
   (Student, Teacher, Professional…)? A fixed list needs its values here.
