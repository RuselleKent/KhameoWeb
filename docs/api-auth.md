# Auth API contract (draft)

Status: **draft from the frontend, needs Russel's review.** Every endpoint below is mocked in
`Frontend/src/features/auth/auth.api.js` with exactly these shapes. When an endpoint is ready,
set `USE_MOCK = false` there; no page code should need to change.

Changes:
- Rev 2: **verify email** and **resend verification code** (sections 3 and 4).
- Rev 3: **current user** and **log out** (sections 7 and 8), `onboarded_at` on the user, and the
  **session and redirect rules** the frontend route guards follow.

## Conventions

- Base path `/api`. JSON in and out. Send `Accept: application/json`.
- Auth is Sanctum SPA cookie auth. The frontend calls `GET /sanctum/csrf-cookie` before every POST below.
- Field errors use Laravel's standard 422 shape. The frontend shows the **first** message per field, word for word, so write messages for users:
  ```json
  { "message": "The given data was invalid.", "errors": { "email": ["Enter a valid email address."] } }
  ```
- When the frontend must tell different failures apart, add a machine-readable `error` string next to `errors` (used by verify email).
- Rate limits return **429** with `retry_after` in seconds (also send the `Retry-After` header):
  ```json
  { "message": "Too many requests.", "retry_after": 298 }
  ```
- Users must be 18+. Registration is rejected without `confirmed_age: true`.

## Endpoints at a glance

| # | Method & path | Used by | Auth |
|---|---|---|---|
| 1 | `POST /api/register` | /signup | guest |
| 2 | `POST /api/login` | /login | guest |
| 3 | `POST /api/email/verify` | /verify-email | see note |
| 4 | `POST /api/email/resend` | /verify-email | see note |
| 5 | `POST /api/forgot-password` | /forgot-password | guest |
| 6 | `POST /api/reset-password` | /reset-password | guest |
| 7 | `GET /api/user` | every page load (AuthProvider) | signed in |
| 8 | `POST /api/logout` | Log out button | signed in |

## The user object

Every endpoint that returns a user uses this shape:
```json
{
  "id": 3,
  "name": "Jane Cruz",
  "email": "jane.cruz@gmail.com",
  "email_verified_at": "2026-11-23T08:04:10.000000Z",
  "onboarded_at": "2026-11-23T08:10:00.000000Z",
  "created_at": "2026-11-23T08:00:00.000000Z",
  "updated_at": "2026-11-23T08:10:00.000000Z"
}
```
`email_verified_at` and `onboarded_at` are `null` until those steps are done; the route guards
depend on both (see "Session and redirect rules").

Note on 3 and 4: after `register` the user is signed in, so these could take the email from the
session. The frontend sends `email` anyway so the page also works after a reload or on another
device. Russel: pick one and tell the frontend; if the session wins, `email` can be ignored.

---

## 1. Register — `POST /api/register`

Creates the account, signs the user in, and emails a **6-digit verification code**.

Request:
```json
{
  "name": "Jane Cruz",
  "email": "jane.cruz@gmail.com",
  "password": "Kh4meo!2026",
  "password_confirmation": "Kh4meo!2026",
  "confirmed_age": true,
  "accepted_terms": true
}
```

Rules: `name` required; `email` required, valid, unique; `password` min 8, confirmed;
`confirmed_age` and `accepted_terms` must be `true`.

**201**
```json
{
  "user": { "id": 3, "name": "Jane Cruz", "email": "jane.cruz@gmail.com", "email_verified_at": null,
            "created_at": "2026-11-23T08:00:00.000000Z", "updated_at": "2026-11-23T08:00:00.000000Z" },
  "verification": { "expires_in": 600, "resend_in": 60 }
}
```
`verification` starts the timers on the verify page (code lifetime, resend cooldown; seconds).

**422** (messages the UI shows):
| Field | Message |
|---|---|
| `email` (taken) | This email is already registered. |
| `email` (format) | Enter a valid email address. |
| `name` | Enter your full name. |
| `password` | Use at least 8 characters. |
| `password_confirmation` | Passwords don’t match. |
| `confirmed_age` | You must be 18 or older to use Khameo. |
| `accepted_terms` | Please accept the terms to continue. |

## 2. Log in — `POST /api/login`

Request: `{ "email": "...", "password": "...", "remember": false }`

**200** — the user object (same shape as in register).

**422**
| Field | When | Message |
|---|---|---|
| `email` | no account with this email | We couldn’t find an account with this email. |
| `password` | wrong password | That password isn’t right. Try again, or reset it. |

**429** after 5 failed tries; login pauses for 15 minutes (`retry_after` ≈ 900).

## 3. Verify email — `POST /api/email/verify`

Checks the 6-digit code that `register` (or `resend`) emailed.

Request:
```json
{ "email": "jane.cruz@gmail.com", "code": "123456" }
```

Server rules:
- Code is 6 digits, valid for **10 minutes**, single use.
- **3 wrong attempts** per code. After the third, the code is dead until a new one is sent.
- Sending a new code (section 4) replaces the old one and resets attempts to 3.

**200** — sets `email_verified_at`:
```json
{ "user": { "id": 3, "name": "Jane Cruz", "email": "jane.cruz@gmail.com", "email_verified_at": "2026-11-23T08:04:10.000000Z" } }
```

**422** — always includes `error` so the page knows which state to show:

| `error` | When | Extra fields | Screen |
|---|---|---|---|
| `code_invalid` | wrong code, tries left | `attempts_left` (1–2) | "That code isn’t right. 2 attempts left." |
| `code_expired` | older than 10 minutes | — | "This code has expired" + Send a new code |
| `too_many_attempts` | 3rd wrong try, or any try after | `attempts_left: 0` | "Too many tries" + Send a new code |

Example:
```json
{
  "message": "That code isn’t right.",
  "errors": { "code": ["That code isn’t right."] },
  "error": "code_invalid",
  "attempts_left": 2
}
```

If the email is already verified, return **200** with the user (nothing to do).

## 4. Resend verification code — `POST /api/email/resend`

Emails a new code and invalidates the previous one.

Request:
```json
{ "email": "jane.cruz@gmail.com" }
```

**200**
```json
{ "message": "We sent a new code.", "expires_in": 600, "resend_in": 60 }
```
`resend_in` is the cooldown before the next resend is allowed (the page shows "Resend in 0:42").

**429** — called during the cooldown:
```json
{ "message": "Please wait before asking for another code.", "retry_after": 42 }
```

## 5. Forgot password — `POST /api/forgot-password`

Request: `{ "email": "jane.cruz@gmail.com" }`

**200** — same reply whether or not the account exists, so the form can't be used to find
out who has an account:
```json
{ "message": "If that email has an account, we sent a reset link." }
```
The email contains a link to the frontend:
`{FRONTEND_URL}/reset-password?token={token}&email={urlencoded email}`

**422** — `email`: "Enter a valid email address."

**429** — one request per email every **5 minutes**: `{ "message": "Too many requests.", "retry_after": 298 }`

(Mock only: the mock also returns `demo_reset_url` so testers can open the link without email.
The real API must not return it.)

## 6. Reset password — `POST /api/reset-password`

Request:
```json
{ "token": "…", "email": "jane.cruz@gmail.com", "password": "N3wPass!2026", "password_confirmation": "N3wPass!2026" }
```

Rules: password min 8, letters **and** numbers, confirmed, and not the user's current password.
Token works once and expires (Laravel default 60 minutes).

**200** — signs the user in on this device; other sessions stay signed in:
```json
{ "user": { "id": 3, "name": "Jane Cruz", "email": "jane.cruz@gmail.com" } }
```

**422**
| Field | When | Message |
|---|---|---|
| `token` | expired, used, or doesn't match the email | This reset link has expired. Ask for a new one. |
| `password` | reused current password | Choose a password you haven’t used on Khameo before. |
| `password` | too short / no number | Use at least 8 characters. |
| `password_confirmation` | mismatch | Passwords don’t match. |

## 7. Current user — `GET /api/user`

Called once when the app starts, to find out who is signed in (from the Sanctum session cookie).

**200** — the user object. **401** — nobody is signed in (a normal answer, not an error screen).
Any other failure (network, 5xx) shows "We couldn’t load Khameo" with a Retry button.

## 8. Log out — `POST /api/logout`

Ends the session. **204**, no body. The frontend forgets the user even if this request fails.

---

## Session and redirect rules

Implemented in `Frontend/src/app/` (`AuthProvider`, `RedirectIfAuthenticated`, `RequireAuth`,
`RequireOnboarded`, `authRedirect.js`). A signed-in user's **next step** is:

1. `email_verified_at` is null → `/verify-email`
2. else `onboarded_at` is null → `/onboarding`
3. else → `/home`

| Route group | Routes | Signed out | Signed in |
|---|---|---|---|
| Public | `/`, `/welcome`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` | show the page | go to the next step; `/verify-email` itself stays open for unverified users. After logging in, a user sent to `/login` from a protected page goes back to that page. |
| Signed in | `/onboarding` | → `/login` | unverified → `/verify-email`; already onboarded → `/home` |
| Signed in + onboarded | `/home` (and future app pages) | → `/login` (remembers the page) | unverified → `/verify-email`; not onboarded → `/onboarding` |

What this means for the backend:
- `register` signs the user in (unverified) so `/verify-email` works right after sign-up.
- `login` succeeds for unverified users too; the frontend sends them to `/verify-email`.
- `reset-password` signs the user in on this device.
- Something must set `onboarded_at` when onboarding finishes (endpoint to be defined with the onboarding screens).

---

## Open questions for Russel

1. Verify/resend: identify the user from the session or from `email`? (see note above)
2. ~~Login of an unverified account~~ — decided in rev 3: login succeeds, the frontend redirects to /verify-email. Shout if the backend needs it the other way.
3. Google sign-in (button exists on /login and /signup): which flow and endpoint?
