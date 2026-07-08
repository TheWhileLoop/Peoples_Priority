from django.urls import path
from . import views

urlpatterns = [
    path('complaints/', views.complaint_list, name='complaint-list'),
    path('complaints/<int:pk>/', views.complaint_detail, name='complaint-detail'),
    path('complaints/<int:pk>/upvote/', views.complaint_upvote, name='complaint-upvote'),
    
    path('posts/', views.complaint_list, name='post-list'),
    path('posts/<int:pk>/', views.complaint_detail, name='post-detail'),
    path('posts/<int:pk>/upvote/', views.complaint_upvote, name='post-upvote'),
]
