from rest_framework import serializers
from .models import IssueCluster
from data_collection.serializers import ComplaintSerializer

class IssueClusterSerializer(serializers.ModelSerializer):
    complaints = ComplaintSerializer(many=True, read_only=True)

    class Meta:
        model = IssueCluster
        fields = [
            'id', 'title', 'ai_summary', 'category', 'severity_score', 
            'mentions_count', 'sentiment', 'status', 'state', 'district', 
            'department', 'center_latitude', 'center_longitude', 
            'action_log', 'created_at', 'updated_at', 'complaints'
        ]
