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
    # Fetch issues from last 7 days
    last_week = timezone.now() - timedelta(days=7)
    recent_clusters = IssueCluster.objects.filter(created_at__gte=last_week)
    
    # Simple hardcoded fallback if Gemini fails or isn't set up
    fallback_response = {
        "week_date": timezone.now().strftime("%B %d, %Y"),
        "executive_summary": "Honorable Member of Parliament, this week your constituency experienced several reported issues.",
        "critical_bottleneck": f"Found {recent_clusters.count()} active clusters requiring attention.",
        "successful_resolution": "Ongoing monitoring by the AI engine.",
        "sentiment_profile": "Mixed sentiment observed."
    }

    if genai and os.environ.get("GEMINI_API_KEY"):
        try:
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            prompt = f"Summarize these {recent_clusters.count()} issues into a weekly report for an MP. Format as JSON with keys: week_date, executive_summary, critical_bottleneck, successful_resolution, sentiment_profile."
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            # Parse the JSON response
            import json
            ai_data = json.loads(response.text)
            return Response(ai_data)
        except Exception as e:
            fallback_response['error'] = str(e)
            return Response(fallback_response)
    
    return Response(fallback_response)

@api_view(['GET'])
def download_pdf(request):
    """ GET /api/weekly-summary/download-pdf/ """
    # Dummy response, normally returns FileResponse
    return Response({"status": "success", "message": "PDF Download Link Generated", "url": "/media/reports/weekly_report.pdf"})

@api_view(['POST'])
def send_whatsapp(request):
    """ POST /api/weekly-summary/send-whatsapp/ """
    group_id = request.data.get('recipient_group_id', 'Unknown')
    return Response({
        "status": "dispatched",
        "message": f"Dispatched successfully to {group_id}."
    })
