from django.db import models

class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('roads', 'Roads & Infrastructure'),
        ('water', 'Water Supply'),
        ('electricity', 'Electricity'),
        ('sanitation', 'Sanitation & Waste'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField()
    audio_file = models.FileField(upload_to='complaints/audio/', null=True, blank=True)
    image_file = models.ImageField(upload_to='complaints/images/', null=True, blank=True)
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    ward = models.CharField(max_length=100, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Optional relation to the AI cluster
    cluster = models.ForeignKey('analysis.IssueCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint {self.id} - {self.category}"

