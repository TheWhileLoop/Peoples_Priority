from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IssueClusterViewSet, analyze_complaint, weekly_summary

router = DefaultRouter()
router.register(r'clusters', IssueClusterViewSet)

urlpatterns = [
    path('analyze-complaint/', analyze_complaint, name='analyze_complaint'),
    path('weekly-summary/', weekly_summary, name='weekly_summary'),
    path('', include(router.urls)),
]
