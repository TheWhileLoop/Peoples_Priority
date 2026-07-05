from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ComplaintViewSet, IssueClusterViewSet, current_user

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet)
router.register(r'clusters', IssueClusterViewSet)

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', current_user, name='current_user'),
    path('', include(router.urls)),
]
