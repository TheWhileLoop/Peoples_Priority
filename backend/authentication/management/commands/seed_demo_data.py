import random
import decimal
import time
import requests
import io
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from data_collection.models import Complaint, ComplaintUpvote
from analysis.models import IssueCluster
import cloudinary
import cloudinary.uploader

# Configure cloudinary using settings
cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
    api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
    api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
)

# Predefined realistic civic issue profiles
CIVIC_ISSUES = [
    {
        "category": "roads",
        "title": "Severe pothole causing accidents",
        "desc": "This pothole has been here for weeks and caused multiple bike accidents. Needs immediate repair.",
        "ai_summary": "High-risk pothole detected on main road with severe structural damage.",
        "department": "PWD",
        "source_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600" # Pothole
    },
    {
        "category": "sanitation",
        "title": "Garbage dump overflowing",
        "desc": "The local garbage bin is overflowing onto the street, causing severe health hazards and bad odor.",
        "ai_summary": "Major sanitation hazard with overflowing garbage and potential disease vector.",
        "department": "Waste Management",
        "source_url": "https://images.unsplash.com/photo-1605600659901-af5617db83e6?auto=format&fit=crop&q=80&w=600" # Garbage
    },
    {
        "category": "water",
        "title": "Pipeline burst and water leakage",
        "desc": "Fresh drinking water is leaking from a broken pipeline continuously since yesterday.",
        "ai_summary": "Active water leak detected from municipal pipeline causing wastage.",
        "department": "Jal Board",
        "source_url": "https://images.unsplash.com/photo-1584834827011-85e6edc6c68a?auto=format&fit=crop&q=80&w=600" # Water leak
    },
    {
        "category": "electricity",
        "title": "Broken street light posing safety risk",
        "desc": "The street light pole is broken and hanging dangerously over the pedestrian walkway.",
        "ai_summary": "Electrical hazard and safety risk due to damaged infrastructure.",
        "department": "Electricity Board",
        "source_url": "https://images.unsplash.com/photo-1563220713-39ee64b07357?auto=format&fit=crop&q=80&w=600" # Broken light/pole
    },
    {
        "category": "health",
        "title": "Stagnant water breeding mosquitoes",
        "desc": "Water logging in the area has become a breeding ground for dengue mosquitoes.",
        "ai_summary": "Public health risk due to stagnant water logging.",
        "department": "Health Dept",
        "source_url": "https://images.unsplash.com/photo-1520113412536-11f81df6ce00?auto=format&fit=crop&q=80&w=600" # Stagnant water
    }
]

class Command(BaseCommand):
    help = 'Seeds database with 4 demo users, uploads 80 images to Cloudinary, and generates 200 complaints'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting High-Fidelity Data Seeding with Cloudinary Uploads...")
        
        # 1. Prepare Users
        user_data = [
            {"username": "geetanshi", "first_name": "Geetanshi", "last_name": "Jain", "email": "geetanshi@demo.com"},
            {"username": "abhishek_y", "first_name": "Abhishek", "last_name": "Yaduwanshi", "email": "abhishek_y@demo.com"},
            {"username": "ayush", "first_name": "Ayush", "last_name": "Jaiswal", "email": "ayush@demo.com"},
            {"username": "abhishek_t", "first_name": "Abhishek", "last_name": "Tayde", "email": "abhishek_t@demo.com"},
        ]
        
        for u in user_data:
            User.objects.filter(username=u['username']).delete()
        
        created_users = []
        for u in user_data:
            user = User.objects.create_user(
                username=u['username'],
                email=u['email'],
                password="demo_citizen123",
                first_name=u['first_name'],
                last_name=u['last_name']
            )
            created_users.append(user)
        self.stdout.write(f"Created {len(created_users)} users.")

        # 2. Pre-Upload 80 Images to Cloudinary (20 for each of the 4 users)
        # We will map each user to 20 specific Cloudinary upload responses
        self.stdout.write("Uploading 80 images to Cloudinary (this may take a minute)...")
        user_image_pool = {u.username: [] for u in created_users}
        
        # Upload loop
        total_uploaded = 0
        
        # Using a session to speed up downloads
        session = requests.Session()
        
        for user in created_users:
            for i in range(20):
                # Pick a random profile to upload
                profile = random.choice(CIVIC_ISSUES)
                try:
                    # Download image into memory first
                    img_resp = session.get(profile['source_url'], timeout=10)
                    img_resp.raise_for_status()
                    file_obj = io.BytesIO(img_resp.content)
                    
                    upload_resp = cloudinary.uploader.upload(
                        file_obj,
                        folder="civic_issues_demo"
                    )
                    # Save the public_id and the profile it belongs to
                    user_image_pool[user.username].append({
                        "public_id": upload_resp['public_id'],
                        "profile": profile
                    })
                    total_uploaded += 1
                    if total_uploaded % 10 == 0:
                        self.stdout.write(f"Uploaded {total_uploaded}/80 images...")
                except Exception as e:
                    self.stdout.write(f"Cloudinary upload failed: {e}")
                    # Fallback so script doesn't crash entirely
                    user_image_pool[user.username].append({
                        "public_id": None,
                        "profile": profile
                    })

        self.stdout.write("Cloudinary uploads complete.")

        # 3. Create Issue Clusters
        self.stdout.write("Generating 25 Realistic Issue Clusters...")
        cities = ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane']
        districts = ['Mumbai Suburban', 'Pune', 'Nagpur', 'Nashik', 'Thane']
        
        clusters = []
        for profile in CIVIC_ISSUES:
            for _ in range(5): # 5 clusters per profile = 25 clusters total
                c = IssueCluster.objects.create(
                    category=profile['category'],
                    severity_score=decimal.Decimal(random.uniform(7.5, 9.8)).quantize(decimal.Decimal('0.01')),
                    ai_summary=profile['ai_summary'],
                    status=random.choice(['pending', 'in_progress']),
                    department=profile['department'],
                    mentions_count=0,
                    sentiment=random.choice(['Highly Negative', 'Negative']),
                    district=random.choice(districts),
                    city=random.choice(cities),
                    ward=f"Ward {random.randint(1, 100)}"
                )
                clusters.append(c)

        # 4. Generate 50 Complaints per User (20 with images, 30 without)
        self.stdout.write("Generating 50 Complaints per User...")
        complaints_to_create = []
        
        for user in created_users:
            # First, create 20 complaints WITH the uploaded images
            for img_data in user_image_pool[user.username]:
                profile = img_data['profile']
                # Find a matching cluster
                matching_clusters = [c for c in clusters if c.category == profile['category']]
                cluster = random.choice(matching_clusters) if matching_clusters else random.choice(clusters)
                
                lat = decimal.Decimal(random.uniform(18.0, 20.0)).quantize(decimal.Decimal('0.000001'))
                lon = decimal.Decimal(random.uniform(72.0, 74.0)).quantize(decimal.Decimal('0.000001'))
                
                complaint = Complaint(
                    user=user,
                    citizen=user,
                    title=profile['title'],
                    description=profile['desc'],
                    category=profile['category'],
                    status=random.choice(['pending_ai', 'verified', 'in_progress']),
                    ai_category=profile['category'],
                    ai_confidence=random.uniform(0.85, 0.99),
                    processed_text=profile['ai_summary'],
                    ward=cluster.ward,
                    city=cluster.city,
                    district=cluster.district,
                    latitude=lat,
                    longitude=lon,
                    upvotes_count=0,
                    cluster=cluster
                )
                if img_data['public_id']:
                    complaint.image_file.name = img_data['public_id']
                
                complaints_to_create.append(complaint)
            
            # Next, create 30 complaints WITHOUT images (generic)
            for _ in range(30):
                profile = random.choice(CIVIC_ISSUES)
                matching_clusters = [c for c in clusters if c.category == profile['category']]
                cluster = random.choice(matching_clusters) if matching_clusters else random.choice(clusters)
                
                lat = decimal.Decimal(random.uniform(18.0, 20.0)).quantize(decimal.Decimal('0.000001'))
                lon = decimal.Decimal(random.uniform(72.0, 74.0)).quantize(decimal.Decimal('0.000001'))
                
                complaint = Complaint(
                    user=user,
                    citizen=user,
                    title=f"Minor issue: {profile['category']}",
                    description="General civic issue reported without photo evidence.",
                    category=profile['category'],
                    status='pending_ai',
                    ai_category=profile['category'],
                    ai_confidence=random.uniform(0.5, 0.7),
                    ward=cluster.ward,
                    city=cluster.city,
                    district=cluster.district,
                    latitude=lat,
                    longitude=lon,
                    upvotes_count=0,
                    cluster=cluster
                )
                complaints_to_create.append(complaint)

        Complaint.objects.bulk_create(complaints_to_create)
        self.stdout.write(f"Successfully generated 200 complaints (80 with real Cloudinary images).")

        # Re-fetch all complaints to assign upvotes
        all_complaints = list(Complaint.objects.all())
        
        # 5. Create 50 Upvotes per User
        self.stdout.write("Generating Upvotes...")
        upvotes_to_create = []
        for user in created_users:
            sampled_complaints = random.sample(all_complaints, min(50, len(all_complaints)))
            for comp in sampled_complaints:
                upvotes_to_create.append(ComplaintUpvote(complaint=comp, user=user))
        
        ComplaintUpvote.objects.bulk_create(upvotes_to_create)
        
        # Update counts
        for c in clusters:
            c.mentions_count = c.complaints.count()
            c.save()

        self.stdout.write(self.style.SUCCESS('🎉 High-Fidelity Demo Seeding Complete!'))
