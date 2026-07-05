# ⚙️ Required Backend API Routes for MP/Admin Dashboard (Abhishek Tayde)

This document contains the finalized API contract for the endpoints needed to connect the **Admin Command Center** dashboard with the Django backend. 

Please implement these routes in Django and ensure they return the expected JSON formats.

---

## 🔑 Base Configuration
- **Base URL:** `http://localhost:8000/api`
- **Auth Header:** `Authorization: Bearer <jwt_access_token>`

---

## 🛠️ Complete API List & Specifications

### 1. Overview Statistics
- **Route:** `GET /api/admin/stats/`
- **Controller Method:** `retrieve_stats`
- **Query Parameters (Optional Filters):** `?district=Pune&city=Pune&ward=Ward 4`
- **Why this is needed:**
  This endpoint displays top-level KPIs (Total Complaints, Active AI Clusters, Resolved Issues, and Public Sentiment) at the very top of the Admin Dashboard. Instead of firing separate API requests for each numeric statistic (which causes database query overhead and slows page loads), this single endpoint fetches all simple aggregate metrics in one fast call.
- **Response Format (JSON):**
```json
{
  "total_ingested_reports": 456,
  "active_clusters": 12,
  "resolved_issues": 89,
  "public_sentiment": "🔴 Highly Frustrated"
}
```

---

### 2. Retrieve AI Clusters List (For Heatmap & Priority List)
- **Route:** `GET /api/clusters/`
- **Controller Method:** `list_clusters`
- **Query Parameters (Optional Filters):** `?district=Pune&city=Pune&category=Roads`
- **Why this is needed:**
  This endpoint feeds both the visual Geographical Heatmap and the ranked list of active issues. It returns clusters grouped by spatial similarity (e.g., all pothole reports within a 2km radius). To maximize speed and avoid loading megabytes of data on page load, this API returns only the summary details of each cluster and **excludes** the raw citizen complaints.
- **Response Format (JSON):**
```json
[
  {
    "id": "cl1",
    "title": "Road Condition in Andheri East",
    "category": "Roads",
    "severity_score": 9.8,
    "sentiment": "Highly Negative",
    "status": "Pending",
    "department": "PWD",
    "ward": "Ward 4 - Andheri East",
    "center_latitude": 19.1155,
    "center_longitude": 72.8755,
    "mentions": 450
  }
]
```

---

### 3. Retrieve Specific Cluster Complaints (Optimization Endpoint)
- **Route:** `GET /api/clusters/<cluster_id>/complaints/`
- **Controller Method:** `list_cluster_complaints`
- **Why this is needed:**
  This is a performance-critical optimization endpoint. When the Admin clicks on a specific issue cluster from the list to expand it, this API lazy-loads the individual raw citizen complaints (including raw text, audio files, and photo attachments) associated with that cluster. This ensures that the main dashboard remains lightweight and doesn't crash even if there are thousands of complaints under a cluster.
- **Response Format (JSON):**
```json
[
  {
    "id": "c1",
    "user": "citizen@demo.com",
    "text": "Huge potholes near Andheri East junction. Dangerous at night.",
    "media_url": "https://res.cloudinary.com/demo/image.jpg",
    "audio_url": "https://res.cloudinary.com/demo/voice.mp3",
    "created_at": "2026-07-03T12:00:00Z"
  }
]
```

---

### 4. Update Cluster Status (Cascades to Complaints)
- **Route:** `PATCH /api/clusters/<cluster_id>/`
- **Controller Method:** `update_status`
- **Why this is needed:**
  When the MP's office or staff resolves an issue or starts working on it, this API updates the status of the cluster (e.g., changes status from `Pending` to `In Progress` or `Resolved`). The backend logic must cascade this update to all underlying individual citizen complaints nested inside this cluster.
- **Payload Format (JSON):**
```json
{
  "status": "In Progress"
}
```
- **Response Format (JSON):**
```json
{
  "id": "cl1",
  "status": "In Progress",
  "message": "Cluster status updated successfully. Cascaded updates to nested complaints."
}
```

---

### 5. Re-Route Department (Kanban Board)
- **Route:** `PATCH /api/clusters/<cluster_id>/`
- **Controller Method:** `update_department`
- **Why this is needed:**
  This endpoint powers the drag-and-drop Kanban Board (`DepartmentKanban.jsx`). When an admin drags an issue card to route it to a specific department (like PWD, Jal Board, Waste Management, or Electricity), this API is called to update the assigned department.
- **Payload Format (JSON):**
```json
{
  "department": "Jal Board"
}
```
- **Response Format (JSON):**
```json
{
  "id": "cl1",
  "department": "Jal Board",
  "message": "Routed successfully."
}
```

---

### 6. Gemini AI Weekly Report Summary
- **Route:** `GET /api/weekly-summary/`
- **Controller Method:** `retrieve_weekly_summary`
- **Why this is needed:**
  This endpoint pulls weekly briefings and AI-analyzed insights. Because calling the Google Gemini LLM API to summarize all constituency data from the database is computationally heavy and takes a few seconds, keeping this as a separate API ensures that the main dashboard statistics and map loading remain unaffected.
- **Response Format (JSON):**
```json
{
  "week_date": "July 5, 2026",
  "executive_summary": "Honorable Member of Parliament, this week your constituency experienced a 12% decrease in solid waste complaints, largely due to successful sweeps in Ward 2...",
  "critical_bottleneck": "Andheri East Junction Roads: 450 citizens affected by pothole hazards. Severity rating is 9.8.",
  "successful_resolution": "Sector 3 Bulbs Swapped: Electricity board completed bulb swaps resolving issues for 120 citizens.",
  "sentiment_profile": "Overall public sentiment is currently indexed as Concerned (74% Negative/Neutral sentiment)..."
}
```

---

### 7. PDF Export & WhatsApp Dispatch
- **Download PDF Route:** `GET /api/weekly-summary/download-pdf/` (Returns PDF binary file stream)
- **WhatsApp Dispatch Route:** `POST /api/weekly-summary/send-whatsapp/`
- **Why this is needed:**
  Allows the MP's office to download the weekly performance report as a PDF for official records, or instantly dispatch a formatted text summary/PDF to active WhatsApp groups of departmental heads or alerts lists.
- **WhatsApp Payload:**
```json
{
  "recipient_group_id": "alerts_99"
}
```
- **WhatsApp Response:**
```json
{
  "status": "dispatched",
  "message": "Dispatched successfully."
}
```

---

### 8. Dynamic Filters List (Location & Category)
- **Route:** `GET /api/admin/filters/`
- **Controller Method:** `retrieve_filters`
- **Why this is needed:**
  Populates the filter dropdown selections (Districts, Cities, Wards, and Categories) dynamically based on active entries in the database. This avoids hardcoding dropdown lists on the frontend, ensuring the filters scale automatically as new regions are added.
- **Response Format (JSON):**
```json
{
  "districts": ["Mumbai Suburban", "Pune", "Thane"],
  "categories": ["Roads", "Water Supply", "Waste Management", "Electricity"]
}
```

---

### 9. Admin Authentication (JWT Login)
- **Route:** `POST /api/auth/login/`
- **Controller Method:** `admin_login`
- **Why this is needed:**
  Secures dashboard access. It takes the login credentials of the admin/MP staff and returns a JSON Web Token (JWT) to authorize subsequent API requests.
- **Payload Format (JSON):**
```json
{
  "phone_number": "+919876543210",
  "password": "securepassword"
}
```
- **Response Format (JSON):**
```json
{
  "access": "eyJhbGciOi...",
  "refresh": "eyJhbGciOi...",
  "role": "Admin"
}
```
