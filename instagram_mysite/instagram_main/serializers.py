from rest_framework import serializers
from .models import Conversation, Message, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_image']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'created_at', 'is_read']


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'last_message', 'unread_count', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Pronađi drugog sudionika (ne trenutnog korisnika)
            other_participant = obj.participants.exclude(id=request.user.id).first()
            if other_participant:
                return UserSerializer(other_participant).data
        return None
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Broj nepročitanih poruka koje nije poslao trenutni korisnik
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
