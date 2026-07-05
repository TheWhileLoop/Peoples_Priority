from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import IssueCluster
from .serializers import IssueClusterSerializer

class IssueClusterViewSet(viewsets.ModelViewSet):
    """
    Endpoint: GET /api/analyze/clusters/
    """
    queryset = IssueCluster.objects.all().order_by('-severity_score')
    serializer_class = IssueClusterSerializer


@api_view(['POST'])
def analyze_complaint(request):
    """
    Endpoint: POST /api/analyze/analyze-complaint/
    Expected response: {"status": "success", "cluster_id": 12, "severity_score": 8.5, "ai_summary": "...", "sentiment": "Negative"}
    Backend team needs to implement Gemini logic here.
    """
    # Logic to be implemented by Abhishek Yaduwanshi
    return Response({
        "status": "success",
        "cluster_id": 12,
        "severity_score": 8.5,
        "ai_summary": "Multiple potholes reported in Andheri East causing traffic.",
        "sentiment": "Negative"
    })

@api_view(['GET'])
def weekly_summary(request):
    """
    Endpoint: GET /api/analyze/weekly-summary/
    Expected response: {"week_summary": "Honorable MP..."}
    Backend team needs to implement Gemini logic here.
    """
    # Logic to be implemented by Abhishek Yaduwanshi
    return Response({
        "week_summary": "Honorable MP, we noticed a 20% drop in water complaints this week, but a severe spike in street-light issues in Ward 4. Immediate action recommended."
    })
