from rest_framework import serializers
from .models import Complaint, IssueCluster
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class IssueClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCluster
        fields = '__all__'

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = '__all__'
