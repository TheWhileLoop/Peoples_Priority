from rest_framework import serializers
from .models import Complaint, ComplaintUpvote

class ComplaintSerializer(serializers.ModelSerializer):
    is_upvoted = serializers.SerializerMethodField()
    citizen_name = serializers.SerializerMethodField()
    citizen_location = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = '__all__'

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def get_citizen_name(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else f"Citizen @{obj.user.username.split('@')[0]}"
        return "Anonymous Citizen"

    def get_citizen_location(self, obj):
        if obj.user and hasattr(obj.user, 'profile'):
            profile = obj.user.profile
            if profile.city and profile.state:
                return f"{profile.city}, {profile.state}"
        return obj.ward if obj.ward else "India"
