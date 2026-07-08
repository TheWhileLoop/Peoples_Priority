from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from decimal import Decimal
from .models import Complaint, ComplaintUpvote
from .serializers import ComplaintSerializer


@api_view(['GET', 'POST'])
def complaint_list(request):
    if request.method == 'GET':
        complaints = Complaint.objects.all().order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ComplaintSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                # Save complaint to DB (this also triggers Cloudinary upload for files)
                if request.user.is_authenticated:
                    instance = serializer.save(user=request.user)
                else:
                    instance = serializer.save()
            except Exception as save_error:
                print(f"File save error (possibly Cloudinary): {save_error}")
                # Save WITHOUT the file if Cloudinary fails
                try:
                    mutable_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
                    mutable_data.pop('audio_file', None)
                    mutable_data.pop('image_file', None)
                    clean_serializer = ComplaintSerializer(data=mutable_data, context={'request': request})
                    if clean_serializer.is_valid():
                        if request.user.is_authenticated:
                            instance = clean_serializer.save(user=request.user)
                        else:
                            instance = clean_serializer.save()
                        serializer = clean_serializer
                    else:
                        return Response({'error': 'Could not save complaint. Please try again.'}, 
                                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                except Exception as fallback_error:
                    print(f"Fallback save also failed: {fallback_error}")
                    return Response({'error': str(fallback_error)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Trigger AI processing in background (Celery) or synchronously as fallback
            try:
                from analysis.tasks import process_complaint_with_ai
                process_complaint_with_ai.delay(instance.id)
            except Exception as e:
                print(f"Warning: Celery/Redis unreachable. Running AI processing synchronously. Error: {e}")
                try:
                    from analysis.tasks import process_complaint_with_ai
                    process_complaint_with_ai(instance.id)
                except Exception as sync_e:
                    print(f"Synchronous AI processing also failed: {sync_e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print("Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def complaint_detail(request, pk):
    try:
        complaint = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ComplaintSerializer(complaint, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        serializer = ComplaintSerializer(complaint, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        complaint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def complaint_upvote(request, pk):
    """
    Endpoint: POST /api/collect/complaints/<id>/upvote/
    Toggles the upvote for the current logged-in user on a complaint.
    Recalculates the master IssueCluster severity score and mentions count.
    """
    try:
        complaint = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    user = request.user

    if not user.is_authenticated:
        return Response({"error": "Authentication required to upvote complaints."}, 
                        status=status.HTTP_401_UNAUTHORIZED)

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
        base_severity = Decimal('4.0')
        new_severity = base_severity + Decimal(str(cluster.mentions_count * 0.1)) + Decimal(str(total_upvotes * 0.05))
        cluster.severity_score = min(new_severity, Decimal('10.0'))

        # Log action
        if not isinstance(cluster.action_log, list):
            cluster.action_log = []
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
