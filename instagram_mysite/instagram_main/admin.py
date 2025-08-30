from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserPost, UserComment
from django.utils.translation import gettext_lazy as _


class UserAdmin(BaseUserAdmin):
    model = User
    ordering = ('id',)
    list_display = ('id', 'username', 'contact_info', 'full_name', 'is_active', 'is_staff')

    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('contact_info', 'username', 'full_name', 'password')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('contact_info', 'username', 'full_name', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    def delete_model(self, request, obj):
        # Briši povezane podatke prije brisanja korisnika
        obj.userpost_set.all().delete()
        obj.usercomment_set.all().delete()
        super().delete_model(request, obj)


admin.site.register(User, UserAdmin)
admin.site.register(UserPost)
admin.site.register(UserComment)
