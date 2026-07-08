# 🗳️ People's Priority

> **Apni Awaaz, Apne Neta Tak** — *Your Voice, To Your Leader*

**People's Priority** is an AI-powered civic complaint platform that bridges the gap between citizens and their elected representatives. Citizens submit issues (text, voice, or photo) in their local language, and an AI engine clusters, scores, and surfaces the most critical problems directly to their MP's dashboard — turning 1,000 scattered complaints into 10 actionable, prioritised issues.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [AI Pipeline](#-ai-pipeline)
- [Team & Tasks](#-team--tasks)
- [Contributing](#-contributing)

---

## ✨ Features

### 👥 Citizen Side
| Feature | Description |
|---|---|
| 🎙️ **Voice Reports** | Submit complaints in Hindi, Marathi, or English — speech is transcribed via Gemini AI |
| 📸 **Photo Reports** | Upload photos; Gemini Vision validates the civic issue and rejects irrelevant images |
| ⌨️ **Text Reports** | Classic text-based complaint submission |
| 📍 **Auto-Location** | GPS auto-fills ward/village name via reverse geocoding |
| 👍 **"Me Too" Feed** | Browse existing clusters within a 2 km radius and upvote instead of creating duplicates |
| 📊 **Real-time Tracking** | 4-step visual timeline: Received → AI Verified → Forwarded → Resolved |
| 📱 **PWA Support** | Install directly on mobile without an app store |
| 🔌 **Offline-First** | Complaints queued locally and auto-synced when connectivity returns |

### 👑 MP / Admin Dashboard
| Feature | Description |
|---|---|
| 🗺️ **Interactive Heatmap** | 3D map with red zones indicating high-severity clusters |
| 🤖 **AI Priority Report** | Ranked list of AI-clustered issues, not raw complaints |
| 📰 **Weekly AI Summary** | Auto-generated MP newsletter from Gemini ("This week your constituency saw…") |
| 📋 **Kanban Routing** | Approve AI-suggested department routing (PWD, Jal Board, etc.) with one click |
| ⚡ **Auto-Escalation** | Issues unresolved for > 7 days trigger automatic SMS alerts |
| 📄 **PDF Reports** | One-click PDF or WhatsApp export of the weekly summary |

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | Django 6.x + Django REST Framework |
| Database | PostgreSQL + PostGIS (geospatial indexing) |
| Cache & Queue | Redis |
| Async Workers | Celery 5.x |
| AI Engine | Google Gemini API (`google-genai`) |
| Auth | JWT via `djangorestframework-simplejwt` |
| Media Storage | Cloudinary |
| PDF Generation | ReportLab |
| WebSockets | `websockets` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 (Vite) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Routing | React Router v7 |
| HTTP | Axios |
| Icons | Lucide React |
| Maps | React Mapbox GL |
| Voice | Web Speech API |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CITIZEN / MP BROWSER                     │
│                     React + Vite (Port 5173)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST / JWT
┌──────────────────────────▼──────────────────────────────────────┐
│                   Django REST Framework (Port 8000)             │
│   /auth/   /complaints/   /clusters/   /admin/   /analysis/     │
└────────────┬────────────────────────────┬───────────────────────┘
             │ Celery Tasks               │ PostGIS Queries
┌────────────▼──────────┐   ┌────────────▼───────────────────────┐
│   Redis (Broker)      │   │        PostgreSQL + PostGIS         │
│   + Response Cache    │   │   Users / Complaints / Clusters     │
└────────────┬──────────┘   └────────────────────────────────────┘
             │
┌────────────▼──────────┐   ┌────────────────────────────────────┐
│   Celery Workers      │──▶│        Google Gemini API           │
│   (AI Pipeline)       │   │  Clustering / Scoring / Summaries  │
└───────────────────────┘   └────────────────────────────────────┘
```

### AI Complaint Pipeline (Step by Step)

```
Citizen submits complaint
        │
        ▼
Pre-processing ──▶ Voice? ──▶ Speech-to-Text (Gemini)
                 └ Photo? ──▶ Vision validation (is this a civic issue?)
        │
        ▼
Pushed to Celery Queue  (instant 200 OK to user)
        │
        ▼
PostGIS radius query  →  Get all nearby complaints (2 km)
        │
        ▼
Gemini LLM clustering  →  "Same physical issue?" → assign Cluster ID / create new
        │
        ▼
Severity Score (1–10)  →  Keywords + cluster volume
        │
        ▼
Database update  →  MP dashboard updated in real-time
```

---

## 📁 Project Structure

```
Peoples_Priority/
├── backend/                    # Django application
│   ├── core/                   # Project settings, Celery config, URL root
│   ├── api/                    # Shared API utilities
│   ├── authentication/         # JWT auth, user model (Citizen / Admin / MP)
│   ├── complaints/             # Complaint model, views, serializers
│   ├── analysis/               # AI clustering, severity scoring, Gemini tasks
│   ├── data_collection/        # Geospatial queries, PostGIS helpers
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                    # Environment variables (not committed)
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Screen-level components
│   │   ├── store/              # Zustand state stores
│   │   └── api/                # Axios API client
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend_design_and_architecture.md
├── citizenDashboard.md         # Citizen API specification
├── admin_api_endpoints_needed.md
├── frontend_design_with_flow.md
├── team_tasks.md
└── setup.md
```

---

## 🚀 Getting Started

The application requires **4 terminal windows** running simultaneously.

### Prerequisites

#### macOS / Linux
```bash
brew install node python redis git
```

#### Windows
1. **Node.js** — [nodejs.org](https://nodejs.org/)
2. **Python** — [python.org](https://www.python.org/downloads/windows/) *(check "Add Python to PATH")*
3. **Redis** — Use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) (`sudo apt install redis-server`) or [Memurai](https://www.memurai.com/)
4. **Git** — [git-scm.com](https://git-scm.com/)

---

### Step 1 — Clone & Configure

```bash
git clone <repo-url>
cd Peoples_Priority
```

Copy the example env file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

Required environment variables:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True

DATABASE_URL=postgres://user:password@localhost:5432/peoples_priority

REDIS_URL=redis://localhost:6379/0

GEMINI_API_KEY=your-google-gemini-api-key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

---

### Step 2 — Backend Setup

```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py create_demo_users   # Seeds demo Admin & Citizen accounts
```

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
```

---

### Step 4 — Run (4 Terminals)

| Terminal | Command | Purpose |
|---|---|---|
| 🟢 **1 — Redis** | `redis-server` | Message broker for Celery |
| 🟡 **2 — Celery** | `celery -A core worker -l info` (Linux/Mac) <br> `celery -A core worker -l info -P eventlet` (Windows) | Background AI task worker |
| 🔵 **3 — Django** | `python manage.py runserver` | REST API server |
| 🟠 **4 — React** | `npm run dev` | Frontend dev server |

> ⚠️ **Important**: Start Redis *before* the Celery worker. If you reset the database, re-run `python manage.py migrate` and `python manage.py create_demo_users`.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

---

## 📡 API Reference

All API endpoints are prefixed with `/api/v1/`. Every protected route requires:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Citizen Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/auth/me/` | Get logged-in citizen profile |
| `POST` | `/complaints/` | Submit a new complaint (text / voice / photo) |
| `POST` | `/complaints/upload-media/` | Upload photo or audio file (returns CDN URL) |
| `GET` | `/complaints/my/` | Fetch citizen's own complaint history |
| `GET` | `/complaints/{id}/` | Single complaint detail with 4-step timeline |
| `GET` | `/clusters/nearby/` | Fetch active clusters within a radius |
| `POST` | `/clusters/{id}/upvote/` | "Me Too" — toggle upvote on a cluster |
| `GET` | `/geo/reverse/` | Reverse geocode lat/lon to city name |

> Full request/response schemas are documented in [`citizenDashboard.md`](./citizenDashboard.md) and [`admin_api_endpoints_needed.md`](./admin_api_endpoints_needed.md).

### Complaint Submission — Quick Example

```json
POST /api/v1/complaints/
{
  "text": "Huge pothole near main crossing causing accidents at night.",
  "category": "Roads",
  "type": "text",
  "latitude": 19.11548,
  "longitude": 72.87552
}
```

```json
// Response 201 Created
{
  "id": "c_r3k9mxyz",
  "status": "Pending",
  "ai_result": {
    "severity_score": 8.9,
    "sentiment": "Highly Negative",
    "department_assigned": "PWD",
    "cluster_id": "cl1",
    "cluster_title": "Road Condition in Andheri East",
    "is_duplicate": false,
    "priority_rank": 2
  }
}
```

---

## 🤖 AI Pipeline

### Clustering Logic
The backend uses **PostGIS spatial queries** to find all complaints within a 2 km radius, then sends the batch to Gemini with a structured prompt:

> *"Here is a new complaint and a list of existing issues. Does this new complaint describe the exact same physical problem as any existing issue? If yes, return the Cluster ID. If no, create a new cluster."*

### Severity Scoring (1–10)
Score is calculated from:
- 🔑 **Keywords** — e.g., "accident", "bleeding", "dangerous" increase score
- 👥 **Volume** — number of citizens in the cluster
- 😠 **Sentiment** — Gemini-inferred emotional tone

### Advanced Features
| Feature | How it Works |
|---|---|
| **Auto-Escalation** | Nightly cron job — unresolved high-severity clusters (> 7 days) SMS the MP's office |
| **Duplicate Prevention** | Before form submission, backend returns nearby similar complaints so citizens upvote instead |
| **Fake Image Detection** | Gemini Vision rejects non-civic photos (selfies, random objects) |
| **Weekly AI Report** | Weekend Celery task compiles 7-day data → Gemini generates 2-paragraph summary → emailed as PDF |
| **Redis Dashboard Cache** | MP dashboard stats cached every 5 minutes — loads in < 100 ms even at 100k complaints |

---

## 🗄️ Database Schema (Key Models)

```
User          ─── phone_number (PK auth), role (Citizen/Admin/MP), language
Complaint     ─── user_id, raw_text, audio_url, photo_url, location (PostGIS Point)
                   ai_category, cluster_id (FK → IssueCluster)
IssueCluster  ─── cluster_title (AI generated), center_location, severity_score
                   sentiment_score, status (Pending/Forwarded/Resolved), department
```

---

## 👥 Team & Tasks

See [`team_tasks.md`](./team_tasks.md) for individual assignments and progress tracking.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project was built for a hackathon. All rights reserved.

---

<p align="center">
  Built with ❤️ for citizens who deserve to be heard.
</p>
