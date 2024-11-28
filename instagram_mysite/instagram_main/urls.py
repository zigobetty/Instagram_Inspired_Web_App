# instagram_main/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('api/register', views.register_user, name='register_user'),
    path('api/csrf_token', views.get_csrf_token, name='csrf_token'),
    path('api/check_user', views.check_user_exists, name='check_user_exists'),
    path('api/login', views.login_user, name='login_user'),
    path('api/login2', views.login_user2, name='login_user2'),

]
