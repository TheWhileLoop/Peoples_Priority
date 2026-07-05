from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Complaint, IssueCluster
from .serializers import ComplaintSerializer, IssueClusterSerializer, UserSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    data = serializer.data
    data['is_staff'] = request.user.is_staff
    return Response(data)

class IssueClusterViewSet(viewsets.ModelViewSet):
    queryset = IssueCluster.objects.all().order_by('-severity_score')
    serializer_class = IssueClusterSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer

    def create(self, request, *args, **kwargs):
        # We will override this to trigger Celery AI Task later
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # TODO: Trigger Gemini 2.5 Flash clustering background task here
        # process_complaint_ai.delay(serializer.data['id'])
        
        headers = self.get_success_headers(serializer.data)
        return Response({
            "message": "Complaint received successfully. AI is analyzing the issue.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)
