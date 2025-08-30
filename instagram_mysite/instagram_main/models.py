from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
import uuid



class CustomUserManager(BaseUserManager):
    def create_user(self, contact_info, username, full_name, password=None, **extra_fields):
        if not contact_info:
            raise ValueError("Contact info is required")
        if not username:
            raise ValueError("Username is required")
        user = self.model(
            contact_info=contact_info,
            username=username,
            full_name=full_name,
            unique_id=str(uuid.uuid4()),
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, contact_info, username, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(contact_info, username, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=30, unique=True)
    contact_info = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=100)
    password = models.CharField(max_length=128)
    posts = models.IntegerField(default=0)
    unique_id = models.CharField(max_length=255, unique=True, null=True)
    followers = models.IntegerField(default=0)
    following = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    profile_image = models.ImageField(upload_to="profile_pics/", null=True, blank=True)
    
    bio = models.TextField(blank=True, null=True, max_length=150)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'contact_info'  # koristi kontakt (email ili broj) za login
    REQUIRED_FIELDS = ['username', 'full_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.username

# class User(models.Model):
#     username = models.CharField(max_length=30, unique=True)
#     contact_info = models.CharField(max_length=255, unique=True)  
#     full_name = models.CharField(max_length=100)
#     password = models.CharField(max_length=128) 
#     posts = models.IntegerField(default=0)  # Dodano polje za broj objava
#     unique_id = models.CharField(max_length=255, unique=True, null=True)  # Novi atribut za jedinstveni ID

#     followers = models.IntegerField(default=0)  # Dodano polje za broj pratitelja
#     following = models.IntegerField(default=0)  
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     profile_image = models.ImageField(upload_to="profile_pics/", null=True, blank=True)


#     def __str__(self):
#         return self.username
    
class UserPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='user_images/', null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class UserPostImage(models.Model):
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to='user_images/')
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order_index", "id"]

    def __str__(self):
        return f"Image {self.id} for post {self.post_id}"

class UserComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"


class UserFollow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_relationships')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower_relationships')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(UserComment, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} likes comment {self.comment.id}"


class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} likes post {self.post.id}"


class SavedPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_posts")
    post = models.ForeignKey(UserPost, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} saved post {self.post.id}"


# Chat Models
class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        participant_names = [user.username for user in self.participants.all()]
        return f"Conversation between {', '.join(participant_names)}"

    def get_other_participant(self, current_user):
        """Vraća drugog sudionika u razgovoru"""
        return self.participants.exclude(id=current_user.id).first()


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=[
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
    ], default='text')
    file_url = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["sender", "created_at"]),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} in conversation {self.conversation.id}"


class MessageReadStatus(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reads')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')

    def __str__(self):
        return f"{self.user.username} read message {self.message.id} at {self.read_at}"

