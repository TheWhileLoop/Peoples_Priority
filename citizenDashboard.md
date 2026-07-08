# CitizenDashboard — Backend API Specification

> **Base URL:** `https://api.yourapp.com/api/v1`
> **Auth:** Every protected route requires `Authorization: Bearer <JWT_TOKEN>` in the header
> **Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)

---

## Total Routes: 8

| # | Method | Route | Tab | Purpose |
|---|--------|-------|-----|---------|
| 1 | `GET`  | `/auth/me/` | All tabs | Get logged-in citizen profile |
| 2 | `POST` | `/complaints/` | Report Issue | Submit a new complaint |
| 3 | `POST` | `/complaints/upload-media/` | Report Issue | Upload photo or audio file |
| 4 | `GET`  | `/complaints/my/` | My Submissions | Fetch citizen own complaints |
| 5 | `GET`  | `/complaints/{id}/` | My Submissions | Single complaint detail + timeline |
| 6 | `GET`  | `/clusters/nearby/` | Nearby Feed | Fetch area clusters near citizen |
| 7 | `POST` | `/clusters/{id}/upvote/` | Nearby Feed | Upvote / Me Too a cluster |
| 8 | `GET`  | `/geo/reverse/` | Location Card | Reverse geocode lat/lon to city name |

---

## Auth Header (Required on all protected routes)

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

---

## TAB 1 — REPORT ISSUE

---

### 1. GET /auth/me/
Purpose: Dashboard header me citizen ka naam, email dikhana

Request:
  GET /api/v1/auth/me/
  Authorization: Bearer <token>

Response 200 OK:
{
  "id": 42,
  "email": "rajan.kumar@gmail.com",
  "first_name": "Rajan",
  "last_name": "Kumar",
  "phone": "9876543210",
  "profile": {
    "role": "citizen",
    "city": "Mumbai",
    "avatar_url": "https://cdn.example.com/avatars/42.jpg"
  }
}

---

### 3. GET /geo/reverse/
Purpose: GPS coordinates se city name fetch karna (Location modal me dikhana)
Note: Frontend pe OpenStreetMap Nominatim se already ho raha hai (free, no API key).
      Agar apna backend proxy banana ho to ye route banao, warna skip karo.

Request:
  GET /api/v1/geo/reverse/?lat=19.1155&lon=72.8755
  Authorization: Bearer <token>

Response 200 OK:
{
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400069",
  "full_address": "Andheri East, Mumbai, Maharashtra, India",
}

---

### 4. POST /complaints/upload-media/
Purpose: Photo ya audio file pehle upload karo, phir uska URL complaint me bhejo
Content-Type: multipart/form-data

Request (Photo upload):
  POST /api/v1/complaints/upload-media/
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

  file: <image_file.jpg>
  file_type: "photo"

Request (Audio upload):
  POST /api/v1/complaints/upload-media/
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

  file: <recording.webm>
  file_type: "audio"

Response 201 Created:
{
  "file_id": "f_8x9k2abc",
  "file_type": "photo",
  "url": "https://cdn.example.com/uploads/complaints/f_8x9k2abc.jpg",
  "thumbnail_url": "https://cdn.example.com/uploads/complaints/f_8x9k2abc_thumb.jpg",
  "size_kb": 142,
  "uploaded_at": "2026-07-05T21:34:17+05:30"
}

---

### 5. POST /complaints/
Purpose: New complaint submit karna (text / voice / photo)

Request Payload — Text Report:
{
  "text": "Huge pothole near main crossing causing accidents at night.",
  "category": "Roads",
  "type": "text",
  "latitude": 19.11548,
  "longitude": 72.87552,
  "media_url": null,
  "audio_url": null
}

Request Payload — Photo Report:
{
  "text": "Overflowing garbage bin near apartments.",
  "category": "Waste Management",
  "type": "photo",
  "latitude": 19.10012,
  "longitude": 72.84500,
  "media_url": "https://cdn.example.com/uploads/complaints/f_8x9k2abc.jpg",
  "audio_url": null
}

Request Payload — Voice Report:
{
  "text": "",
  "category": "Roads",
  "type": "voice",
  "latitude": 19.11548,
  "longitude": 72.87552,
  "media_url": null,
  "audio_url": "https://cdn.example.com/uploads/complaints/audio_r3k9m.webm"
}

Response 201 Created:
{
  "id": "c_r3k9mxyz",
  "text": "Huge pothole near main crossing causing accidents at night.",
  "category": "Roads",
  "type": "text",
  "status": "Pending",
  "latitude": 19.11548,
  "longitude": 72.87552,
  "media_url": null,
  "audio_url": null,
  "user": {
    "id": 42,
    "email": "rajan.kumar@gmail.com",
    "first_name": "Rajan"
  },
  "ai_result": {
    "severity_score": 8.9,
    "sentiment": "Highly Negative",
    "department_assigned": "PWD",
    "cluster_id": "cl1",
    "cluster_title": "Road Condition in Andheri East",
    "is_duplicate": false,
    "priority_rank": 2
  },
  "created_at": "2026-07-05T21:34:17+05:30"
}

Note: ai_result backend pe AI se process karke return karo.
      Ye confirmation screen me dikhta hai (severity, cluster, department, duplicate check).

---

## TAB 2 — MY SUBMISSIONS

---

### 6. GET /complaints/my/
Purpose: Citizen ke apne saare complaints fetch karna

Request:
  GET /api/v1/complaints/my/?page=1&page_size=10
  Authorization: Bearer <token>

Query Params (optional):
  page        int     Page number (default: 1)
  page_size   int     Items per page (default: 10)
  status      string  Filter: Pending | In Progress | Resolved
  category    string  Filter: Roads | Water Supply | Waste Management | Electricity

Response 200 OK:
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "c1",
      "text": "Huge potholes near the main junction in Andheri East.",
      "category": "Roads",
      "type": "text",
      "status": "Pending",
      "latitude": 19.1155,
      "longitude": 72.8755,
      "media_url": null,
      "audio_url": null,
      "created_at": "2026-07-03T10:30:00+05:30",
      "updated_at": "2026-07-03T10:30:00+05:30",
      "cluster": {
        "id": "cl1",
        "title": "Road Condition in Andheri East",
        "severity_score": 9.8,
        "department": "PWD",
        "status": "Pending"
      },
      "timeline": [
        { "step": "received",  "label": "Received",  "sub": "AI Registered",    "done": true,  "timestamp": "2026-07-03T10:30:00+05:30" },
        { "step": "clustered", "label": "Clustered", "sub": "Score: 9.8/10",    "done": true,  "timestamp": "2026-07-03T10:31:05+05:30" },
        { "step": "action",    "label": "Action",    "sub": "Awaiting Dept",    "done": false, "timestamp": null },
        { "step": "resolved",  "label": "Resolved",  "sub": "Pending Work",     "done": false, "timestamp": null }
      ]
    },
    {
      "id": "c3",
      "text": "Garbage dump pile not cleared for a week near the park.",
      "category": "Waste Management",
      "type": "photo",
      "status": "In Progress",
      "latitude": 19.1000,
      "longitude": 72.8450,
      "media_url": "https://cdn.example.com/uploads/complaints/c3.jpg",
      "audio_url": null,
      "created_at": "2026-07-05T09:00:00+05:30",
      "updated_at": "2026-07-05T11:00:00+05:30",
      "cluster": {
        "id": "cl3",
        "title": "Garbage Dump near Central Park",
        "severity_score": 6.4,
        "department": "Waste Management",
        "status": "In Progress"
      },
      "timeline": [
        { "step": "received",  "label": "Received",  "sub": "AI Registered",          "done": true,  "timestamp": "2026-07-05T09:00:00+05:30" },
        { "step": "clustered", "label": "Clustered", "sub": "Score: 6.4/10",           "done": true,  "timestamp": "2026-07-05T09:01:22+05:30" },
        { "step": "action",    "label": "Action",    "sub": "Dept: Waste Management",  "done": true,  "timestamp": "2026-07-05T10:00:00+05:30" },
        { "step": "resolved",  "label": "Resolved",  "sub": "Pending Work",            "done": false, "timestamp": null }
      ]
    }
  ]
}

---

### 7. GET /complaints/{id}/
Purpose: Single complaint ka full detail — timeline + cluster info

Request:
  GET /api/v1/complaints/c1/
  Authorization: Bearer <token>

Response 200 OK:
{
  "id": "c1",
  "text": "Huge potholes near the main junction in Andheri East.",
  "category": "Roads",
  "type": "text",
  "status": "Pending",
  "latitude": 19.1155,
  "longitude": 72.8755,
  "media_url": null,
  "audio_url": null,
  "created_at": "2026-07-03T10:30:00+05:30",
  "updated_at": "2026-07-03T10:30:00+05:30",
  "ai_result": {
    "severity_score": 9.8,
    "sentiment": "Highly Negative",
    "department_assigned": "PWD",
    "is_duplicate": false,
    "priority_rank": 1
  },
  "cluster": {
    "id": "cl1",
    "title": "Road Condition in Andheri East",
    "severity_score": 9.8,
    "department": "PWD",
    "status": "Pending",
    "mentions": 451,
    "ai_summary": "Severe potholes on main arterial roads causing nighttime accidents."
  },
  "timeline": [
    { "step": "received",  "label": "Received",  "sub": "AI Registered", "done": true,  "timestamp": "2026-07-03T10:30:00+05:30" },
    { "step": "clustered", "label": "Clustered", "sub": "Score: 9.8/10", "done": true,  "timestamp": "2026-07-03T10:31:05+05:30" },
    { "step": "action",    "label": "Action",    "sub": "Awaiting Dept", "done": false, "timestamp": null },
    { "step": "resolved",  "label": "Resolved",  "sub": "Pending Work",  "done": false, "timestamp": null }
  ]
}

---

## TAB 3 — NEARBY FEED (Me Too)

---

### 8. GET /clusters/nearby/
Purpose: Citizen ke 2km radius me active clusters dikhana

Request:
  GET /api/v1/clusters/nearby/?lat=19.1155&lon=72.8755&radius_km=2&status=active
  Authorization: Bearer <token>

Query Params:
  lat         float   REQUIRED  Citizen latitude
  lon         float   REQUIRED  Citizen longitude
  radius_km   float   optional  Default: 2 km
  status      string  optional  active (default) | resolved | all
  category    string  optional  Filter by category
  page        int     optional  Pagination

Response 200 OK:
{
  "count": 3,
  "citizen_location": {
    "lat": 19.1155,
    "lon": 72.8755,
    "city": "Mumbai",
  },
  "results": [
    {
      "id": "cl1",
      "title": "Road Condition in Andheri East",
      "category": "Roads",
      "severity_score": 9.8,
      "sentiment": "Highly Negative",
      "status": "Pending",
      "department": "PWD",
      "center_latitude": 19.1155,
      "center_longitude": 72.8755,
      "distance_km": 0.1,
      "mentions": 450,
      "ai_summary": "Severe potholes on main arterial roads near Andheri East junction causing high traffic delays.",
      "user_has_upvoted": false,
      "complaint_count": 38,
      "created_at": "2026-07-01T08:00:00+05:30",
      "last_activity_at": "2026-07-05T20:00:00+05:30"
    },
    {
      "id": "cl2",
      "title": "Water Pipeline Leakage at Sector 5",
      "category": "Water Supply",
      "severity_score": 8.5,
      "sentiment": "Negative",
      "status": "Pending",
      "department": "Jal Board",
      "center_latitude": 19.1200,
      "center_longitude": 72.8850,
      "distance_km": 0.7,
      "mentions": 210,
      "ai_summary": "Major clean water pipeline burst in Sector 5 resulting in loss of drinking water to 200+ households.",
      "user_has_upvoted": true,
      "complaint_count": 21,
      "created_at": "2026-07-02T09:00:00+05:30",
      "last_activity_at": "2026-07-05T18:30:00+05:30"
    },
    {
      "id": "cl3",
      "title": "Garbage Dump near Central Park",
      "category": "Waste Management",
      "severity_score": 6.4,
      "sentiment": "Negative",
      "status": "In Progress",
      "department": "Waste Management",
      "center_latitude": 19.1000,
      "center_longitude": 72.8450,
      "distance_km": 1.4,
      "mentions": 95,
      "ai_summary": "Solid waste accumulation outside the municipal park area. Routed to sanitation team for pickup.",
      "user_has_upvoted": false,
      "complaint_count": 9,
      "created_at": "2026-07-04T07:00:00+05:30",
      "last_activity_at": "2026-07-05T15:00:00+05:30"
    }
  ]
}

---

### 9. POST /clusters/{id}/upvote/
Purpose: Me Too button — citizen kisi cluster ko upvote kare

Request:
  POST /api/v1/clusters/cl1/upvote/
  Authorization: Bearer <token>
  Content-Type: application/json

  {}     (body empty — user ID token se milega)

Response 200 OK (upvote add hua):
{
  "cluster_id": "cl1",
  "action": "upvoted",
  "new_mentions": 451,
  "new_severity_score": 9.95,
  "user_has_upvoted": true,
  "message": "Aapka Me Too register ho gaya! Priority badhh gayi."
}

Response 200 OK (already upvoted — toggle remove):
{
  "cluster_id": "cl1",
  "action": "removed",
  "new_mentions": 449,
  "new_severity_score": 9.80,
  "user_has_upvoted": false,
  "message": "Aapka upvote hata diya gaya."
}

Response 403 Forbidden (khud ka complaint cluster):
{
  "error": "You cannot upvote a cluster created from your own complaint."
}

---

## Common Error Responses

400 Bad Request (validation fail):
{
  "error": "Validation failed",
  "details": {
    "latitude": ["This field is required for voice complaints."],
    "category": ["Invalid category. Choose from: Roads, Water Supply, Waste Management, Electricity."]
  }
}

401 Unauthorized (token missing/expired):
{
  "error": "Authentication credentials were not provided.",
  "code": "token_not_provided"
}

403 Forbidden (wrong role):
{
  "error": "You do not have permission to perform this action.",
  "code": "permission_denied"
}

404 Not Found:
{
  "error": "Complaint not found.",
  "code": "not_found"
}

413 Payload Too Large (file upload):
{
  "error": "File too large. Maximum allowed size is 10MB.",
  "code": "file_too_large"
}

500 Internal Server Error:
{
  "error": "Something went wrong on our end. Please try again.",
  "code": "server_error"
}

---

## Summary — Kon sa Data Kahan Se Aata Hai

### Report Issue Tab
  Header me naam           ->  GET /auth/me/
  City name (GPS modal)    ->  GET /geo/reverse/  (ya OpenStreetMap directly)
  Photo/audio upload       ->  POST /complaints/upload-media/
  Form submit              ->  POST /complaints/
  Confirmation screen      ->  POST /complaints/ response ka ai_result field

### My Submissions Tab
  Complaint list           ->  GET /complaints/my/
  Status badge             ->  status field in response
  Timeline (4 nodes)       ->  timeline array in response
  Cluster info             ->  cluster object in response
  Photo thumbnail          ->  media_url field

### Nearby Feed Tab
  Cluster cards            ->  GET /clusters/nearby/
  Severity badge           ->  severity_score field
  AI Summary               ->  ai_summary field
  Citizens affected        ->  mentions field
  Me Too button            ->  POST /clusters/{id}/upvote/
  Already upvoted state    ->  user_has_upvoted field

---

## Key Backend Notes

1. JWT Auth: Har request me Authorization: Bearer <token> bhejo.
   Token login ke time milta hai aur authStore.js me localStorage me store hota hai.

2. File Upload 2-Step Process:
   Step 1: POST /complaints/upload-media/ => url milega
   Step 2: Us url ko POST /complaints/ ke media_url ya audio_url me bhejo

3. AI Processing: POST /complaints/ response me ai_result object hona chahiye.
   Severity, department, cluster assignment frontend confirmation screen me use karta hai.

4. Clusters Nearby: lat aur lon query params mandatory hain.
   Ye citizen ka real GPS location hai.

5. Timeline Array: GET /complaints/my/ me har complaint ke saath timeline array return karo.
   4 steps: received -> clustered -> action -> resolved
   Frontend directly ise stepper banane me use karta hai.

6. Upvote Toggle: Ek hi endpoint se upvote add aur remove dono handle karo.
   Agar already upvoted hai to action: "removed" return karo.
