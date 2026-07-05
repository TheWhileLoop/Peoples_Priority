from rest_framework import serializers
from .models import IssueCluster

class IssueClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCluster
        fields = '__all__'
