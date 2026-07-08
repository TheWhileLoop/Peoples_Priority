import json
import math
from decimal import Decimal
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from .models import IssueCluster, WeeklyBriefing
from .gemini_service import analyze_civic_complaint
import google.genai as genai
from google.genai import types


@shared_task
def process_complaint_with_ai(complaint_id):
    """
    Analyzes a single complaint using Gemini AI and clusters it into an IssueCluster.
    Called after every new complaint is saved.
    """
    from data_collection.models import Complaint

    print(f"[AI Task] Processing complaint ID: {complaint_id}")

    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        print(f"[AI Task] Complaint {complaint_id} not found.")
        return

    api_key = getattr(settings, 'GEMINI_API_KEY', '')

    # ── Build the prompt ────────────────────────────────────────────────────
    prompt = f"""
You are an AI civic analyst. Analyze the following citizen complaint and extract structured information.

Complaint Title: {complaint.title or 'No title provided'}
Complaint Description: {complaint.description}
Location: Ward={complaint.ward or 'Unknown'}, City={complaint.city or 'Unknown'}, District={complaint.district or 'Unknown'}

Respond in strict JSON with exactly these keys:
1. "category" — one of: roads, water, electricity, sanitation, health, safety, animals, other
2. "ai_summary" — a concise 1-2 sentence summary of the issue
3. "sentiment" — one of: angry, concerned, neutral, positive
4. "severity_score" — a float from 1.0 to 10.0 (10 = most urgent)
5. "cluster_title" — a short (5-8 word) title for grouping similar issues
6. "department" — the government department that should handle this (e.g., PWD, Municipal Corporation, BESCOM, etc.)

Output strictly as JSON without any markdown formatting.
"""

    # ── Call Gemini (or use a fallback if no API key) ──────────────────────
    data = None
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            response_text = response.text.strip()
            # Strip any markdown code fences
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            data = json.loads(response_text.strip())
            print(f"[AI Task] Gemini response for complaint {complaint_id}: {data}")
        except Exception as e:
            print(f"[AI Task] Gemini call failed for complaint {complaint_id}: {e}")

    # ── Fallback if AI unavailable ─────────────────────────────────────────
    if data is None:
        data = {
            "category": complaint.category or "other",
            "ai_summary": complaint.description[:200],
            "sentiment": "neutral",
            "severity_score": 5.0,
            "cluster_title": complaint.title or "Civic Issue",
            "department": "Municipal Corporation",
        }

    # ── Update the complaint with AI results ──────────────────────────────
    complaint.ai_category = data.get("category", complaint.category)
    complaint.processed_text = data.get("ai_summary", "")
    complaint.status = "verified"
    complaint.save()

    # ── Find or create a matching IssueCluster ────────────────────────────
    category = data.get("category", "other")
    ward = complaint.ward or ""
    severity = Decimal(str(data.get("severity_score", 5.0)))
    sentiment = data.get("sentiment", "neutral")
    department = data.get("department", "Municipal Corporation")
    cluster_title = data.get("cluster_title", complaint.title or "Civic Issue")
    ai_summary = data.get("ai_summary", complaint.description[:200])

    # Try to find an existing open cluster for the same category & ward
    existing_cluster = IssueCluster.objects.filter(
        category=category,
        ward=ward,
        status__in=["pending_ai", "pending_dept", "in_progress"],
    ).first()

    if existing_cluster:
        cluster = existing_cluster
        cluster.mentions_count += 1

        # Update center coordinates as running average
        cluster_complaints = list(cluster.complaints.all())
        all_lats = [c.latitude for c in cluster_complaints if c.latitude is not None]
        all_lons = [c.longitude for c in cluster_complaints if c.longitude is not None]
        if complaint.latitude:
            all_lats.append(complaint.latitude)
        if complaint.longitude:
            all_lons.append(complaint.longitude)
        if all_lats:
            cluster.center_latitude = sum(all_lats) / len(all_lats)
        if all_lons:
            cluster.center_longitude = sum(all_lons) / len(all_lons)

        # Bump severity slightly
        total_upvotes = sum(c.upvotes_count for c in cluster_complaints)
        base_severity = Decimal('4.0')
        new_severity = base_severity + Decimal(str(cluster.mentions_count * 0.1)) + Decimal(str(total_upvotes * 0.05))
        cluster.severity_score = min(new_severity, Decimal('10.0'))

        cluster.action_log = cluster.action_log or []
        cluster.action_log.append({
            "action": "complaint_added",
            "complaint_id": complaint.id,
        })
        cluster.save()
        print(f"[AI Task] Added complaint {complaint_id} to existing cluster {cluster.id}")
    else:
        # Create a brand-new cluster
        cluster = IssueCluster.objects.create(
            title=cluster_title,
            ai_summary=ai_summary,
            category=category,
            severity_score=severity,
            mentions_count=1,
            sentiment=sentiment,
            status="pending_dept",
            state=None,
            district=complaint.district or "",
            city=complaint.city or "",
            ward=ward,
            department=department,
            center_latitude=complaint.latitude,
            center_longitude=complaint.longitude,
            action_log=[{"action": "cluster_created", "complaint_id": complaint.id}],
        )
        print(f"[AI Task] Created new cluster {cluster.id} for complaint {complaint_id}")

    # ── Link complaint → cluster ───────────────────────────────────────────
    complaint.cluster = cluster
    complaint.save()
    print(f"[AI Task] Complaint {complaint_id} successfully processed and linked to cluster {cluster.id}.")
# Radius used to decide whether a new complaint belongs to an existing cluster.
# Mirrors the "2km radius" spatial-clustering behavior described in the backend design doc,
# implemented here in plain Python since PostGIS isn't set up on this database.
CLUSTER_RADIUS_KM = 2.0


def _haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon points, in kilometers."""
    R = 6371.0
    lat1, lon1, lat2, lon2 = (math.radians(float(v)) for v in (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@shared_task(bind=True, max_retries=3)
def process_complaint_with_ai(self, complaint_id):
    """
    Fired by the post_save signal in data_collection/models.py every time a citizen submits a complaint.

    1. Sends the complaint's text/photo/audio to Gemini for category, department, severity & sentiment.
    2. Matches it to a nearby existing IssueCluster of the same category (within CLUSTER_RADIUS_KM),
       or creates a new one if nothing nearby exists.
    3. Writes the AI results back onto the Complaint and updates the cluster's rolling stats.
    """
    # Local import avoids a circular import with data_collection.models at module load time.
    from data_collection.models import Complaint

    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return f"Complaint {complaint_id} no longer exists."

    image_url = complaint.image_file.url if complaint.image_file else None
    audio_url = complaint.audio_file.url if complaint.audio_file else None

    try:
        result = analyze_civic_complaint(
            description=complaint.description,
            image_url=image_url,
            audio_url=audio_url,
        )
    except Exception as exc:
        error_str = str(exc)
        is_rate_limited = '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str

        if is_rate_limited and self.request.retries < self.max_retries:
            # Gemini rate-limited/quota-exhausted us — back off and let Celery retry this exact
            # complaint later instead of permanently mislabeling it with placeholder values.
            raise self.retry(exc=exc, countdown=45)

        # Either a non-rate-limit error, or we've already retried the max number of times:
        # fall back to safe defaults so the complaint doesn't stay stuck unprocessed forever.
        result = {
            "category": complaint.category or "other",
            "department": "Collectorate Office",
            "severity_score": 3.0,
            "sentiment": "Concerned",
            "ai_summary": complaint.description[:100] if complaint.description else "New civic complaint submitted.",
        }

    category = result.get('category') or complaint.category or 'other'
    department = result.get('department', 'Collectorate Office')
    try:
        severity_score = Decimal(str(result.get('severity_score', 3.0)))
    except Exception:
        severity_score = Decimal('3.0')
    sentiment = result.get('sentiment', 'Concerned')
    ai_summary = result.get('ai_summary') or (complaint.description[:150] if complaint.description else 'New civic complaint.')

    # ── Find a nearby cluster of the same category, or create a new one ──
    cluster = None
    if complaint.latitude is not None and complaint.longitude is not None:
        candidates = IssueCluster.objects.filter(category=category).exclude(status='resolved')
        for candidate in candidates:
            if candidate.center_latitude is None or candidate.center_longitude is None:
                continue
            distance = _haversine_km(
                complaint.latitude, complaint.longitude,
                candidate.center_latitude, candidate.center_longitude
            )
            if distance <= CLUSTER_RADIUS_KM:
                cluster = candidate
                break

    if cluster is None:
        cluster = IssueCluster.objects.create(
            title=(ai_summary[:255] if ai_summary else f"{category.title()} issue reported"),
            ai_summary=ai_summary,
            category=category,
            severity_score=severity_score,
            mentions_count=1,
            sentiment=sentiment,
            status='pending_dept',
            district=complaint.district,
            city=complaint.city,
            ward=complaint.ward,
            department=department,
            center_latitude=complaint.latitude,
            center_longitude=complaint.longitude,
            action_log=[{
                "action": "cluster_created",
                "complaint_id": complaint.id,
                "severity": float(severity_score),
            }],
        )
    else:
        cluster_complaints = list(cluster.complaints.all()) + [complaint]
        lats = [c.latitude for c in cluster_complaints if c.latitude is not None]
        lngs = [c.longitude for c in cluster_complaints if c.longitude is not None]
        if lats:
            cluster.center_latitude = sum(lats) / len(lats)
        if lngs:
            cluster.center_longitude = sum(lngs) / len(lngs)

        cluster.mentions_count = cluster.mentions_count + 1
        cluster.severity_score = min(max(cluster.severity_score, severity_score) + Decimal('0.1'), Decimal('10.0'))
        cluster.ai_summary = ai_summary
        cluster.department = cluster.department or department
        cluster.action_log.append({
            "action": "complaint_matched",
            "complaint_id": complaint.id,
            "severity": float(severity_score),
        })
        cluster.save()

    complaint.ai_category = category
    complaint.processed_text = ai_summary
    complaint.status = 'verified'
    complaint.cluster = cluster
    complaint.save(update_fields=['ai_category', 'processed_text', 'status', 'cluster'])

    return f"Complaint {complaint.id} analyzed -> cluster {cluster.id} (severity {cluster.severity_score})"


@shared_task
def generate_weekly_briefing():
    print("Starting generation of AI Weekly Briefing...")
    
    # Calculate the date range (last 7 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)
    
    # Fetch issues created in the last week
    recent_clusters = IssueCluster.objects.filter(created_at__gte=start_date).order_by('-severity_score')
    
    # Summarize the data to send to Gemini
    total_issues = recent_clusters.count()
    active_issues = recent_clusters.exclude(status='resolved').count()
    resolved_issues = recent_clusters.filter(status='resolved').count()
    
    high_priority = recent_clusters.filter(severity_score__gte=7.5)
    
    prompt = f"""
    You are an AI Civic Analyst working for a Member of Parliament.
    Analyze the civic complaints received in the last 7 days and create an Executive Grievance Newsletter.
    
    Stats:
    - Total Reports: {total_issues}
    - Active Issues: {active_issues}
    - Resolved Issues: {resolved_issues}
    - High Priority Issues: {high_priority.count()}
    
    Key High Priority Issues:
    """
    
    for cluster in high_priority[:5]: # Send top 5 high priority
        prompt += f"\n- {cluster.title} (Severity: {cluster.severity_score}/10, Ward: {cluster.ward})"
        
    prompt += """
    
    Please provide the output in strict JSON format with exactly these three keys:
    1. "executive_summary" (A 2-3 sentence overview of the week's civic health)
    2. "critical_bottleneck" (Identify the main area needing immediate intervention based on the high priority issues)
    3. "successful_resolution" (A positive note on what's working or being resolved)
    
    Output strictly as JSON without any markdown formatting.
    """
    
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    
    if not api_key:
        print("Error: GEMINI_API_KEY is not set.")
        # Fallback creation
        WeeklyBriefing.objects.create(
            week_start_date=start_date.date(),
            executive_summary="API Key Missing. Honorable Member of Parliament, this week your constituency experienced several reported issues.",
            critical_bottleneck=f"Found {active_issues} active clusters requiring attention.",
            successful_resolution="Ongoing monitoring by the AI engine."
        )
        return "Fallback report created due to missing API key."
        
    try:
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Clean response string to ensure it's valid JSON
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        data = json.loads(response_text.strip())
        
        WeeklyBriefing.objects.create(
            week_start_date=start_date.date(),
            executive_summary=data.get('executive_summary', 'Summary not available.'),
            critical_bottleneck=data.get('critical_bottleneck', 'Bottleneck not available.'),
            successful_resolution=data.get('successful_resolution', 'Resolution not available.')
        )
        
        print("Successfully generated and saved Weekly Briefing!")
        return "Success"
        
    except Exception as e:
        print(f"Error calling Gemini API or parsing response: {e}")
        # Fallback creation on error
        WeeklyBriefing.objects.create(
            week_start_date=start_date.date(),
            executive_summary=f"Error generating AI report. Details: {str(e)}",
            critical_bottleneck=f"Found {active_issues} active clusters requiring attention.",
            successful_resolution="Ongoing monitoring by the AI engine."
        )
        return "Fallback report created due to error."
