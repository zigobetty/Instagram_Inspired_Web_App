from django.core.management.base import BaseCommand
from instagram_main.models import User, UserFollow


class Command(BaseCommand):
    help = 'Sinkronizira following i followers brojače s UserFollow tablicom'

    def handle(self, *args, **options):
        self.stdout.write('Počinje sinkronizacija follow brojača...')
        
        # Resetiraj sve brojače na 0
        User.objects.all().update(following=0, followers=0)
        self.stdout.write('Resetirani svi brojači na 0')
        
        # Ažuriraj following brojače
        for user in User.objects.all():
            following_count = UserFollow.objects.filter(follower=user).count()
            user.following = following_count
            user.save()
            self.stdout.write(f'User {user.username} (ID: {user.id}): following = {following_count}')
        
        # Ažuriraj followers brojače
        for user in User.objects.all():
            followers_count = UserFollow.objects.filter(following=user).count()
            user.followers = followers_count
            user.save()
            self.stdout.write(f'User {user.username} (ID: {user.id}): followers = {followers_count}')
        
        self.stdout.write(
            self.style.SUCCESS('Uspješno sinkronizirani svi follow brojači!')
        )
