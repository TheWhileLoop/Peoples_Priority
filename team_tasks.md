# 🚀 Detailed Team Task Distribution: People's Priority App

This document outlines the exact page-wise (Frontend) and route-wise (Backend) breakdown for the team. 

*Note for Backend: The basic Django project (`core`) and app (`api`) are already set up. Your job is to take the routes listed below, write the logic inside the views, and return the exact Expected JSON Response.*

---

## 🎨 Frontend Team (Geetandhi & Abhishek Tayde)

### 1. Geetandhi - Citizen Side Pages (Public App)
**Goal:** Make the citizen experience fast, local, and zero-friction.

*   **Page: `CitizenDashboard.jsx` (Report Hub)**
    *   **UI Required:** 3 massive buttons (Speak, Snap, Type).
    *   **Functionality:** Use Web Speech API for voice recording. Integrate browser Geolocation API to auto-fetch Ward/City name.
*   **Page: `CommunityFeed.jsx` (The "Me Too" Feed)**
    *   **UI Required:** Instagram-style vertical scroll or Tinder-like swipe cards showing existing complaints in the user's area.
    *   **Functionality:** Add a prominent "Mujhe bhi yeh problem hai" (Upvote) button. Hitting this calls the `/upvote/` API.
*   **Page: `SubmissionSuccess.jsx` (Tracking & Confetti)**
    *   **UI Required:** Confetti animation on load. 
    *   **Functionality:** Display the AI's instant response: "AI Priority Score: 🔥 High (340 people affected)". Show a visual timeline (Received -> Verified -> In Progress).

### 2. Abhishek Tayde - Admin Side Pages (Command Center)
**Goal:** Build a beautiful, Bloomberg-terminal style dashboard for the MP/Admin.

*   **Page: `AdminDashboard.jsx` (Main Overview)**
    *   **UI Required:** Dark mode preferred. Top widgets for "Total Active vs Resolved".
    *   **Functionality:** Add a live "AI Pulse" widget showing current public sentiment (e.g., 🔴 Frustrated).
*   **Page: `PriorityReport.jsx` (The Core Feature)**
    *   **UI Required:** Ranked list of **AI Clusters** (not individual complaints).
    *   **Functionality:** Each row shows Rank, Title, Severity Score (e.g., 9.8/10), and Mentions. Clicking a row expands it to show the Gemini AI summary and raw photos/audio below it.
*   **Page: `WeeklySummary.jsx` & `DepartmentKanban.jsx`**
    *   **UI Required:** A beautiful newsletter-style view for the Gemini weekly report. 
    *   **Functionality:** Kanban board (Todo -> PWD, Todo -> Jal Board) where admin can approve AI-suggested routing.

---

## ⚙️ Backend Team (Abhishek Yaduwanshi & Ayush)

**Base URL:** `http://localhost:8000`
*Note: Ensure you are returning these exact JSON structures so the Frontend team doesn't break.*

### 3. Abhishek Yaduwanshi - Gemini AI Engine & Core Logic
**Goal:** Build the "Brain" of the app inside specific API endpoints.

*   **Route:** `POST /api/analyze-complaint/`
    *   **Your Job:** Take the complaint text/audio, send it to Gemini 2.5 Flash via API. Figure out which `IssueCluster` it belongs to, and calculate a severity score out of 10.
    *   **Expected Response:** 
        ```json
        {
          "status": "success",
          "cluster_id": 12,
          "severity_score": 8.5,
          "ai_summary": "Multiple potholes reported in Andheri East causing traffic.",
          "sentiment": "Negative"
        }
        ```
*   **Route:** `GET /api/weekly-summary/`
    *   **Your Job:** Fetch all complaints from the last 7 days from the DB. Send a massive prompt to Gemini to generate a 1-paragraph summary for the MP.
    *   **Expected Response:**
        ```json
        {
          "week_summary": "Honorable MP, we noticed a 20% drop in water complaints this week, but a severe spike in street-light issues in Ward 4. Immediate action recommended."
        }
        ```

### 4. Ayush - Core Endpoints, Database & Storage
**Goal:** Build the "Backbone" to handle file uploads, DB queries, and feed data to the frontend.

*   **Route:** `POST /api/complaints/`
    *   **Your Job:** Receive `multipart/form-data` from frontend (image/audio). Upload the file to Cloudinary. Save the URL and location data to the PostgreSQL database.
    *   **Expected Response:**
        ```json
        {
          "id": 105,
          "message": "Complaint saved successfully",
          "media_url": "https://res.cloudinary.com/.../image.jpg",
          "ward": "Andheri East"
        }
        ```
*   **Route:** `GET /api/clusters/`
    *   **Your Job:** Query the `IssueCluster` model. Order them by `severity_score` descending. This will feed Abhishek Tayde's PriorityReport page.
    *   **Expected Response:**
        ```json
        [
          {
            "id": 1,
            "title": "Road Condition",
            "severity": 9.8,
            "mentions": 450,
            "status": "Pending PWD"
          }
        ]
        ```
*   **Route:** `POST /api/complaints/<id>/upvote/`
    *   **Your Job:** Called when a citizen clicks "Mujhe bhi yeh problem hai" on Geetandhi's feed. Increment the mention count in DB and slightly boost the severity score.
    *   **Expected Response:**
        ```json
        {
          "success": true,
          "new_mentions": 451,
          "new_severity_score": 9.9
        }
        ```
