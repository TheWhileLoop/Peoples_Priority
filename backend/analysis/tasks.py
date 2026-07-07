import json
from datetime import timedelta
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from .models import IssueCluster, WeeklyBriefing
import google.genai as genai
from google.genai import types

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
