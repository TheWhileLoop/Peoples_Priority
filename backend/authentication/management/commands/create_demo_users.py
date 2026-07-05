from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from authentication.models import UserProfile


class Command(BaseCommand):
    help = 'Creates demo users (Admin and Citizen) with profiles'

    def handle(self, *args, **kwargs):
        # -- Admin / MP User --
        admin_user, created = User.objects.get_or_create(username='admin')
        if created:
            admin_user.email = 'admin@demo.com'
            admin_user.set_password('demo_admin123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.first_name = 'MP Office'
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('[OK] Created Demo Admin (admin / demo_admin123)'))
        else:
            self.stdout.write('[INFO] Demo Admin already exists.')

        # Ensure admin has a profile
        profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        profile.role = 'admin'
        profile.phone_number = '9000000001'
        profile.country = 'India'
        profile.state = 'Maharashtra'
        profile.district = 'Mumbai'
        profile.city = 'Mumbai'
        profile.address = 'Parliament House, New Delhi'
        profile.save()

        # -- Citizen User --
        citizen_user, created = User.objects.get_or_create(username='citizen')
        if created:
            citizen_user.email = 'citizen@demo.com'
            citizen_user.set_password('demo_citizen123')
            citizen_user.is_staff = False
            citizen_user.first_name = 'Abhishek'
            citizen_user.last_name = 'Demo'
            citizen_user.save()
            self.stdout.write(self.style.SUCCESS('[OK] Created Demo Citizen (citizen / demo_citizen123)'))
        else:
            self.stdout.write('[INFO] Demo Citizen already exists.')

        # Ensure citizen has a profile
        profile, _ = UserProfile.objects.get_or_create(user=citizen_user)
        profile.role = 'citizen'
        profile.phone_number = '9876543210'
        profile.country = 'India'
        profile.state = 'Maharashtra'
        profile.district = 'Pune'
        profile.city = 'Pune'
        profile.address = 'Ward 5, Kothrud, Pune'
        profile.save()

        self.stdout.write(self.style.SUCCESS('\nDemo users ready! Login with:'))
        self.stdout.write('  Citizen --> email: citizen@demo.com | pass: demo_citizen123 | phone: 9876543210')
        self.stdout.write('  Admin   --> email: admin@demo.com   | pass: demo_admin123   | phone: 9000000001')
