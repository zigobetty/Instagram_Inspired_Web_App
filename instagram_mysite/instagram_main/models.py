from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from django.conf import settings


class User(models.Model):
    username = models.CharField(max_length=30, unique=True)
    contact_info = models.CharField(max_length=255, unique=True)  
    full_name = models.CharField(max_length=100)
    password = models.CharField(max_length=128) 
    posts = models.IntegerField(default=0)  # Dodano polje za broj objava
    unique_id = models.CharField(max_length=255, unique=True, null=True)  # Novi atribut za jedinstveni ID

    followers = models.IntegerField(default=0)  # Dodano polje za broj pratitelja
    following = models.IntegerField(default=0)  # Dodano polje za broj praćenja
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    profile_image = models.ImageField(upload_to="profile_pics/", null=True, blank=True)


    def __str__(self):
        return self.username
    
class UserPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='user_images/')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class UserComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"

