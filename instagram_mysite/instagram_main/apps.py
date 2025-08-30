from django.apps import AppConfig


class InstagramMainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'instagram_main'
    
    def ready(self):
        import instagram_main.signals
