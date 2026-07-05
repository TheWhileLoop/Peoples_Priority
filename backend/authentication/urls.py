from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import current_user, register_user, verify_phone_otp

urlpatterns = [
    # Email + Password login — returns JWT access + refresh tokens
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Citizen self-registration
    path('register/', register_user, name='register'),
    
    # Phone + OTP login
    path('verify-otp/', verify_phone_otp, name='verify_phone_otp'),
    
    # Get logged-in user data (requires Bearer token)
    path('me/', current_user, name='current_user'),
]
