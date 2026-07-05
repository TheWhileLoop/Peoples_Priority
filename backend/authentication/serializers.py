from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'role', 'country', 'state', 'district', 'city', 'address']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile']


class RegistrationSerializer(serializers.Serializer):
    # Account fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    
    # Contact fields
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    
    # Location fields
    country = serializers.CharField(max_length=100, default='India')
    state = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    city = serializers.CharField(max_length=100)
    address = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        # Extract profile fields
        phone_number = validated_data.pop('phone_number', '')
        country = validated_data.pop('country', 'India')
        state = validated_data.pop('state')
        district = validated_data.pop('district')
        city = validated_data.pop('city')
        address = validated_data.pop('address', '')

        # Create User — use email as username
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        # Update/create UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone_number = phone_number
        profile.role = 'citizen'
        profile.country = country
        profile.state = state
        profile.district = district
        profile.city = city
        profile.address = address
        profile.save()

        return user
