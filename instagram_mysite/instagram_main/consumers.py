import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from .models import User, Conversation, Message, MessageReadStatus
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

def get_full_url(relative_url):
    """Helper funkcija za generiranje punog URL-a"""
    if not relative_url:
        return None
    
    # Koristi settings za base URL
    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
    return f"{base_url}{relative_url}"


class ChatConsumer(AsyncWebsocketConsumer):
    def _abs(self, url_path: str) -> str:
        """Helper funkcija za generiranje apsolutnog URL-a iz scope-a"""
        if not url_path:
            return None
        
        scheme = "http"
        headers = dict(self.scope.get("headers", []))
        host = headers.get(b"host", b"").decode("latin1") or "localhost:8000"
        
        # Provjeravam da li URL već počinje s http/https
        if url_path.startswith(('http://', 'https://')):
            return url_path
        
        # scheme i host ako URL počinje s /
        if url_path.startswith('/'):
            full_url = f"{scheme}://{host}{url_path}"
        else:
            full_url = f"{scheme}://{host}/{url_path}"
        
        print(f"Generated URL: {full_url} (from {url_path})")
        return full_url

    def _get_abs_url(self, url_path: str) -> str:
        """Helper funkcija za generiranje apsolutnog URL-a iz scope-a (za sync funkcije)"""
        if not url_path:
            return None
        
        # Uvijek koristim HTTP scheme za slike, ne WebSocket scheme
        scheme = "http"
        headers = dict(self.scope.get("headers", []))
        host = headers.get(b"host", b"").decode("latin1") or "localhost:8000"
        
        # Provjeri da li URL već počinje s http/https
        if url_path.startswith(('http://', 'https://')):
            return url_path
        
        # Dodaj scheme i host ako URL počinje s /
        if url_path.startswith('/'):
            full_url = f"{scheme}://{host}{url_path}"
        else:
            full_url = f"{scheme}://{host}/{url_path}"
        
        print(f"Generated URL (sync): {full_url} (from {url_path})")
        return full_url

    async def connect(self):
        try:
            # Korisnik je već autentificiran u middleware-u
            self.user = self.scope['user']
            if isinstance(self.user, AnonymousUser):
                await self.close()
                return
            
            # Dohvati conversation_id iz URL-a
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            
            # Provjeri ima li korisnik pristup ovom razgovoru
            if not await self.can_access_conversation(self.conversation_id):
                await self.close()
                return
            
            # Pridruži se room-u
            self.room_group_name = f'chat_{self.conversation_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            # Prihvati konekciju sa subprotocols ako postoje
            if 'subprotocols' in self.scope and self.scope['subprotocols']:
                await self.accept(subprotocol=self.scope['subprotocols'][0])
            else:
                await self.accept()
                

            
            # Pošalji poruku o uspješnom povezivanju
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to chat room'
            }))
        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        # Napusti room ako je definiran
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            message = text_data_json.get('message', '').strip()
            
            # Validacija poruke
            if not message:
                return
            
            if len(message) > 5000:  # Maksimalna duljina poruke
                return
            
            message_id = await self.save_message(message)
            
            # Pošalji poruku svim sudionicima u room-u
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': self.user.id,
                    'sender_username': self.user.username,
                    'message_id': message_id,
                    'timestamp': text_data_json.get('timestamp')
                }
            )
            
            # Pošalji conversation_updated notifikaciju za ažuriranje liste razgovora
            await self.send_conversation_update_notification()
        
        elif message_type == 'typing':
            # Pošalji typing indikator u chat room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
            # Pošalji typing indikator u listu razgovora
            await self.send_typing_notification_to_list()
        
        elif message_type == 'stop_typing':
            # Zaustavi typing indikator u chat room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_stop_typing',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
            # Zaustavi typing indikator u listi razgovora
            await self.send_stop_typing_notification_to_list()
        
        elif message_type == 'read_messages':
             # Označi poruke kao pročitane
             await self.mark_messages_as_read([])
             
             # Pošalji poruku svim sudionicima da su poruke označene kao pročitane
             await self.channel_layer.group_send(
                 self.room_group_name,
                 {
                     'type': 'messages_read',
                     'user_id': self.user.id,
                     'username': self.user.username
                 }
             )
         
        

    async def chat_message(self, event):
        # Pošalji poruku WebSocket klijentu
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp']
        }))

    async def user_typing(self, event):
        # Pošalji typing indikator
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def user_stop_typing(self, event):
        # Zaustavi typing indikator
        await self.send(text_data=json.dumps({
            'type': 'user_stop_typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def messages_read(self, event):
        # Pošalji poruku da su poruke označene kao pročitane
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def message_deleted(self, event):
        # Pošalji poruku da je poruka obrisana
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'deleted_by': event['deleted_by']
        }))

    async def conversation_deleted(self, event):
        # Pošalji poruku da je razgovor obrisan
        await self.send(text_data=json.dumps({
            'type': 'conversation_deleted',
            'conversation_id': event['conversation_id'],
            'deleted_by': event['deleted_by']
        }))

    async def conversation_created(self, event):
        # Pošalji poruku da je novi razgovor kreiran
        await self.send(text_data=json.dumps({
            'type': 'conversation_created',
            'conversation': event['conversation']
        }))

    async def conversation_updated(self, event):
        # Pošalji poruku da je razgovor ažuriran
        await self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation': event['conversation']
        }))

    async def conversation_list_update(self, event):
        # Pošalji poruku da se lista razgovora treba ažurirati
        await self.send(text_data=json.dumps({
            'type': 'conversation_list_update',
            'conversations': event['conversations']
        }))



    @database_sync_to_async
    def can_access_conversation(self, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            participants = list(conversation.participants.all())
            has_access = self.user in participants
            print(f"WebSocket access check - User: {self.user.id}, Conversation: {conversation_id}, Participants: {[p.id for p in participants]}, Has access: {has_access}")
            return has_access
        except Conversation.DoesNotExist:
            print(f"WebSocket access check - Conversation {conversation_id} does not exist")
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        return message.id

    @database_sync_to_async
    def mark_messages_as_read(self, message_ids):
        # Označi sve nepročitane poruke u ovom razgovoru kao pročitane
        messages = Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False
        ).exclude(sender=self.user)
        
        for message in messages:
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=self.user
            )
            message.is_read = True
            message.save()

    async def send_conversation_update_notification(self):
        """Pošalji conversation_updated notifikaciju svim sudionicima"""
        try:
            # Dohvati sve sudionike
            participants = await self.get_conversation_participants()
            
            # Pošalji notifikaciju svim sudionicima osim pošiljatelju
            for participant in participants:
                if participant.id != self.user.id:
                    # Dohvati podatke o razgovoru specifične za ovog sudionika
                    conversation_data = await self.get_conversation_data_for_participant(participant.id)
                    
                    print(f"Sending conversation_updated to participant {participant.id} (sender: {self.user.id})")
                    await self.channel_layer.group_send(
                        f'user_notifications_{participant.id}',
                        {
                            'type': 'conversation_updated',
                            'conversation': conversation_data
                        }
                    )
        except Exception as e:
            print(f"Error sending conversation update notification: {e}")

    @database_sync_to_async
    def get_conversation_data_for_participant(self, participant_id):
        """Dohvati podatke o razgovoru za specifičnog sudionika"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        # Dohvati drugog sudionika (ne ovog sudionika)
        other_participant = conversation.participants.exclude(id=participant_id).first()
        
        # Dohvati zadnju poruku
        last_message = conversation.messages.order_by('-created_at').first()
        
        # Dohvati broj nepročitanih poruka za ovog sudionika
        unread_count = conversation.messages.filter(is_read=False).exclude(sender_id=participant_id).count()
        
        # Dohvati profilnu sliku drugog sudionika
        other_participant_data = None
        if other_participant:
            profile_image_url = None
            if other_participant.profile_image and other_participant.profile_image.url:
                # Generiraj puni URL za profilnu sliku
                print(f"Raw profile_image.url: {other_participant.profile_image.url}")
                profile_image_url = self._get_abs_url(other_participant.profile_image.url)
                print(f"User {other_participant.username} profile image: {profile_image_url}")
            else:
                print(f"User {other_participant.username} has no profile image")
            
            other_participant_data = {
                'id': other_participant.id,
                'username': other_participant.username,
                'full_name': other_participant.full_name,
                'profile_image': profile_image_url
            }
        
        # Dohvati podatke o zadnjoj poruci
        last_message_data = None
        if last_message:
            sender_profile_image_url = None
            if last_message.sender.profile_image:
                # Generiraj puni URL za profilnu sliku pošiljatelja
                sender_profile_image_url = self._get_abs_url(last_message.sender.profile_image.url)
            
            last_message_data = {
                'id': last_message.id,
                'content': last_message.content,
                'sender': {
                    'id': last_message.sender.id,
                    'username': last_message.sender.username,
                    'full_name': last_message.sender.full_name,
                    'profile_image': sender_profile_image_url
                },
                'created_at': last_message.created_at.isoformat(),
                'is_read': last_message.is_read
            }
        
        return {
            'id': conversation.id,
            'other_participant': other_participant_data,
            'last_message': last_message_data,
            'unread_count': unread_count,
            'updated_at': conversation.updated_at.isoformat()
        }

    @database_sync_to_async
    def get_conversation_data(self):
        """Dohvati podatke o razgovoru za notifikaciju"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        # Dohvati drugog sudionika
        other_participant = conversation.participants.exclude(id=self.user.id).first()
        
        # Dohvati zadnju poruku
        last_message = conversation.messages.order_by('-created_at').first()
        
        # Dohvati broj nepročitanih poruka za trenutnog korisnika
        unread_count = conversation.messages.filter(is_read=False).exclude(sender=self.user).count()
        
        # Dohvati profilnu sliku drugog sudionika
        other_participant_data = None
        if other_participant:
            profile_image_url = None
            if other_participant.profile_image:
                # Generiraj puni URL za profilnu sliku
                print(f"Raw profile_image.url (get_conversation_data): {other_participant.profile_image.url}")
                profile_image_url = self._get_abs_url(other_participant.profile_image.url)
                print(f"Generated profile_image_url: {profile_image_url}")
            
            other_participant_data = {
                'id': other_participant.id,
                'username': other_participant.username,
                'full_name': other_participant.full_name,
                'profile_image': profile_image_url
            }
        
        # Dohvati podatke o zadnjoj poruci
        last_message_data = None
        if last_message:
            sender_profile_image_url = None
            if last_message.sender.profile_image:
                # Generiraj puni URL za profilnu sliku pošiljatelja
                sender_profile_image_url = self._get_abs_url(last_message.sender.profile_image.url)
            
            last_message_data = {
                'id': last_message.id,
                'content': last_message.content,
                'sender': {
                    'id': last_message.sender.id,
                    'username': last_message.sender.username,
                    'full_name': last_message.sender.full_name,
                    'profile_image': sender_profile_image_url
                },
                'created_at': last_message.created_at.isoformat(),
                'is_read': last_message.is_read
            }
        
        return {
            'id': conversation.id,
            'other_participant': other_participant_data,
            'last_message': last_message_data,
            'unread_count': unread_count,
            'updated_at': conversation.updated_at.isoformat()
        }

    @database_sync_to_async
    def get_conversation_participants(self):
        """Dohvati sve sudionike razgovora"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        return list(conversation.participants.all())

    async def send_typing_notification_to_list(self):
        """Pošalji typing notifikaciju u listu razgovora"""
        try:
            # Dohvati sve sudionike
            participants = await self.get_conversation_participants()
            
            # Pošalji notifikaciju svim sudionicima osim pošiljatelju
            for participant in participants:
                if participant.id != self.user.id:
                    await self.channel_layer.group_send(
                        f'user_notifications_{participant.id}',
                        {
                            'type': 'user_typing',
                            'conversation_id': self.conversation_id,
                            'user_id': self.user.id,
                            'username': self.user.username
                        }
                    )
        except Exception as e:
            print(f"Error sending typing notification to list: {e}")

    async def send_stop_typing_notification_to_list(self):
        """Pošalji stop typing notifikaciju u listu razgovora"""
        try:
            # Dohvati sve sudionike
            participants = await self.get_conversation_participants()
            
            # Pošalji notifikaciju svim sudionicima osim pošiljatelju
            for participant in participants:
                if participant.id != self.user.id:
                    await self.channel_layer.group_send(
                        f'user_notifications_{participant.id}',
                        {
                            'type': 'user_stop_typing',
                            'conversation_id': self.conversation_id,
                            'user_id': self.user.id,
                            'username': self.user.username
                        }
                    )
        except Exception as e:
            print(f"Error sending stop typing notification to list: {e}")


class ChatNotificationConsumer(AsyncWebsocketConsumer):
    """Consumer za općenite chat notifikacije - ažuriranje liste razgovora"""
    
    async def connect(self):
        try:
            print(f"ChatNotificationConsumer.connect called")
            # Korisnik je već autentificiran u middleware-u
            self.user = self.scope['user']
            print(f"ChatNotificationConsumer - User: {self.user}, Is Anonymous: {isinstance(self.user, AnonymousUser)}")
            if isinstance(self.user, AnonymousUser):
                print(f"ChatNotificationConsumer - Anonymous user rejected")
                await self.close()
                return
            
            # Pridruži se user-specific room-u
            self.room_group_name = f'user_notifications_{self.user.id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            # Prihvati konekciju
            await self.accept()
            
            print(f"ChatNotificationConsumer connected - User: {self.user.id}, Room: {self.room_group_name}")
            
            # Pošalji poruku o uspješnom povezivanju
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to chat notifications'
            }))
        except Exception as e:
            print(f"ChatNotificationConsumer connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        # Napusti room ako je definiran
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        pass

    async def conversation_updated(self, event):
        """Handler za ažuriranje liste razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation_id': event.get('conversation_id'),
            'action': event.get('action', 'update')  # 'create', 'update', 'delete'
        }))

    async def new_message_notification(self, event):
        """Handler za notifikacije o novim porukama"""
        await self.send(text_data=json.dumps({
            'type': 'new_message_notification',
            'conversation_id': event.get('conversation_id'),
            'sender_id': event.get('sender_id'),
            'sender_username': event.get('sender_username'),
            'message_preview': event.get('message_preview', '')
        }))

    async def conversation_deleted(self, event):
        """Handler za brisanje razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_deleted',
            'conversation_id': event.get('conversation_id'),
            'deleted_by': event.get('deleted_by')
        }))

    async def conversation_created(self, event):
        """Handler za kreiranje novog razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_created',
            'conversation': event.get('conversation')
        }))

    async def conversation_updated(self, event):
        """Handler za ažuriranje razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation': event.get('conversation')
        }))

    async def conversation_list_update(self, event):
        """Handler za ažuriranje cijele liste razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_list_update',
            'conversations': event.get('conversations')
        }))

    async def user_typing(self, event):
        """Handler za typing indicator u listi razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'conversation_id': event.get('conversation_id'),
            'user_id': event.get('user_id'),
            'username': event.get('username')
        }))

    async def user_stop_typing(self, event):
        """Handler za zaustavljanje typing indicatora u listi razgovora"""
        await self.send(text_data=json.dumps({
            'type': 'user_stop_typing',
            'conversation_id': event.get('conversation_id'),
            'user_id': event.get('user_id'),
            'username': event.get('username')
        }))
