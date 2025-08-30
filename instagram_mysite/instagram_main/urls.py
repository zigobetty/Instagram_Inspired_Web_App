from django.urls import path
from . import views
from .views import UserDetailView, delete_user
from django.conf import settings
from django.conf.urls.static import static
from .views import MyTokenObtainPairView

urlpatterns = [
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', MyTokenObtainPairView.as_view(), name='token_refresh'),
    path('api/get_csrf_token/',    views.get_csrf_token,      name='csrf_token'),
    path('api/check_user_exists/', views.check_user_exists,   name='check_user_exists'),
    path('api/register_user',     views.register_user,       name='register_user'),

    path('api/logout/', views.logout_view, name='logout'),
    path('api/users', views.list_users, name='list_users'),
    path('api/users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('api/delete-user', delete_user, name='delete_user'),
    path('api/get_user_profile/', views.get_user_profile, name='get_user_profile'),
    path('api/upload-image/', views.upload_user_image, name='upload_user_image'),
    path('api/get-user-images/', views.get_user_images, name='get_user_images'),
    path('api/delete-image/<int:image_id>/', views.delete_user_image, name='delete_user_image'),
    path('api/update-profile/', views.update_user_profile, name='update_user_profile'),
    path('api/update-profile-image/', views.update_profile_image, name='update_profile_image'),
    path('api/remove-profile-image/', views.remove_profile_image, name='remove-profile-image'),
    path('api/add-comment/', views.add_comment, name='add_comment'),
    path('api/get-comments/<int:post_id>/', views.get_comments, name='get_comments'),
    path('api/delete-comment/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('api/search-users/', views.search_users, name='search_users'),

    # Nove URL-ove za UserProfile komponentu
    path('api/get-user-profile/<int:userId>/', views.get_user_profile_by_id, name='get_user_profile_by_id'),
    path('api/get-user-images/<int:userId>/', views.get_user_images_by_id, name='get_user_images_by_id'),
    path('api/follow-user/<int:userId>/', views.follow_user, name='follow_user'),
    path('api/unfollow-user/<int:userId>/', views.unfollow_user, name='unfollow_user'),

    # URL-ovi za lajkove komentara
    path('api/like-comment/<int:comment_id>/', views.like_comment, name='like_comment'),
    path('api/unlike-comment/<int:comment_id>/', views.unlike_comment, name='unlike_comment'),
    path('api/get-comment-likes/<int:comment_id>/', views.get_comment_likes, name='get_comment_likes'),

    # URL-ovi za lajkove slika
    path('api/like-post/<int:post_id>/', views.like_post, name='like_post'),
    path('api/unlike-post/<int:post_id>/', views.unlike_post, name='unlike_post'),
    path('api/get-post-likes/<int:post_id>/', views.get_post_likes, name='get_post_likes'),

    # URL-ovi za spremanje slika
    path('api/save-post/<int:post_id>/', views.save_post, name='save_post'),
    path('api/unsave-post/<int:post_id>/', views.unsave_post, name='unsave_post'),
    path('api/get-saved-posts/', views.get_saved_posts, name='get_saved_posts'),
    path('api/check-post-saved/<int:post_id>/', views.check_post_saved, name='check_post_saved'),

    # URL za feed objava
    path('api/get-feed-posts/', views.get_feed_posts, name='get_feed_posts'),

    # URL za suggested users
    path('api/suggested-users/', views.get_suggested_users, name='get_suggested_users'),
    
    # URL za following users
    path('api/following-users/', views.get_following_users, name='get_following_users'),

    # Chat API URLs
    path('api/conversations/', views.get_conversations, name='get_conversations'),
    path('api/conversations/<int:conversation_id>/messages/', views.get_conversation_messages, name='get_conversation_messages'),
    path('api/conversations/create/', views.create_conversation, name='create_conversation'),
    path('api/conversations/<int:conversation_id>/mark-read/', views.mark_messages_as_read, name='mark_messages_as_read'),
    path('api/conversations/<int:conversation_id>/send-message/', views.send_message, name='send_message'),
    path('api/conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
    path('api/conversations/<int:conversation_id>/messages/<int:message_id>/delete/', views.delete_message, name='delete_message'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
