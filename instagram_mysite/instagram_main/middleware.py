import json
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Dohvati token iz subprotocols, Authorization header-a ili URL parametra
        token = None
        
        # Pokušaj iz subprotocols (frontend će slati ["jwt", token])
        if 'subprotocols' in scope and scope['subprotocols']:
            # Frontend šalje ["jwt", token], pa je token drugi element
            if len(scope['subprotocols']) >= 2 and scope['subprotocols'][0] == 'jwt':
                token = scope['subprotocols'][1]
        
        # Ako nema u subprotocols, pokušaj iz Authorization header-a
        if not token:
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode('utf-8')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
        
        # Ako nema u header-u, pokušaj iz URL parametra
        if not token and 'query_string' in scope:
            query_string = scope['query_string'].decode('utf-8')
            if 'token=' in query_string:
                token = query_string.split('token=')[1].split('&')[0]
        
        # Autentificiraj korisnika
        if token:
            scope['user'] = await self.get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return AnonymousUser()
