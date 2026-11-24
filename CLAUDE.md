# KHAMEO

AI-assisted English public-speaking practice platform. BS Computer Science thesis project, ACLC College of Sta. Maria. Responsive web app (no native mobile app).

Team: Jenny (leader, analyst, AI engineer) · Russel (backend) · Arvhie (frontend) · Josh (QA).

## Repo layout

```
KhameoWeb/
├── Backend/    Laravel API only (no Blade views), Sanctum cookie auth, PostgreSQL on Supabase
├── Frontend/   React + Vite, JavaScript (not TypeScript), Tailwind CSS v4
└── docs/       API contracts (docs/api-*.md), ERD, SRS notes
```

Frontend and Backend never import from each other. They talk only over HTTP/JSON.

## Frontend conventions

- Feature-based folders: `src/features/<feature>/` holds `pages/`, `components/`, `<feature>.api.js`.
- Shared UI goes in `src/components/ui/` (Button, Input, Card, Modal, Toast, ConfirmDialog). Layout pieces (Sidebar, MobileTabBar, PageHeader) go in `src/components/layout/`.
- Routing in `src/app/router.jsx`. Guards: `RequireAuth` (logged out → /login), `RequireOnboarded` (not onboarded → /onboarding).
- HTTP client: `src/lib/api.js` (axios, `withCredentials: true`, `withXSRFToken: true`, baseURL from `VITE_API_URL`, empty in dev). Always call `/sanctum/csrf-cookie` before POST requests to auth endpoints.
- Dev server proxies `/api` and `/sanctum` to `http://localhost:8000` (see `vite.config.js`), so use relative paths like `/api/login`.
- Mock data lives in `src/mockdata/` and must use the exact field names from the API contract in `docs/`.
- JavaScript only: `.js` / `.jsx` files. Do not add TypeScript.

## Design system (match the Figma prototype)

- Colors: brand `#285755`, brand-dark `#154A42`, accent `#FD8B47`, ink `#1A2320`, muted `#59625E`, canvas `#F6F5F2`, white cards.
- Fonts: Cal Sans for headings, Geist for body.
- Cards: 16–18px radius. Generous whitespace. Real app screenshots, no stock photos.
- Tokens are defined with `@theme` in `src/styles/index.css`; use Tailwind classes like `bg-brand`, `text-ink`, `font-display`.
- Use the term "Real Time Rehearsal" (never "Live Rehearsal").
- Crucial actions (delete, archive, remove, publish, decline) always ask for confirmation first.

## How we build each feature

1. API contract first: `docs/api-<feature>.md`, agreed with Russel.
2. Mock data in the contract's exact shape.
3. `<feature>.api.js` returns the mock until the real endpoint is ready.
4. Build pages with shared UI components.
5. Every data screen handles four states: loading, empty, error (with Retry), success.
6. Responsive: check at 390px, 768px and 1440px.
7. Swap mock for real API in the `.api.js` file only.
8. Pull request; Josh tests against the contract.

## Product rules to respect in UI

- Users must be 18+ (sign-up has a required "I am 18 or older" checkbox plus Terms and Privacy checkbox).
- Group roles are per group: Primary Host, Co-Host, Coach, Member.
- Coach activities need Co-Host or Primary Host approval. Deadlines lock activities; no late submissions.
- Results publish only after every submission is graded.
- Audio is stream-only; no audio downloads.

## Git

- Work on feature branches: `feature/<name>`. Never commit straight to `main`.
- Commit messages: `feat(landing): hero section`, `fix(auth): show 422 errors under fields`.
- Never commit `.env` files; update `.env.example` instead.

## Commands

- Frontend: `cd Frontend && npm install && npm run dev` (http://localhost:5173)
- Backend: `cd Backend && composer install && php artisan migrate && php artisan serve` (http://localhost:8000)