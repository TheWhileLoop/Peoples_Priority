# ⚙️ Required Backend API Routes for MP/Admin Dashboard (Abhishek Tayde)

This document contains the API contract for the endpoints needed to connect the **Admin Command Center** dashboard with the Django backend. 

Please implement these routes in Django and ensure they return the expected JSON format.

---

## Base Configuration
- **Base URL:** `http://localhost:8000/api`
- **Auth Header:** `Authorization: Bearer <jwt_access_token>`

---

## 1. Overview Statistics
Used on the main Command Center dashboard to display overview stats and sentiment pulses.

- **Route:** `GET /api/admin/stats/`
- **Controller Method:** `retrieve_stats`
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

## 2. Retrieve AI Clusters List (For Heatmap & Priority List)
Queries groups of complaints clustered by spatial radius (2km) and category, ordered by `severity_score` descending.

- **Route:** `GET /api/clusters/`
- **Query Parameter (Optional filter by ward):** `GET /api/clusters/?ward=Ward 4 - Andheri East`
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
    "mentions": 450,
    "ai_summary": "Severe potholes reported on main arterial roads near Andheri East junction causing high traffic delays and nighttime accidents.",
    "complaints": [
      {
        "id": "c1",
        "user": "citizen@demo.com",
        "text": "Huge potholes near Andheri East junction. Dangerous at night.",
        "media_url": "https://res.cloudinary.com/demo/image.jpg",
        "created_at": "2026-07-03T12:00:00Z"
      }
    ]
  }
]
```

---

## 3. Update Cluster Status (Cascades to Complaints)
Called when the MP office changes a cluster's status (Pending ➡️ In Progress ➡️ Resolved).

- **Route:** `PATCH /api/clusters/<cluster_id>/`
- **Content-Type:** `application/json`
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

## 4. Re-Route Department (Kanban Board)
Called when dragging issue cards to assign PWD, Jal Board, Waste Management, or Electricity.

- **Route:** `PATCH /api/clusters/<cluster_id>/`
- **Content-Type:** `application/json`
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

## 5. Gemini AI Weekly Report summary
Fetches weekly briefings and summaries analyzed by Gemini.

- **Route:** `GET /api/weekly-summary/`
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

## 6. PDF Export & WhatsApp Dispatch
- **Download PDF:** `GET /api/weekly-summary/download-pdf/` (Returns PDF binary file stream)
- **WhatsApp Dispatch:** `POST /api/weekly-summary/send-whatsapp/`
  - **Payload:** `{"recipient_group_id": "alerts_99"}`
  - **Response:** `{"status": "dispatched", "message": "Dispatched successfully."}`
