# 🚀 Project Setup & Running Guide

This guide explains how to install prerequisites and run the complete **People's Priority** application locally on both **Mac/Linux** and **Windows**.

The application requires 4 separate terminal windows to run all its moving parts simultaneously.

---

## 🛠️ Step 1: Install Prerequisites

### 🍎 For Mac / Linux
1. **Node.js:** Install via Homebrew: `brew install node`
2. **Python:** Install via Homebrew: `brew install python`
3. **Redis:** Install via Homebrew: `brew install redis`
4. **Git:** `brew install git`

### 🪟 For Windows
1. **Node.js:** Download and install the Windows Installer from [nodejs.org](https://nodejs.org/).
2. **Python:** Download from [python.org](https://www.python.org/downloads/windows/). *(Important: Check the box "Add Python to PATH" during installation).*
3. **Redis:** Redis doesn't natively support Windows officially. You have two options:
   - **Option A (Recommended):** Install Windows Subsystem for Linux (WSL). Open PowerShell as Administrator and run `wsl --install`. Then open your WSL terminal (Ubuntu) and run `sudo apt update && sudo apt install redis-server`.
   - **Option B:** Download [Memurai](https://www.memurai.com/) (a Windows-native Redis alternative that works exactly the same).
4. **Git:** Download Git Bash from [git-scm.com](https://git-scm.com/).

---

## 🚀 Step 2: Running the Application (4 Terminals)

### 🟢 Terminal 1: Message Broker (Redis)
Redis is required to queue background AI tasks (like Gemini API calls) so the main server doesn't freeze.
- **Mac/Linux:** Open terminal and run `redis-server`
- **Windows (WSL):** Open WSL terminal and run `redis-server`
- **Windows (Memurai):** It usually runs automatically as a background service. If not, search for "Memurai" in your start menu and run it.

*(Leave this terminal running in the background).*

---

### 🟡 Terminal 2: Background Worker (Celery)
Celery listens to Redis and executes the heavy AI tasks.

**For Mac/Linux:**
```bash
cd backend
source venv/bin/activate
celery -A core worker -l info
```

**For Windows (PowerShell/CMD):**
```powershell
cd backend
venv\Scripts\activate
celery -A core worker -l info -P eventlet
```
*(Note for Windows users: You may need to install eventlet first by running `pip install eventlet` if Celery crashes on Windows).*

*(Leave this terminal running in the background).*

---

### 🔵 Terminal 3: Backend API Server (Django)
This is the main API server that powers the frontend.

**For Mac/Linux:**
```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver
```

**For Windows (PowerShell/CMD):**
```powershell
cd backend
venv\Scripts\activate
python manage.py migrate
python manage.py runserver
```
*(The server will run on `http://localhost:8000`)*

---

### 🟠 Terminal 4: Frontend Web App (React)
This is the citizen and admin user interface.

**For Both Mac & Windows:**
```bash
cd frontend
npm install   # (Run this only the first time)
npm run dev
```
*(The React app will open on `http://localhost:5173`)*

---

## ⚠️ Important Notes
- Always make sure **Redis is running BEFORE** you start the Celery worker.
- If you wipe your database or pull new code, run `python manage.py migrate` and `python manage.py create_demo_users` in Terminal 3 to recreate the demo Admin and Citizen accounts.
