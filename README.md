# 🎯 Resume Analyzer - AI-Powered Career Guidance Platform

> Analyze your resume, identify skill gaps, and get a personalized 90-day learning roadmap to land your dream job.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**Resume Analyzer** is a full-stack AI-powered platform that helps students and job seekers:
- **Analyze** their resume against target job roles
- **Identify** critical skill gaps preventing them from getting hired
- **Generate** personalized 90-day learning roadmaps
- **Track** progress and improve ATS (Applicant Tracking System) scores

**Target Users:** College students, recent graduates, career switchers

---

## ✨ Features

### Core Features
- 📄 **Smart Resume Parsing** - Extract skills, experience, and education from PDF/DOCX
- 🤖 **AI-Powered Analysis** - Claude AI analyzes resume vs job requirements
- 📊 **Skill Gap Detection** - Identifies critical, important, and nice-to-have gaps
- 🎯 **Match Score** - Shows percentage match with target role
- 🗺️ **90-Day Roadmap** - Personalized learning path with resources
- 📈 **ATS Score** - Optimize resume for applicant tracking systems
- 🔄 **Progress Tracking** - Mark skills as learned, track improvement

### Additional Features
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 🔍 **Job Role Library** - Browse 50+ curated job roles
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI:** Anthropic Claude API (Sonnet 4.5)
- **Authentication:** JWT (JSON Web Tokens)
- **File Parsing:** pdf-parse, mammoth
- **Validation:** Joi
- **Logging:** Winston

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** Zustand
- **Server State:** React Query
- **Styling:** Tailwind CSS
- **UI Components:** Headless UI
- **Charts:** Recharts
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios

### DevOps
- **Version Control:** Git
- **Backend Hosting:** Railway / Render
- **Frontend Hosting:** Vercel
- **Database:** MongoDB Atlas

---

## 📁 Project Structure

```
resume-analyzer/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database, Redis, Claude config
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, error handling, uploads
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (parsers, AI)
│   │   ├── utils/          # Helper functions
│   │   ├── validators/     # Request validation
│   │   ├── app.js         # Express app
│   │   └── server.js      # Server entry point
│   ├── uploads/           # Resume uploads
│   ├── logs/             # Application logs
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── assets/        # Images, icons
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Helper functions
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   └── package.json
│
├── package.json           # Root scripts
└── README.md             # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB:** Local installation or MongoDB Atlas account
- **Anthropic API Key:** Get from [console.anthropic.com](https://console.anthropic.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/riteshkhilari/resume-analyzer.git
   cd resume-analyzer
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/resume_analyzer
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. **Create required folders**
   ```bash
   cd backend
   mkdir -p uploads/resumes logs
   ```

---

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 5000) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `CLAUDE_MODEL` | Claude model name | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

---

## 💻 Running the Project

### Development Mode

**Run both frontend and backend:**
```bash
# From root directory
npm run dev
```

**Run individually:**
```bash
# Backend only (from backend/)
npm run dev

# Frontend only (from frontend/)
npm run dev
```

### Production Mode

**Build:**
```bash
npm run build
```

**Start:**
```bash
npm start
```

### Accessing the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **API Health Check:** http://localhost:5000/health

---

## 📚 API Documentation

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Resumes
- `POST /api/v1/resumes/upload` - Upload resume
- `GET /api/v1/resumes` - Get all user resumes
- `GET /api/v1/resumes/:id` - Get single resume
- `DELETE /api/v1/resumes/:id` - Delete resume

### Analysis
- `POST /api/v1/analysis/analyze` - Analyze resume vs job role
- `POST /api/v1/analysis/compare-roles` - Compare multiple job roles
- `GET /api/v1/analysis` - Get all analyses
- `GET /api/v1/analysis/:id` - Get single analysis

### Roadmap
- `POST /api/v1/roadmap/generate` - Generate learning roadmap
- `GET /api/v1/roadmap/:id` - Get roadmap
- `PUT /api/v1/roadmap/:id/complete-item` - Mark item complete

### Job Roles
- `GET /api/v1/job-roles` - Get all job roles
- `GET /api/v1/job-roles/search` - Search job roles
- `GET /api/v1/job-roles/:id` - Get job role details

---

## 🚢 Deployment

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)

1. Create free cluster
2. Get connection string
3. Add to backend `.env`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Ritesh Khilari**
- Portfolio: [riteshkhilari.in](https://riteshkhilari.in)
- GitHub: [@riteshkhilari](https://github.com/riteshkhilari)
- LinkedIn: [riteshkhilari](https://linkedin.com/in/riteshkhilari)

---

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI API
- [MongoDB](https://mongodb.com) for database
- [Vercel](https://vercel.com) for frontend hosting
- [Railway](https://railway.app) for backend hosting

---

## 📧 Support

For support, email riteshkhilari@example.com or open an issue in the repository.

---

Made with ❤️ by Ritesh Khilari
