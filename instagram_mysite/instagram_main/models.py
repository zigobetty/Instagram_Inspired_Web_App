from django.db import models

class User(models.Model):
    username = models.CharField(max_length=30, unique=True)
    contact_info = models.CharField(max_length=255, unique=True)  
    full_name = models.CharField(max_length=100)
    password = models.CharField(max_length=128)  
    posts = models.IntegerField(default=0)  # Dodano polje za broj objava
    followers = models.IntegerField(default=0)  # Dodano polje za broj pratitelja
    following = models.IntegerField(default=0)  # Dodano polje za broj praćenja
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
