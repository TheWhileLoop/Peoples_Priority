from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/collect/', include('data_collection.urls')),
    path('api/admin/', include('analysis.urls')),
    path('api/', include('analysis.urls')),
]
