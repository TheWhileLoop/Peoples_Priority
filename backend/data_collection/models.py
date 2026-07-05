from django.db import models
from django.contrib.auth.models import User

class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('roads', 'Roads & Infrastructure'),
        ('water', 'Water Supply'),
        ('electricity', 'Electricity'),
        ('sanitation', 'Sanitation & Waste'),
        ('health', 'Public Health'),
        ('safety', 'Public Safety'),
        ('animals', 'Stray Animals'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending_ai', 'AI Scanning'),
        ('verified', 'Verified'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints', null=True, blank=True)
    citizen = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints_citizen')
    title = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField()
    audio_file = models.FileField(upload_to='complaints/audio/', null=True, blank=True)
    image_file = models.ImageField(upload_to='complaints/images/', null=True, blank=True)
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending_ai')
    
    # AI enrichment results
    ai_category = models.CharField(max_length=50, null=True, blank=True)
    ai_confidence = models.FloatField(default=1.0)
    processed_text = models.TextField(null=True, blank=True)
    
    # Location details
    ward = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Upvoting and clustering
    upvotes_count = models.IntegerField(default=0)
    cluster = models.ForeignKey('analysis.IssueCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint {self.id} - {self.category} ({self.status})"


class ComplaintUpvote(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='upvotes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaint_upvotes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('complaint', 'user')

    def __str__(self):
        return f"{self.user.username} upvoted Complaint {self.complaint.id}"


# Trigger Celery Task when a Complaint is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Complaint)
def trigger_ai_analysis(sender, instance, created, **kwargs):
    if created:
        from analysis.tasks import process_complaint_with_ai
        # Trigger Celery task asynchronously
        process_complaint_with_ai.delay(instance.id)

