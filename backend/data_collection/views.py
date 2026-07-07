from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import Complaint, ComplaintUpvote
from .serializers import ComplaintSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """
        Endpoint: POST /api/collect/complaints/<id>/upvote/
        Toggles the upvote for the current logged-in user on a complaint.
        Recalculates the master IssueCluster severity score and mentions count.
        """
        complaint = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response({"error": "Authentication required to upvote complaints."}, status=status.HTTP_401_UNAUTHORIZED)
            
        upvote_qs = ComplaintUpvote.objects.filter(complaint=complaint, user=user)
        
        if upvote_qs.exists():
            # Remove upvote (Toggle Off)
            upvote_qs.delete()
            complaint.upvotes_count = max(0, complaint.upvotes_count - 1)
            complaint.save()
            upvoted = False
        else:
            # Add upvote (Toggle On)
            ComplaintUpvote.objects.create(complaint=complaint, user=user)
            complaint.upvotes_count += 1
            complaint.save()
            upvoted = True
            
        # ── Recalculate Master Cluster Properties ──
        cluster = complaint.cluster
        if cluster:
            cluster_complaints = list(cluster.complaints.all())
            cluster.mentions_count = len(cluster_complaints)
            
            # Recalculate center location as average coordinates
            latitudes = [c.latitude for c in cluster_complaints if c.latitude is not None]
            longitudes = [c.longitude for c in cluster_complaints if c.longitude is not None]
            
            if latitudes:
                cluster.center_latitude = sum(latitudes) / len(latitudes)
            if longitudes:
                cluster.center_longitude = sum(longitudes) / len(longitudes)
            
            # Recalculate severity score
            total_upvotes = sum(c.upvotes_count for c in cluster_complaints)
            
            # Base severity of the cluster is 4.0, each mention adds 0.1, each upvote adds 0.05
            base_severity = Decimal('4.0')
            new_severity = base_severity + Decimal(str(cluster.mentions_count * 0.1)) + Decimal(str(total_upvotes * 0.05))
            cluster.severity_score = min(new_severity, Decimal('10.0'))
            
            # Log action
            cluster.action_log.append({
                "action": "upvote_toggled",
                "complaint_id": complaint.id,
                "user": user.username,
                "upvotes_count": complaint.upvotes_count,
                "new_severity": float(cluster.severity_score)
            })
            cluster.save()
            
        return Response({
            "success": True,
            "upvoted": upvoted,
            "upvotes_count": complaint.upvotes_count,
            "new_severity_score": float(cluster.severity_score) if cluster else None,
            "mentions_count": cluster.mentions_count if cluster else 1
        }, status=status.HTTP_200_OK)
