# KHAMEO

AI-assisted English public-speaking practice platform. BS Computer Science thesis project, ACLC College of Sta. Maria.

## Repository layout

```
KhameoWeb/
├── Backend/    Laravel API (Sanctum cookie auth, PostgreSQL on Supabase)
├── Frontend/   React + Vite (JavaScript), Tailwind CSS v4
└── docs/       API contracts (docs/api-*.md), ERD, SRS notes
```

The frontend and backend communicate only over HTTP/JSON.

## Getting started

### Backend

```bash
cd Backend
composer install
cp .env.example .env   # then fill in database credentials
php artisan key:generate
php artisan migrate
php artisan serve      # http://localhost:8000
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env   # VITE_API_URL can stay empty in development
npm run dev            # http://localhost:5173
```

In development, Vite proxies `/api` and `/sanctum` to `http://localhost:8000`, so run the backend at the same time.

## Contributing

- Branch from `main` as `feature/<name>`; never commit straight to `main`.
- Commit messages: `feat(landing): hero section`, `fix(auth): show 422 errors under fields`.
- Never commit `.env` files; update `.env.example` instead.

See [CLAUDE.md](CLAUDE.md) for frontend conventions and the design system.
