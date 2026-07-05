from django.db import models

class IssueCluster(models.Model):
    title = models.CharField(max_length=255)
    ai_summary = models.TextField()
    category = models.CharField(max_length=50)
    severity_score = models.DecimalField(max_digits=4, decimal_places=2, default=0.0) # out of 10
    mentions_count = models.IntegerField(default=1)
    sentiment = models.CharField(max_length=50, null=True, blank=True)
    
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending_ai', 'Pending AI Review'),
            ('pending_dept', 'Pending Department'),
            ('in_progress', 'In Progress'),
            ('resolved', 'Resolved')
        ],
        default='pending_ai'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.severity_score}/10)"

