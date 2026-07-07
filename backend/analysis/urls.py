from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IssueClusterViewSet, 
    analyze_complaint, 
    retrieve_weekly_summary,
    download_pdf,
    send_whatsapp,
    admin_stats,
    admin_filters
)

router = DefaultRouter()
router.register(r'clusters', IssueClusterViewSet, basename='cluster')

urlpatterns = [
    # Dashboard Overview & Filters
    path('stats/', admin_stats, name='admin_stats'),
    path('filters/', admin_filters, name='admin_filters'),
    
    # Weekly Summary & Reports
    path('weekly-summary/', retrieve_weekly_summary, name='weekly_summary'),
    path('weekly-summary/download-pdf/', download_pdf, name='download_pdf'),
    path('weekly-summary/send-whatsapp/', send_whatsapp, name='send_whatsapp'),
    
    # Single Complaint AI Analysis
    path('analyze-complaint/', analyze_complaint, name='analyze_complaint'),
    
    # Router for /clusters/ and /clusters/<id>/complaints/
    path('', include(router.urls)),
]
