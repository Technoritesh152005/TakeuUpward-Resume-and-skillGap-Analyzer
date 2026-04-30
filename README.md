# AI-Powered Resume Maker and Skill Gap Analyzer

Full-stack career guidance platform that lets users upload resumes, parse and analyze them against target job roles, identify skill gaps, improve ATS readiness, generate structured learning roadmaps, and discover relevant jobs.

## Overview

This project combines:

- A React frontend for resume upload, analysis review, roadmap tracking, dashboard insights, authentication, and profile management
- An Express backend for auth, resume parsing, AI analysis, roadmap generation, dashboard APIs, and job role data
- MongoDB for core application data
- Redis + BullMQ for background processing of analysis and roadmap jobs
- Gemini-based AI workflows for skill-gap analysis, ATS scoring, and roadmap generation
- OCR fallback support for difficult resume files

The main user flow is:

1. User signs up or logs in
2. User uploads a PDF or DOCX resume
3. Backend parses the resume and stores structured data
4. User selects a target job role and creates an analysis
5. Analysis runs asynchronously through BullMQ workers
6. User reviews match score, strengths, gaps, ATS score, readiness, and recommendations
7. User generates a personalized roadmap and tracks progress over time

## Core Features

- Resume upload with PDF and DOCX validation
- Resume parsing with native extraction plus OCR fallback
- AI-generated skill gap analysis against job roles
- ATS scoring with keyword, structure, formatting, and content breakdown
- Readiness scoring and closest winnable role suggestions
- Multi-role comparison for a single resume
- Personalized roadmap generation from completed analysis
- Roadmap progress tracking and completion state
- Dashboard summaries and recent activity
- Job role catalog with category, slug, similar-role, and trending endpoints
- Recommended live jobs based on completed analysis
- Email-based password reset flow
- Google OAuth login support
- JWT auth with refresh-token flow and cookie-based session continuity

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Zustand
- TanStack Query
- Axios
- React Hook Form + Zod
- Recharts
- Framer Motion
- Headless UI
- Lucide React

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- Redis
- BullMQ
- Joi validation
- Multer
- Passport + Google OAuth 2.0
- JWT
- Winston + Morgan
- Helmet
- CORS
- Compression
- express-mongo-sanitize

### AI and Parsing

- Google Gemini (`@google/generative-ai`)
- Anthropic SDK present in dependencies
- Groq SDK present in dependencies
- `pdf-parse` for PDF extraction
- `mammoth` for DOCX extraction
- Python OCR fallback script for scanned/poor-text resumes
- `tesseract.js` and AWS Textract SDK packages are present in the project dependencies

## Architecture

### Frontend

The frontend lives in `frontend/` and contains:

- Public pages: landing, login, signup, forgot/reset password, OAuth callback
- Protected pages: dashboard, resumes, upload, analysis, roadmap, job roles, profile
- API service layer for auth, resume, analysis, roadmap, job role, and dashboard requests
- React Query for server-state handling
- Zustand stores for auth/theme state

### Backend

The backend lives in `Backend/` and contains:

- Route layer for auth, resumes, analysis, roadmaps, job roles, user, dashboard, and Google auth
- Controller layer for request handling
- Service layer for AI workflows, parsing, OCR, quota control, job recommendations, and roadmap logic
- MongoDB models for users, resumes, analyses, roadmaps, progress, tokens, resources, and job roles
- BullMQ queues and workers for long-running AI tasks

### Background Jobs

Analysis and roadmap generation are asynchronous. The backend starts workers during server boot:

- `analysis-generation`
- `roadmap-generation`

This means local development requires Redis to be running if you want analysis and roadmap creation to work.

## Repository Structure

```text
.
|-- Backend/
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- queues/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- validation/
|   |   `-- workers/
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- communication/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- store/
|   |   `-- utils/
|   `-- package.json
|-- package.json
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance
- Redis instance
- Gemini API key

Optional but recommended depending on features used:

- Python installed and available on `PATH` for OCR fallback
- Google OAuth credentials
- Resend API key for password reset emails
- Adzuna API credentials for job recommendations

### Install Dependencies

From the repository root:

```bash
npm install
cd Backend && npm install
cd ../frontend && npm install
```

## Environment Variables

Create `Backend/.env` and `frontend/.env`.

### Backend `.env`

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

DATABASE_URL=mongodb://127.0.0.1:27017/resume_analyzer
REDIS_URL=redis://127.0.0.1:6379

CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

ACCESS_TOKEN_SECRET=replace_with_secure_value
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=replace_with_secure_value
REFRESH_TOKEN_EXPIRY=7d

GEMINI_API_KEY=your_primary_key
GEMINI_API_KEY_2=your_secondary_key_optional
GEMINI_API_KEY_3=your_fallback_key_optional
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

RESEND_API_KEY=
MAIL_FROM=your-name <noreply@example.com>

ADZUNA_APP_ID=
ADZUNA_API_KEY=
ADZUNA_COUNTRY=in

MAX_FILE_SIZE=10485760
OCR_FALLBACK_ENABLED=false
PYTHON_PATH=python
LOG_LEVEL=info
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

Notes:

- The frontend normalizes `VITE_API_URL` automatically to `/api/v1`, so `http://localhost:5000` is valid.
- `frontend/vite.config.js` also proxies `/api` to `http://localhost:5000` during local development.
- If Google OAuth is not configured, Google sign-in routes remain unavailable.
- If `OCR_FALLBACK_ENABLED=true`, ensure Python is installed and `Backend/src/scripts/ocr_resume.py` can run successfully.

## Running the Project

### Start Both Frontend and Backend

From the root:

```bash
npm run dev
```

This runs:

- Backend via `npm run dev --prefix Backend`
- Frontend via `npm run dev --prefix frontend`

### Run Individually

Backend:

```bash
cd Backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### Default Local URLs

- Frontend: `http://localhost:3000`
- Backend root: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- API base: `http://localhost:5000/api/v1`

## Build and Production

The root `package.json` only provides development orchestration. Production build commands are run per app.

Frontend build:

```bash
cd frontend
npm run build
npm run preview
```

Backend production start:

```bash
cd Backend
npm start
```

## Seed Scripts

The backend includes seed scripts for job roles and learning resources:

```bash
cd Backend
npm run seed:roles
npm run seed:resources
npm run seed:all
```

These require `DATABASE_URL` to be configured.

## API Overview

Base prefix: `/api/v1`

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `GET /auth/me`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/google/failure`

### Resumes

- `POST /resumes/upload`
- `GET /resumes`
- `GET /resumes/:id`
- `GET /resumes/:id/file`
- `GET /resumes/:id/summary-skills`
- `PUT /resumes/:id/resume-reparse`
- `DELETE /resumes/:id`

### Analysis

- `POST /analysis/create-analysis`
- `POST /analysis/compare-roles`
- `GET /analysis/all-analysis`
- `GET /analysis/:id/status`
- `GET /analysis/:id/recommended-jobs`
- `GET /analysis/:id`
- `PUT /analysis/:id`
- `DELETE /analysis/:id`

### Roadmaps

- `POST /roadmap`
- `GET /roadmap`
- `GET /roadmap/analysis/:analysisId`
- `GET /roadmap/:id/status`
- `GET /roadmap/:id`
- `POST /roadmap/:id/retry`
- `GET /roadmap/:id/progress`
- `PUT /roadmap/:id/mark-item-complete`
- `PUT /roadmap/:id/reset-progress`
- `PUT /roadmap/:id/update-preference`
- `DELETE /roadmap/:id`

### Job Roles

- `GET /job-roles`
- `GET /job-roles/search`
- `GET /job-roles/trending-job-roles`
- `GET /job-roles/categories-list`
- `GET /job-roles/job-from-category/:category`
- `GET /job-roles/slug/:slug`
- `GET /job-roles/:id`
- `GET /job-roles/:id/similar-job-roles`

### Dashboard

- `GET /dashboard`
- `GET /dashboard/activities`

## Key Implementation Details

### Resume Processing

- Uploads are stored on disk under `Backend/uploads/resume`
- Supported file types are PDF and DOCX
- File upload size defaults to `10MB` unless overridden
- Parsing uses native extractors first, then OCR fallback when text quality is poor

### AI Analysis

- Analysis jobs run in the background
- Skill-gap analysis and ATS scoring are generated together
- The backend stores strengths, extracted skills, skill gaps, match score, readiness, ATS details, and recommendations
- Gemini key rotation/fallback logic is implemented in the backend config layer

### Roadmaps

- Roadmaps are generated only after analysis is completed
- Roadmap items are normalized and enriched with resources
- If a direct resource is not found, the system generates fallback search links
- User progress is tracked separately and synced with roadmap state

### Auth and Security

- Access token + refresh token flow
- Cookie-aware frontend requests using `withCredentials`
- Helmet, Mongo sanitize, compression, and centralized error handling enabled
- Protected frontend routes and protected backend APIs

## Common Setup Issues

### Analysis or Roadmap jobs are stuck or failing

Check:

- MongoDB is running
- Redis is running
- Gemini API keys are configured
- Backend workers started successfully

### Google login is not working

Check:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- authorized redirect URI in Google Cloud matches the backend callback URL exactly

### Password reset is failing

Check:

- `RESEND_API_KEY`
- `MAIL_FROM`

### OCR fallback is failing

Check:

- `OCR_FALLBACK_ENABLED=true`
- Python is installed
- `PYTHON_PATH` points to a valid Python executable

## Future Improvement Areas

- Add `.env.example` files for frontend and backend
- Add automated tests for API and UI flows
- Add containerized setup with Docker
- Add CI pipeline for linting, testing, and build verification
- Add deployment documentation for frontend, backend, MongoDB, and Redis

## Author

Ritesh Khilari

- GitHub: <https://github.com/riteshkhilari>

## License

MIT
