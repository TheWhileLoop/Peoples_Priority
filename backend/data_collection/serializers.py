from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from .models import Complaint, ComplaintUpvote

class ComplaintSerializer(serializers.ModelSerializer):
    is_upvoted = serializers.SerializerMethodField()
    citizen_name = serializers.SerializerMethodField()
    citizen_location = serializers.SerializerMethodField()

    # Make description not required at serializer level
    description = serializers.CharField(required=False, allow_blank=True, default='Complaint submitted.')

    # Accept any JS floating point precision — validate methods will round to 6 dp
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = Complaint
        fields = '__all__'
        # These fields are set by the server, not the client
        read_only_fields = ['user', 'citizen', 'status', 'ai_category', 'ai_confidence',
                            'processed_text', 'cluster', 'upvotes_count', 'created_at']

    def validate_latitude(self, value):
        """Round latitude to 6 decimal places to fit model's max_digits=9"""
        if value is None:
            return value
        try:
            return Decimal(str(value)).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        except InvalidOperation:
            return None

    def validate_longitude(self, value):
        """Round longitude to 6 decimal places to fit model's max_digits=9"""
        if value is None:
            return value
        try:
            return Decimal(str(value)).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        except InvalidOperation:
            return None

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
