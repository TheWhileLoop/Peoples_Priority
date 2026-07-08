from django.core.management.base import BaseCommand
from analysis.tasks import generate_weekly_briefing


class Command(BaseCommand):
    """
    Runs the AI weekly briefing generation immediately, as a normal synchronous function call.

    This exists so the weekly report can be produced WITHOUT Celery Beat or Redis running at all:
    point your hosting platform's Cron Job feature (or an external scheduler like cron-job.org /
    a GitHub Actions scheduled workflow hitting a protected endpoint) at:

        python manage.py run_weekly_briefing

    on a "every Monday" schedule, instead of running a long-lived `celery beat` process.
    """
    help = 'Generates the AI weekly briefing immediately (no Celery Beat / Redis required).'

    def handle(self, *args, **kwargs):
        result = generate_weekly_briefing()
        self.stdout.write(self.style.SUCCESS(f'Weekly briefing task finished: {result}'))
