# Auth API contract

Status: sections 1–8 are **built in Laravel** (`Backend/app/Http/Controllers/Auth`, tests in
`Backend/tests/Feature/Auth`) and match this document; Russel reviews. Section 9 (Google) is still mocked in
`Frontend/src/features/auth/auth.api.js` (`GOOGLE_USE_MOCK`) until the Socialite work is done.
`USE_MOCK = true` there mocks every endpoint, for working without Laravel.

Changes:
- Rev 2: **verify email** and **resend verification code** (sections 3 and 4).
- Rev 3: **current user** and **log out** (sections 7 and 8), `onboarded_at` on the user, and the
  **session and redirect rules** the frontend route guards follow.
- Rev 4: consent, profile and two-factor fields on the user; onboarding endpoints are in `docs/api-onboarding.md`.
- Rev 5: machine-readable reasons are always **`code`** (was `error`); **two-factor log in** (section 2).
- Rev 6: **every email log in emails a code** (section 2, was Hosts only); **403 account locked**;
  **change email** before verifying (3a); **Google sign-in** popup flow (section 9); consent step in the
  redirect rules; `reset-password` no longer signs in.
- Rev 7 (built): log in code **only for verified accounts** (unverified accounts sign in and go to
  /verify-email); `email` in the log in answer; the user object's `occupation` is replaced by `roles`;
  every field below is real; reset password messages; verify/resend use the signed-in user.

## Conventions

- Base path `/api`. JSON in and out. Send `Accept: application/json`.
- Auth is Sanctum SPA cookie auth. The frontend calls `GET /sanctum/csrf-cookie` before every POST below.
- Field errors use Laravel's standard 422 shape. The frontend shows the **first** message per field, word for word, so write messages for users:
  ```json
  { "message": "The given data was invalid.", "errors": { "email": ["Enter a valid email address."] } }
  ```
- When the frontend must tell failures apart, add a machine-readable **`code`** string: `{ "message": "…", "code": "consent_required" }`. This is the only name for it, on every status.
  On a 422 it sits next to `errors`. Plain field validation has no `code`.
- Rate limits return **429** with `retry_after` in seconds (also the `Retry-After` header):
  ```json
  { "message": "Too many requests.", "retry_after": 298 }
  ```
  Route-level throttles (e.g. `throttle:6,1` on resend) answer Laravel's plain 429 `{ "message": "Too Many
  Attempts." }` with only the `Retry-After` header.
- Users must be 18+. Registration is rejected without `confirmed_age: true`.

## Endpoints at a glance

| # | Method & path | Used by | Auth |
|---|---|---|---|
| 1 | `POST /api/register` | /signup | guest |
| 2 | `POST /api/login` | /login | guest |
| 2a | `POST /api/login/two-factor` | /login/verify | guest, log in pending |
| 2b | `POST /api/login/two-factor/resend` | /login/verify | guest, log in pending |
| 3 | `POST /api/email/verify` | /verify-email | signed in |
| 3a | `POST /api/email/change` | /verify-email ("Change it") | signed in, unverified |
| 4 | `POST /api/email/resend` | /verify-email | signed in |
| 5 | `POST /api/forgot-password` | /forgot-password | guest |
| 6 | `POST /api/reset-password` | /reset-password | guest |
| 7 | `GET /api/user` | every page load (AuthProvider) | signed in |
| 8 | `POST /api/logout` | Log out button | signed in |
| 9 | `GET /auth/google/redirect`, `GET /auth/google/callback` (web routes) | Google button on /login, /signup | guest |

## The user object

Every endpoint that returns a user uses this shape:
```json
{
  "id": 3,
  "name": "Jane Cruz",
  "email": "jane.cruz@gmail.com",
  "email_verified_at": "2026-11-23T08:04:10.000000Z",
  "recording_consent_at": "2026-11-23T08:06:00.000000Z",
  "consent_version": "2026-11",
  "onboarded_at": "2026-11-23T08:10:00.000000Z",
  "onboarding_path": "personal",
  "display_name": "Jane Cruz",
  "username": "jane_cruz",
  "bio": null,
  "roles": [{ "name": "Student", "audiences": ["Classmates", "Thesis Panel"] }],
  "avatar_url": "http://localhost:8000/storage/avatars/3f1c….png",
  "two_factor_confirmed_at": null,
  "host_status": "none",
  "created_at": "2026-11-23T08:00:00.000000Z",
  "updated_at": "2026-11-23T08:10:00.000000Z"
}
```
(`App\Http\Resources\UserResource`.) `email_verified_at`, `recording_consent_at` and `onboarded_at` are
`null` until those steps are done; the route guards depend on them (see "Session and redirect rules").
The consent and profile fields are `null` on a new account, `roles` is `[]` and `host_status` is `"none"`;
`docs/api-onboarding.md` explains them. `recording_consent_at` can stay `null` after onboarding.
`avatar_url` is a full URL on Laravel's public disk for now. Never in the object: password, remember
token, `google_id`, `avatar_path`, `is_admin`. Examples below leave out fields that don't matter there.

Sections 3 and 4 use the **signed-in user** (register signs in). The frontend still sends `email`;
Laravel ignores it.

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
            "recording_consent_at": null, "consent_version": null, "onboarded_at": null,
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

**200, verified account** — right credentials. A 6-digit code is emailed (`LoginCodeMail`, table
`login_codes`, same rules as section 3: 10 minutes, 3 tries, 60 s between sends). **No session yet**: the
session only remembers who is logging in (and `remember`) for **15 minutes**. The frontend goes to
`/login/verify`:
```json
{ "two_factor_required": true, "email": "jane.cruz@gmail.com", "expires_in": 600, "resend_in": 60 }
```
Logging in again within a minute doesn't send a second code: the one already sent still works, and
`expires_in` / `resend_in` are what is left of it.

**200, unverified account** — signs in right away and returns the user object; the frontend sends them
to `/verify-email`, which emails its own code (section 4).

Google log in (section 9) does not ask for this code: Google already confirmed the account.

**403** — the account can't log in (`account_status` isn't active). The frontend shows the "Account locked"
screen (Figma 1.7) with Reset password and Back to log in:
```json
{ "message": "This account can’t log in." }
```

**422**
| Field | When | Message |
|---|---|---|
| `email` | no account with this email | We couldn’t find an account with this email. |
| `password` | wrong password | That password isn’t right. Try again, or reset it. |

**429** after 5 failed tries; login pauses for 15 minutes (`retry_after` ≈ 900). The frontend shows the
same "Account locked" screen with a countdown from `retry_after`.

### 2a. Finish the log in — `POST /api/login/two-factor`

Request: `{ "code": "123456" }`. Who is logging in comes from the session (step 2), not the request.
Throttle: 10 a minute.

**200** — starts the session (keeps `remember` from step 2); the user object.

**422** — the same codes and rules as verify email (section 3): `code_invalid` (with `attempts_left`),
`code_expired`, `too_many_attempts`. Missing code: `errors.code` "Enter the 6-digit code."

**401** — no log in is waiting, it is older than 15 minutes, or the account was suspended meanwhile:
```json
{ "message": "Log in again.", "code": "login_expired" }
```

### 2b. Resend the log in code — `POST /api/login/two-factor/resend`

No body. **200** — `{ "message": "We sent a new code.", "expires_in": 600, "resend_in": 60 }`; the old code
stops working.

**429** — called during the 60 s cooldown: `{ "message": "Please wait before asking for another code.",
"retry_after": 42 }`. **401** `login_expired`, as in 2a.

`POST /api/user/two-factor/send` and `/confirm` (`docs/api-onboarding.md`) are only for turning two-factor
on the first time.

## 3. Verify email — `POST /api/email/verify`

Checks the 6-digit code that `register` (or `resend`, or `email/change`) emailed to the signed-in user.

Request (`email` is ignored; the signed-in user counts):
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

**422** — always includes `code` so the page knows which state to show:

| `code` | When | Extra fields | Screen |
|---|---|---|---|
| `code_invalid` | wrong code, tries left | `attempts_left` (1–2) | "That code isn’t right. 2 attempts left." |
| `code_expired` | older than 10 minutes | — | "This code has expired" + Send a new code |
| `too_many_attempts` | 3rd wrong try, or any try after | `attempts_left: 0` | "Too many tries" + Send a new code |

Example:
```json
{
  "message": "That code isn’t right.",
  "errors": { "code": ["That code isn’t right."] },
  "code": "code_invalid",
  "attempts_left": 2
}
```

If the email is already verified, return **200** with the user (nothing to do).

## 3a. Change email — `POST /api/email/change`

"Wrong email? Change it" on `/verify-email`. Only while the email is **not verified yet**: replaces the
signed-in user's email, invalidates the old code, and emails a new code to the new address.

Request: `{ "email": "jane.cruz@gmail.com" }`

**200**
```json
{
  "user": { "id": 3, "name": "Jane Cruz", "email": "jane.cruz@gmail.com", "email_verified_at": null },
  "verification": { "expires_in": 600, "resend_in": 60 }
}
```
The page shows the new address and restarts both timers from `verification`.

**422**
| Field | When | Message |
|---|---|---|
| `email` | another account has it | This email is already registered. |
| `email` | format | Enter a valid email address. |
| `email` | same as now | That’s already your email. |

**403** — the email is already verified: `{ "message": "Your email is already verified.", "code": "already_verified" }`.
**429** — more than 6 changes a minute (route throttle). Missing email: "Enter your new email."

If the code email can't be sent, the change is still saved (as at sign-up): the user can resend.

## 4. Resend verification code — `POST /api/email/resend`

Emails a new code to the signed-in user and invalidates the previous one. Request: `{ "email": "…" }`
(ignored). An already verified user gets **200** `{ "message": "Your email is already verified." }` and no email.

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
Uses Laravel's password broker. The email (`PasswordResetLinkMail`, same mailer as the codes) contains a
link to the frontend, valid for **60 minutes**, once:
`{FRONTEND_URL}/reset-password?token={token}&email={urlencoded email}`

**422** — `email`: "Enter your email." / "Enter a valid email address."

**429** — one request per email every **5 minutes** (also for emails without an account):
`{ "message": "Too many requests.", "retry_after": 298 }`

(Mock only: the mock also returns `demo_reset_url` so testers can open the link without email. The real API
doesn't, and the page only shows that button while mocking. On a 404 or 5xx the page says "Password reset
isn’t available yet" / "Something went wrong on our side".)

## 6. Reset password — `POST /api/reset-password`

Request:
```json
{ "token": "…", "email": "jane.cruz@gmail.com", "password": "N3wPass!2026", "password_confirmation": "N3wPass!2026" }
```

Rules: password min 8, letters **and** numbers, confirmed, and not the user's current password.
Token works once and expires after 60 minutes. A rejected password (e.g. the current one) leaves the token usable.

**200** — does **not** sign in: the user logs in next, with the emailed log in code. Other sessions stay
signed in.
```json
{ "message": "Your password is updated." }
```

**422**
| Field | When | Message |
|---|---|---|
| `token` | expired, used, or doesn't match the email | This reset link has expired. Ask for a new one. |
| `token` / `email` | missing from the link | This reset link has expired. Ask for a new one. |
| `password` | reused current password | Choose a password you haven’t used on Khameo before. |
| `password` | too short | Use at least 8 characters. |
| `password` | no letter or no number | Use a mix of letters and numbers. |
| `password_confirmation` | missing / mismatch | Re-enter your password. / Passwords don’t match. |

## 7. Current user — `GET /api/user`

Called once when the app starts, to find out who is signed in (from the Sanctum session cookie).

**200** — the user object. **401** — nobody is signed in (a normal answer, not an error screen).
Any other failure (network, 5xx) shows "We couldn’t load Khameo" with a Retry button.

## 8. Log out — `POST /api/logout`

Ends the session. **204**, no body. The frontend forgets the user even if this request fails.

---

## 9. Google sign-in — popup (not built yet: mocked, `GOOGLE_USE_MOCK`)

Laravel (Socialite) web routes, not under `/api`. The frontend opens them in a **popup** from the Google
button on `/login` (intent `login`) and `/signup` (intent `signup`, only after both boxes are ticked):

```
window.open('/auth/google/redirect?intent=login')
window.open('/auth/google/redirect?intent=signup&confirmed_age=1&accepted_terms=1')
```
(`VITE_API_URL` is prepended in production. In dev, Vite proxies `/auth/google/redirect` and
`/auth/google/callback` to Laravel; not all of `/auth`, because `/auth/google/done` is a React page.)

1. `GET /auth/google/redirect` — keep `intent` (and for sign-up the two flags) in the session, then
   redirect to Google. Please send `prompt=select_account`, so "Use a different Google account" really
   shows the account chooser.
2. `GET /auth/google/callback` — finish with Google, then redirect the **popup** to
   `{FRONTEND_URL}/auth/google/done?status={status}&email={google email, urlencoded}`:

| `status` | When | Session |
|---|---|---|
| `success` | intent `login`: a Khameo account has this Google account (or its email). intent `signup`: new account created (`email_verified_at` = now, name and photo from Google, `terms_accepted_at` = now) | **started** |
| `cancelled` | the user closed or denied the Google screen | none |
| `not_registered` | intent `login`, no Khameo account for this Google account | none |
| `already_in_use` | intent `signup`, an account already has this Google account or email | none |

`email` is optional but lets the screens show which Google account was used.

The `/auth/google/done` page posts `{ type, status, email }` to the window that opened it (same origin
only) and closes. The main window then, on `success`, calls `GET /api/user` (section 7) and shows
"Welcome, {first name}"; Continue goes to the user's next step. **No email code** for Google log in.
If the popup has no opener (opened as a tab), `/auth/google/done` goes to `/login?google={status}`.

Sign-up through Google must refuse to create an account unless `confirmed_age=1` and `accepted_terms=1`
came with the redirect (users must be 18+).

---

## Session and redirect rules

Implemented in `Frontend/src/app/` (`AuthProvider`, `RedirectIfAuthenticated`, `RequireAuth`,
`RequireOnboarded`, `authRedirect.js`). A signed-in user's **next step** (`nextStepFor`) is:

1. `email_verified_at` is null → `/verify-email`
2. else `recording_consent_at` is null → `/onboarding/consent`, unless they chose "Not now" since logging in
3. else `onboarded_at` is null → `/onboarding`
4. else → `/home`

"Not now" on the consent screen continues to the next step (`/onboarding` for a new account). It lasts
until the next log in, so a user without consent is asked again each time they log in.

The flows:
- **Email log in**, verified account → `/login/verify` (emailed code) → next step.
- **Email log in**, unverified account → signed in → `/verify-email` → next step.
- **Google log in** → no code → "Welcome" → next step.
- **New account**, email → `/verify-email` → `/onboarding/consent` → `/onboarding` → `/home`.
- **New account**, Google (already verified) → "Welcome" → `/onboarding/consent` → `/onboarding` → `/home`.

| Route group | Routes | Signed out | Signed in |
|---|---|---|---|
| Open | `/terms`, `/privacy`, `/auth/google/done` | show the page | show the page |
| Public | `/`, `/welcome`, `/login`, `/login/verify`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` | show the page | go to the next step; `/verify-email` itself stays open for unverified users. After logging in, a user sent to `/login` from a protected page goes back to that page. `/login/verify` without a log in in progress → `/login`. |
| Signed in | `/onboarding` and the steps under it (see `docs/api-onboarding.md`) | → `/login` | unverified → `/verify-email`; already onboarded → `/home` (consent, Ready and the tour stay open) |
| Signed in + set up | `/home` (and future app pages) | → `/login` (remembers the page) | any next step other than `/home` → that step |

`/verify-email` → "← Back" asks "Go back? You'll be logged out and can finish verifying later by
logging in.", then logs out and goes to `/welcome`.

What this means for the backend:
- `register` signs the user in (unverified) so `/verify-email` works right after sign-up.
- `login` checks the password; for a verified account it signs nobody in and `login/two-factor` does.
- Unverified users are signed in by `login` directly; the frontend sends them to `/verify-email`.
- Google `success` starts the session in the callback (section 9).
- `reset-password` does not sign in.
- `PATCH /api/user/onboarding` sets `onboarded_at` when onboarding finishes (`docs/api-onboarding.md`).

---

## Open questions for Russel

1. ~~Verify/resend: session or `email`?~~ — the session (signed-in user); `email` is ignored.
2. ~~Login of an unverified account~~ — decided in rev 3: login succeeds, the frontend redirects to /verify-email. Shout if the backend needs it the other way.
3. ~~Google sign-in flow~~ — decided in rev 6: popup flow, section 9. Google log in skips the email code.
4. ~~`reset-password` skipping the code~~ — decided in rev 6: it no longer signs in.
5. ~~`UserResource` fields~~ — done in rev 7.
6. Change email (3a) is allowed only before verifying (403 `already_verified` after). Changing it later
   belongs in Settings, with a code to the new address.
7. Login lockout (5 tries / 15 min) counts per email **and IP**; the code step has its own 3 tries per code.
   OK, or should wrong codes also count towards the lockout?
