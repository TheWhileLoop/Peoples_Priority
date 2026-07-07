from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
import os

# Assuming google-genai is installed
try:
    from google import genai
except ImportError:
    genai = None

from .models import IssueCluster
from .serializers import IssueClusterSerializer
from data_collection.models import Complaint
from data_collection.serializers import ComplaintSerializer

# ─── ADMIN DASHBOARD ENDPOINTS ──────────────────────────────────────

@api_view(['GET'])
def admin_stats(request):
    """ GET /api/admin/stats/ """
    district = request.query_params.get('district', None)
    ward = request.query_params.get('ward', None)
    category = request.query_params.get('category', None)

    complaints_qs = Complaint.objects.all()
    clusters_qs = IssueCluster.objects.all()

    if district:
        complaints_qs = complaints_qs.filter(district=district)
        clusters_qs = clusters_qs.filter(district=district)
    if ward:
        complaints_qs = complaints_qs.filter(ward=ward)
        clusters_qs = clusters_qs.filter(ward=ward)
    if category:
        complaints_qs = complaints_qs.filter(category=category)
        clusters_qs = clusters_qs.filter(category=category)

    total_complaints = complaints_qs.count()
    active_clusters = clusters_qs.exclude(status='resolved').count()
    resolved_issues = clusters_qs.filter(status='resolved').count()
    
    # Calculate most common sentiment (simple approach)
    sentiments = clusters_qs.exclude(sentiment__isnull=True).values('sentiment').annotate(count=Count('id')).order_by('-count')
    dominant_sentiment = sentiments[0]['sentiment'] if sentiments else "Neutral"
    
    return Response({
        "total_ingested_reports": total_complaints,
        "active_clusters": active_clusters,
        "resolved_issues": resolved_issues,
        "public_sentiment": dominant_sentiment
    })

@api_view(['GET'])
def admin_filters(request):
    """ GET /api/admin/filters/ """
    districts = IssueCluster.objects.exclude(district__isnull=True).values_list('district', flat=True).distinct()
    cities = IssueCluster.objects.exclude(city__isnull=True).values_list('city', flat=True).distinct()
    wards = IssueCluster.objects.exclude(ward__isnull=True).values_list('ward', flat=True).distinct()
    categories = IssueCluster.objects.exclude(category__isnull=True).values_list('category', flat=True).distinct()
    
    return Response({
        "districts": list(districts),
        "cities": list(cities),
        "wards": list(wards),
        "categories": list(categories)
    })

# ─── CLUSTER VIEWSET (LIST, FILTER, UPDATE, NESTED) ───────────────

class IssueClusterViewSet(viewsets.ModelViewSet):
    """ 
    Base Route: /api/clusters/ 
    Handles listing (with filters), updating (status/department), and nested complaints.
    """
    serializer_class = IssueClusterSerializer

    def get_queryset(self):
        queryset = IssueCluster.objects.prefetch_related('complaints').all().order_by('-severity_score')
        
        # Filtering based on query params
        district = self.request.query_params.get('district', None)
        city = self.request.query_params.get('city', None)
        ward = self.request.query_params.get('ward', None)
        category = self.request.query_params.get('category', None)
        
        if district:
            queryset = queryset.filter(district=district)
        if city:
            queryset = queryset.filter(city=city)
        if ward:
            queryset = queryset.filter(ward=ward)
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset

    @action(detail=True, methods=['get'])
    def complaints(self, request, pk=None):
        """ GET /api/clusters/<cluster_id>/complaints/ """
        cluster = self.get_object()
        complaints = cluster.complaints.all().order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """ PATCH /api/clusters/<cluster_id>/ """
        cluster = self.get_object()
        new_status = request.data.get('status', None)
        new_department = request.data.get('department', None)
        
        response_data = {"id": cluster.id}
        
        if new_department:
            cluster.department = new_department
            cluster.save()
            response_data['department'] = new_department
            response_data['message'] = "Routed successfully."
            
        if new_status:
            cluster.status = new_status
            cluster.save()
            # Note: We don't have a status field on Complaint, so we just update the cluster.
            # If we did, we would do: cluster.complaints.update(status=new_status)
            response_data['status'] = new_status
            response_data['message'] = "Cluster status updated successfully."
            
        return Response(response_data)


# ─── AI ANALYSIS & REPORTING ────────────────────────────────────────

@api_view(['POST'])
def analyze_complaint(request):
    """ POST /api/analyze-complaint/ """
    # Placeholder for single complaint analysis
    return Response({
        "status": "success",
        "cluster_id": 1,
        "severity_score": 8.5,
        "ai_summary": "Issue received and analyzed.",
        "sentiment": "Negative"
    })

@api_view(['GET'])
def retrieve_weekly_summary(request):
    """ GET /api/weekly-summary/ """
    from .models import WeeklyBriefing
    
    # Fetch the most recent WeeklyBriefing
    latest_briefing = WeeklyBriefing.objects.order_by('-created_at').first()
    
    if latest_briefing:
        return Response({
            "week_date": latest_briefing.week_start_date.strftime("%B %d, %Y"),
            "executive_summary": latest_briefing.executive_summary,
            "critical_bottleneck": latest_briefing.critical_bottleneck,
            "successful_resolution": latest_briefing.successful_resolution,
            "sentiment_profile": "AI generated analysis complete."
        })
    else:
        # Fallback if no cron job has run yet
        return Response({
            "week_date": timezone.now().strftime("%B %d, %Y"),
            "executive_summary": "Weekly briefing is currently being generated. Please check back later.",
            "critical_bottleneck": "Cron job has not run yet.",
            "successful_resolution": "Awaiting first automated report generation.",
            "sentiment_profile": "N/A"
        })

from django.http import FileResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

@api_view(['GET'])
def download_pdf(request):
    """ GET /api/weekly-summary/download-pdf/ """
    from .models import WeeklyBriefing
    latest_briefing = WeeklyBriefing.objects.order_by('-created_at').first()

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "Executive Grievance Newsletter")
    
    p.setFont("Helvetica", 12)
    if latest_briefing:
        p.drawString(100, 720, f"Week of: {latest_briefing.week_start_date.strftime('%B %d, %Y')}")
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, 680, "Executive Summary:")
        p.setFont("Helvetica", 10)
        
        # Simple text wrapping for PDF
        text = p.beginText(100, 660)
        text.setFont("Helvetica", 10)
        text.setLeading(14)
        
        # very basic wrapping
        import textwrap
        lines = textwrap.wrap(latest_briefing.executive_summary, width=80)
        for line in lines:
            text.textLine(line)
            
        p.drawText(text)
        
        y_pos = 660 - (len(lines) * 14) - 20
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y_pos, "Critical Bottleneck:")
        text = p.beginText(100, y_pos - 20)
        text.setFont("Helvetica", 10)
        text.setLeading(14)
        lines = textwrap.wrap(latest_briefing.critical_bottleneck, width=80)
        for line in lines:
            text.textLine(line)
        p.drawText(text)
        
        y_pos = (y_pos - 20) - (len(lines) * 14) - 20
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y_pos, "Successful Resolution:")
        text = p.beginText(100, y_pos - 20)
        text.setFont("Helvetica", 10)
        text.setLeading(14)
        lines = textwrap.wrap(latest_briefing.successful_resolution, width=80)
        for line in lines:
            text.textLine(line)
        p.drawText(text)
        
    else:
        p.drawString(100, 720, "No weekly briefing available.")

    p.showPage()
    p.save()
    buffer.seek(0)
    
    return FileResponse(buffer, as_attachment=True, filename='executive_newsletter.pdf')

@api_view(['POST'])
def send_whatsapp(request):
    """ POST /api/weekly-summary/send-whatsapp/ """
    group_id = request.data.get('recipient_group_id', 'Unknown')
    return Response({
        "status": "dispatched",
        "message": f"Dispatched successfully to {group_id}."
    })
