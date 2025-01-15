# instagram_main/urls.py

from django.urls import path
from . import views
from .views import UserDetailView
from .views import delete_user

urlpatterns = [
    path('api/register', views.register_user, name='register_user'),
    path('api/csrf_token', views.get_csrf_token, name='csrf_token'),
    path('api/check_user', views.check_user_exists, name='check_user_exists'),
    path('api/login', views.login_user, name='login_user'),
    path('api/login2', views.login_user2, name='login_user2'),
    path('api/users', views.list_users, name='list_users'),
    path('api/users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('api/delete-user', delete_user, name='delete_user'),
    path('api/user-profile/', views.get_user_profile, name='get_user_profile'), 


]
