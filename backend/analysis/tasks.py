import logging
from celery import shared_task
from django.db import transaction
from django.contrib.auth.models import User
from decimal import Decimal
from data_collection.models import Complaint
from .models import IssueCluster
from .gemini_service import analyze_civic_complaint

logger = logging.getLogger(__name__)

def get_average(lst):
    return sum(lst) / len(lst) if lst else None

@shared_task
def process_complaint_with_ai(complaint_id):
    """
    Celery background task to analyze a complaint using Gemini, 
    enrich its AI categories, and dynamically cluster it.
    """
    logger.info(f"Starting AI analysis for Complaint ID: {complaint_id}")
    
    try:
        with transaction.atomic():
            complaint = Complaint.objects.select_related('user', 'user__profile').get(id=complaint_id)
            
            # 1. Fetch URLs for images/audio from Cloudinary
            image_url = complaint.image_file.url if complaint.image_file else None
            audio_url = complaint.audio_file.url if complaint.audio_file else None
            
            # 2. Call Gemini Service
            logger.info("Executing Gemini model analysis...")
            ai_data = analyze_civic_complaint(
                description=complaint.description,
                image_url=image_url,
                audio_url=audio_url
            )
            logger.info(f"Gemini returned analysis: {ai_data}")
            
            # Update complaint fields
            complaint.ai_category = ai_data.get('category', 'other')
            complaint.processed_text = ai_data.get('ai_summary', '')
            complaint.status = 'verified'
            
            # 3. Retrieve geographical boundaries from user profile
            state = 'Other'
            district = 'Other'
            if complaint.user and hasattr(complaint.user, 'profile'):
                state = complaint.user.profile.state or 'Other'
                district = complaint.user.profile.district or 'Other'
            
            # Resolve State and District from Ward name for seamless demo mapping
            if state == 'Other' or not state:
                if complaint.ward and any(w in complaint.ward for w in ['Andheri East', 'Sector 5', 'Vile Parle', 'Sector 3']):
                    state = 'Maharashtra'
                    district = 'Mumbai'
                else:
                    state = 'Maharashtra'
                    district = 'Mumbai'
            
            # Retrieve coordinates
            lat = complaint.latitude
            lng = complaint.longitude
            
            # If coordinates are missing, fallback to profile defaults or nominal values
            if lat is None or lng is None:
                lat = Decimal('19.0760') # Default coordinates (e.g. Mumbai)
                lng = Decimal('72.8777')
                complaint.latitude = lat
                complaint.longitude = lng

            # 4. Spatial Clustering (2km radius check: ~0.018 degree delta)
            # Find matching clusters in the same state, district, ward, and category
            category = complaint.ai_category
            lat_delta = Decimal('0.018')
            lng_delta = Decimal('0.018')
            
            existing_cluster = IssueCluster.objects.filter(
                state=state,
                district=district,
                ward=complaint.ward,
                category=category,
                status__in=['pending_ai', 'pending_dept', 'in_progress'],
                center_latitude__range=(lat - lat_delta, lat + lat_delta),
                center_longitude__range=(lng - lng_delta, lng + lng_delta)
            ).first()
            
            if existing_cluster:
                logger.info(f"Matching cluster found: {existing_cluster.title} (ID: {existing_cluster.id})")
                complaint.cluster = existing_cluster
                complaint.save()
                
                # Recalculate cluster properties
                cluster_complaints = list(existing_cluster.complaints.all())
                
                # Update center location as average coordinates
                latitudes = [c.latitude for c in cluster_complaints if c.latitude is not None]
                longitudes = [c.longitude for c in cluster_complaints if c.longitude is not None]
                
                if latitudes:
                    existing_cluster.center_latitude = sum(latitudes) / len(latitudes)
                if longitudes:
                    existing_cluster.center_longitude = sum(longitudes) / len(longitudes)
                
                # Mentions count
                existing_cluster.mentions_count = len(cluster_complaints)
                
                # Severity calculation: Base Gemini severity + upvote/mention scaling
                # Each complaint adds to severity, upvotes add weight
                total_complaint_upvotes = sum(c.upvotes_count for c in cluster_complaints)
                base_severity = Decimal(str(ai_data.get('severity_score', 3.0)))
                
                # Cap the final severity at 10.0
                new_severity = base_severity + Decimal(str(len(cluster_complaints) * 0.1)) + Decimal(str(total_complaint_upvotes * 0.05))
                existing_cluster.severity_score = min(new_severity, Decimal('10.0'))
                
                # Append to action log
                existing_cluster.action_log.append({
                    "action": "complaint_added",
                    "complaint_id": complaint.id,
                    "new_severity": float(existing_cluster.severity_score)
                })
                existing_cluster.save()
            else:
                logger.info("No matching cluster found. Creating a new IssueCluster.")
                # Create a new master cluster
                new_cluster = IssueCluster.objects.create(
                    title=ai_data.get('ai_summary', 'Civic Issue')[:100],
                    ai_summary=ai_data.get('ai_summary', ''),
                    category=category,
                    severity_score=Decimal(str(ai_data.get('severity_score', 3.0))),
                    mentions_count=1,
                    sentiment=ai_data.get('sentiment', 'Concerned'),
                    status='pending_dept', # Promoted to pending department routing
                    state=state,
                    district=district,
                    ward=complaint.ward,
                    department=ai_data.get('department', 'Collectorate Office'),
                    center_latitude=lat,
                    center_longitude=lng,
                    action_log=[{
                        "action": "created",
                        "complaint_id": complaint.id,
                        "initial_severity": float(ai_data.get('severity_score', 3.0))
                    }]
                )
                complaint.cluster = new_cluster
                complaint.save()
            
            logger.info("AI Analysis and clustering completed successfully.")
            
    except Complaint.DoesNotExist:
        logger.error(f"Complaint with ID {complaint_id} does not exist.")
    except Exception as e:
        logger.error(f"Error in process_complaint_with_ai task: {e}", exc_info=True)
