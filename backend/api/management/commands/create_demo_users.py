from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates demo users (Admin and Citizen)'

    def handle(self, *args, **kwargs):
        # Admin User
        admin_user, created = User.objects.get_or_create(username='admin')
        if created:
            admin_user.email = 'admin@demo.com'
            admin_user.set_password('demo_admin123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Successfully created Demo Admin (admin@demo.com)'))
        else:
            self.stdout.write('Demo Admin already exists.')

        # Citizen User
        citizen_user, created = User.objects.get_or_create(username='citizen')
        if created:
            citizen_user.email = 'citizen@demo.com'
            citizen_user.set_password('demo_citizen123')
            citizen_user.is_staff = False
            citizen_user.save()
            self.stdout.write(self.style.SUCCESS('Successfully created Demo Citizen (citizen@demo.com)'))
        else:
            self.stdout.write('Demo Citizen already exists.')
