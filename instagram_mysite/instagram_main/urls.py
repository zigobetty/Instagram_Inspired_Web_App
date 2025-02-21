from django.urls import path
from . import views
from .views import UserDetailView, delete_user
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/register', views.register_user, name='register_user'),
    path('api/csrf_token', views.get_csrf_token, name='csrf_token'),
    path('api/check_user', views.check_user_exists, name='check_user_exists'),
    path('api/login2', views.login_user2, name='login_user2'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/users', views.list_users, name='list_users'),
    path('api/users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('api/delete-user', delete_user, name='delete_user'),
    path('api/user-profile/', views.get_user_profile, name='get_user_profile'),
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


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
