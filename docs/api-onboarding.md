# Onboarding API contract (draft)

Status: **draft from the frontend, needs Russel's review.** Every endpoint below is mocked in
`Frontend/src/features/onboarding/onboarding.api.js` with exactly these shapes (mock data in
`Frontend/src/mockdata/onboarding.js`). When an endpoint is ready, set `USE_MOCK = false` there;
no page code should need to change.

Conventions (JSON, Sanctum cookies, CSRF, 422 and 429 shapes) are the same as in `docs/api-auth.md`.

## Endpoints at a glance

| # | Method & path | Used by | Auth |
|---|---|---|---|
| 1 | `PATCH /api/user/consent` | /onboarding/consent, later Settings | signed in, verified |
| 2 | `PATCH /api/user/onboarding` | last onboarding step | signed in, verified |
| 3 | `GET /api/invites/{code}` | member and coach paths | signed in, verified |
| 4 | `POST /api/groups/join` | member and coach paths | signed in, verified |
| 5 | `POST /api/host-applications` | host path | signed in, verified |

Every endpoint returns **401** when nobody is signed in and **403** when the email isn't verified.

The user object is the one in `docs/api-auth.md`, with one new field:

| Field | Type | Meaning |
|---|---|---|
| `consent_at` | timestamp or `null` | When the user agreed to the recording & AI terms. `null` = no active consent (never asked, "Not now", or withdrawn). |

---

## 1. Save consent — `PATCH /api/user/consent`

Request:
```json
{ "research_consent": true }
```

Rules: `research_consent` required, boolean.
- `true` sets `consent_at` to now. If it is already set, keep the original time.
- `false` withdraws consent: sets `consent_at` to `null`.

**200** — the user:
```json
{
  "id": 3,
  "name": "Jane Cruz",
  "email": "jane.cruz@gmail.com",
  "email_verified_at": "2026-11-23T08:04:10.000000Z",
  "consent_at": "2026-11-24T09:00:00.000000Z",
  "onboarded_at": null,
  "created_at": "2026-11-23T08:00:00.000000Z",
  "updated_at": "2026-11-24T09:00:00.000000Z"
}
```

**422**
| Field | When | Message |
|---|---|---|
| `research_consent` | missing or not a boolean | Choose whether you agree. |

"Not now" does **not** call this endpoint; `consent_at` simply stays `null`.

## 2. Finish onboarding — `PATCH /api/user/onboarding`

Sent once, at the end of onboarding, with every answer.

Request:
```json
{
  "path": "personal",
  "goals": ["fewer_filler_words", "steady_pace"],
  "profile": { "display_name": "Jane Cruz", "avatar": null }
}
```

| Field | Rules |
|---|---|
| `path` | required: `personal`, `member`, `coach` or `host` |
| `goals` | array, 0–3 items (the step can be skipped). Values listed below |
| `profile.display_name` | required, 1–80 characters |
| `profile.avatar` | string or `null` (see open question 3) |

Goal values, from the Figma "What do you want to improve?" step: `fewer_filler_words`, `steady_pace`,
`confident_tone`, `clear_opening`, `strong_closing`, `stay_on_time`.

**200** — the user, with `onboarded_at` set. From then on the route guards send the user to `/home`.
`path` does not grant a group role; roles are per group.

**422**
| Field | When | Message |
|---|---|---|
| `path` | missing or unknown | Choose how you want to use Khameo. |
| `goals` | more than 3, or an unknown value | Choose up to 3. |
| `profile.display_name` | empty | Enter a display name. |

## 3. Look up an invite — `GET /api/invites/{code}`

Shows what a code is for before joining. Codes are not case-sensitive.

**200**, group invite:
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

## 4. Join a group — `POST /api/groups/join`

Request: `{ "code": "SPEAK-2026" }`

**201** — the membership:
```json
{
  "id": 1,
  "group": { "id": 1, "name": "BSCS 4A Public Speaking" },
  "user_id": 3,
  "role": "member",
  "joined_at": "2026-11-24T09:05:00.000000Z"
}
```
`role` comes from the invite (`member` or `coach`), never from the request.

**404** — no such code (same body as section 3).
**409** — already in this group: `{ "message": "You’re already in this group.", "error": "already_member" }`
**422** — `code` empty: "Enter your invite code."

## 5. Apply to host — `POST /api/host-applications`

`multipart/form-data`:

| Field | Rules |
|---|---|
| `school_email` | required, valid email |
| `school_code` | required |
| `role_proof` | required file: JPG, PNG or PDF, up to 5 MB |

**201**
```json
{ "status": "pending" }
```

**409** — one is already waiting: `{ "message": "You already have an application under review.", "error": "already_pending" }`

**422**
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

- Signed out → `/login`; unverified → `/verify-email`; already onboarded → `/home`.
- Answers are kept in the tab (`sessionStorage`) until they are sent in section 2, so Back and reload
  don't lose them. "Not now" is remembered the same way: a new tab or device asks again.

## Proposed by the frontend (please check)

The request said which endpoints exist and their main fields. These details were filled in: the 401/403
rules, goal values and the 3-goal limit, the invite and membership fields, the 409 cases, the file
limits, and all error messages.

## Open questions for Russel and Jenny

1. The field is called `research_consent`, but the screen asks for consent to **recordings and AI
   evaluation** ("Taking part is voluntary", "Deleted 90 days after the study period"). One consent or two?
2. What can a user do after "Not now"? Recording presumably needs to ask again, and the API should reject
   recordings while `consent_at` is `null`.
3. `avatar` is JSON here, but the Figma profile step uploads a photo. Upload it separately and send its
   URL, or make this endpoint multipart?
4. The Figma profile step also has **username, bio and roles**, which aren't in `profile` yet.
5. Choose a path says the choice can be changed later in Settings. Which endpoint does that?
6. The host path in Figma mentions **2FA**; there is no endpoint for it yet.
