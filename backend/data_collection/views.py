from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Complaint
from .serializers import ComplaintSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """
        Endpoint: POST /api/collect/complaints/<id>/upvote/
        Expected response: {"success": true, "new_mentions": 451, "new_severity_score": 9.9}
        Backend team needs to implement the logic here.
        """
        # Logic to be implemented by Ayush
        return Response({
            "success": True,
            "new_mentions": 451,
            "new_severity_score": 9.9
        })
