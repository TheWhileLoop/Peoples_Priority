import json
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from .models import IssueCluster, WeeklyBriefing
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
