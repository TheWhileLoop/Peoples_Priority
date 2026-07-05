from django.db import models
from django.contrib.auth.models import User
import uuid

class IssueCluster(models.fields.Field):
    pass # Defined later

class IssueCluster(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="AI Generated Title for the Cluster")
    severity_score = models.FloatField(default=0.0, help_text="1.0 to 10.0")
    sentiment = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50, default="Pending", choices=[
        ("Pending", "Pending"),
        ("In Progress", "In Progress"),
        ("Resolved", "Resolved")
    ])
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Approx center location of the cluster
    center_latitude = models.FloatField(blank=True, null=True)
    center_longitude = models.FloatField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (Severity: {self.severity_score})"


class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True) # allow anonymous for now
    
    raw_text = models.TextField(blank=True, null=True)
    audio_file = models.FileField(upload_to='complaints/audio/', blank=True, null=True)
    photo = models.ImageField(upload_to='complaints/photos/', blank=True, null=True)
    
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    
    ward_name = models.CharField(max_length=255, blank=True, null=True)
    ai_category = models.CharField(max_length=100, blank=True, null=True)
    
    cluster = models.ForeignKey(IssueCluster, on_delete=models.SET_NULL, blank=True, null=True, related_name="complaints")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint {self.id} in {self.ward_name}"
