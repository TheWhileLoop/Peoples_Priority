from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('phone_number', 'role', 'country', 'state', 'district', 'city', 'address')


# Extend the default User admin to show profile inline
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_role', 'get_state', 'get_district')

    def get_role(self, obj):
        return obj.profile.role if hasattr(obj, 'profile') else '-'
    get_role.short_description = 'Role'

    def get_state(self, obj):
        return obj.profile.state if hasattr(obj, 'profile') else '-'
    get_state.short_description = 'State'

    def get_district(self, obj):
        return obj.profile.district if hasattr(obj, 'profile') else '-'
    get_district.short_description = 'District'


# Re-register User with extended admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Also register UserProfile standalone
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone_number', 'state', 'district', 'city', 'country')
    list_filter = ('role', 'state', 'district')
    search_fields = ('user__username', 'user__email', 'phone_number', 'city', 'district', 'state')
