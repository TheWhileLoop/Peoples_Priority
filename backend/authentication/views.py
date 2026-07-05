from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegistrationSerializer
from .models import UserProfile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Returns the currently authenticated user's data including profile."""
    serializer = UserSerializer(request.user)
    data = serializer.data
    data['is_staff'] = request.user.is_staff
    # Flatten role from profile for easy frontend use
    if hasattr(request.user, 'profile'):
        data['role'] = request.user.profile.role
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Citizen self-registration endpoint.
    Creates a User + UserProfile with Indian geographic details.
    Returns a JWT token pair on successful registration.
    """
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'message': 'Registration successful! Welcome to People\'s Priority.',
            'user': user_data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    """
    Phone + OTP login endpoint.
    Simulates OTP verification. In production, replace '1234' with real OTP logic.
    If the phone number doesn't exist in DB, prompts user to register.
    """
    phone_number = request.data.get('phone_number', '').strip()
    otp_code = request.data.get('otp_code', '').strip()

    if not phone_number:
        return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not otp_code:
        return Response({'error': 'OTP code is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Simulated OTP verification — replace with real SMS OTP in production
    if otp_code != '1234':
        return Response({'error': 'Invalid OTP. Please enter the correct code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Look up the user with this phone number
    try:
        profile = UserProfile.objects.select_related('user').get(phone_number=phone_number)
        user = profile.user
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'No account found with this phone number. Please register first.',
            'needs_registration': True,
        }, status=status.HTTP_404_NOT_FOUND)

    # Generate JWT tokens for the found user
    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data
    return Response({
        'message': f'Welcome back, {user.first_name}!',
        'user': user_data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_200_OK)
