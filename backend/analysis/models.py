from django.db import models
from django.contrib.auth.models import User

class IssueCluster(models.Model):
    STATUS_CHOICES = [
        ('pending_ai', 'Pending AI Review'),
        ('pending_dept', 'Pending Department'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved')
    ]

    title = models.CharField(max_length=255)
    ai_summary = models.TextField()
    category = models.CharField(max_length=50)
    severity_score = models.DecimalField(max_digits=4, decimal_places=2, default=0.0) # out of 10
    mentions_count = models.IntegerField(default=1)
    sentiment = models.CharField(max_length=50, null=True, blank=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending_ai')
    
    # State-wise, District-wise, and Ward routing
    state = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    ward = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    
    # Geographical average location
    center_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    center_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    action_log = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.severity_score}/10)"


class AdminAction(models.Model):
    cluster = models.ForeignKey(IssueCluster, on_delete=models.CASCADE, related_name='actions')
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50) # status_change, dept_routed, escalated
    old_value = models.CharField(max_length=255, null=True, blank=True)
    new_value = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.admin_user.username} - {self.action_type} on Cluster {self.cluster.id}"

class WeeklyBriefing(models.Model):
    week_start_date = models.DateField()
    executive_summary = models.TextField()
    critical_bottleneck = models.TextField()
    successful_resolution = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Weekly Briefing for week of {self.week_start_date}"
