import json, traceback, os
import uuid
import base64
# from django.http import JsonResponse
from django.core.files.base import ContentFile
# from django.views.decorators.csrf import csrf_exempt
# from rest_framework.decorators import api_view, permission_classes
# from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import DetailView
from django.contrib.auth import logout
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import User, UserPost, UserComment, UserFollow, CommentLike, PostLike, SavedPost, UserPostImage
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, OutstandingToken, BlacklistedToken
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login_input = attrs.get('contact_info')
        password = attrs.get('password')

        # Pronađi korisnika prema bilo kojem polju
        user = (
            User.objects.filter(username=login_input).first() or
            User.objects.filter(contact_info=login_input).first()
        )

        if user is None or not user.check_password(password):
            raise serializers.ValidationError({'non_field_errors': ['Neispravan kontakt, korisničko ime ili lozinka.']})

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.contact_info,
                'full_name': user.full_name
            }
        }
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

def generate_unique_id():
    """Generira jedinstveni ID za korisnika."""
    return str(uuid.uuid4())


@api_view(['GET'])
@permission_classes([AllowAny])
#@ensure_csrf_cookie
def get_csrf_token(request):
    """Vraća CSRF token za frontend."""
    from django.middleware.csrf import get_token
    return JsonResponse({'csrfToken': get_token(request)})


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def check_user_exists(request):
    """Provjerava postoji li korisnik prema kontakt informacijama ili korisničkom imenu."""
    contact_info = request.data.get('contact_info')
    username = request.data.get('username')
    
    # Provjeri odvojeno
    email_exists = User.objects.filter(contact_info=contact_info).exists()
    username_exists = User.objects.filter(username=username).exists()
    
    exists = email_exists or username_exists
    
    data = {
        'exists': exists,
        'email_exists': email_exists,
        'username_exists': username_exists
    }
    
    if exists:
        if email_exists and username_exists:
            data['message'] = 'Email adresa i korisničko ime već postoje.'
        elif email_exists:
            data['message'] = 'Email adresa već postoji.'
        elif username_exists:
            data['message'] = 'Korisničko ime već postoji.'
    
    return JsonResponse(data)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Registracija novog korisnika + automatski login (JWT tokeni)."""
    try:
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        username = data.get('username')
        full_name = data.get('full_name')
        password = data.get('password')

        hashed_password = make_password(password)
        user = User.objects.create(
            username=username,
            contact_info=contact_info,
            full_name=full_name,
            password=hashed_password,
            bio="" 
        )

        # Generiraj JWT token odmah
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        return JsonResponse({
            'success': True,
            'message': 'Korisnik uspješno registriran',
            'token': access,
            'refresh': str(refresh),
            'user': {
                "id": user.id,
                "username": user.username,
                "contact_info": user.contact_info,
                "full_name": user.full_name,
                "bio": user.bio,  
            }
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)




@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return JsonResponse({'success': False, 'error': 'Refresh token nije poslan.'}, status=400)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return JsonResponse({'success': True, 'message': 'Korisnik uspješno izlogiran.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)



@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Dohvaćanje profila prijavljenog korisnika."""
    user = request.user
    profile_image_url = request.build_absolute_uri(user.profile_image.url) if user.profile_image else None
    return JsonResponse({
        'success': True,
        'data': {
            'id': user.id,
            'username': user.username,
            'email': user.contact_info,
            'full_name': user.full_name,
            'bio': user.bio,  
            'posts': user.posts,
            'followers': user.followers,
            'following': user.following,
            'profile_image_url': profile_image_url
        }
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def list_users(request):
    """Prikaz popisa korisnika s opcijom filtriranja."""
    qs = User.objects.all()
    username = request.GET.get('username')
    created_at = request.GET.get('created_at')
    if username:
        qs = qs.filter(username__icontains=username)
    if created_at:
        qs = qs.filter(created_at__date=created_at)
    users = list(qs.values('id', 'username', 'contact_info', 'full_name', 'bio', 'created_at'))
    return JsonResponse({'users': users})


class UserDetailView(DetailView):
    model = User
    pk_url_kwarg = 'pk'
    context_object_name = 'user'
    template_name = None

    def render_to_response(self, context, **response_kwargs):
        user = context['user']
        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'contact_info': user.contact_info,
            'full_name': user.full_name,
            'bio': user.bio,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
        })


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_user(request):
    """Brisanje korisnika iz baze."""
    try:
        request.user.delete()
        return JsonResponse({'success': True, 'message': 'Korisnik uspješno obrisan'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_user_image(request):

    data = request.data
    description = data.get('description', '')
    location = data.get('location', '')

    images_payload = data.get('images')
    single_picture = data.get('picture')

    if not images_payload and not single_picture:
        return JsonResponse({'success': False, 'error': 'No image(s) provided'}, status=400)

    # Create post first
    post = UserPost.objects.create(
        user=request.user,
        description=description,
        location=location or None
    )

    def decode_and_create(base64_str, idx):
        fmt, imgstr = base64_str.split(';base64,')
        ext = fmt.split('/')[-1]
        image_file = ContentFile(base64.b64decode(imgstr), name=f"user_{request.user.id}_{uuid.uuid4()}.{ext}")
        if idx == 0 and not post.image:
            post.image.save(image_file.name, image_file, save=True)
        UserPostImage.objects.create(post=post, image=image_file, order_index=idx)

    if images_payload and isinstance(images_payload, (list, tuple)):
        for idx, img in enumerate(images_payload[:10]):  
            try:
                decode_and_create(img, idx)
            except Exception:
                traceback.print_exc()
                return JsonResponse({'success': False, 'error': 'Invalid image format in images array'}, status=400)
    else:
        try:
            decode_and_create(single_picture, 0)
        except Exception:
            traceback.print_exc()
            return JsonResponse({'success': False, 'error': 'Invalid image format for picture'}, status=400)

    return JsonResponse({'success': True, 'post_id': post.id})


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_images(request):
    posts = UserPost.objects.filter(user=request.user).order_by('-created_at')
    images = []
    for p in posts:
        # Dohvati broj lajkova za ovu sliku
        likes_count = PostLike.objects.filter(post=p).count()
        
        # Provjeri da li trenutni korisnik lajka ovu sliku
        user_liked = PostLike.objects.filter(user=request.user, post=p).exists()
        
        # Provjeri da li trenutni korisnik spremi ovu sliku
        user_saved = SavedPost.objects.filter(user=request.user, post=p).exists()
        
        # Dohvati sve korisnike koji su lajkali sliku (od najnovijeg do najstarijeg)
        likes = PostLike.objects.filter(post=p).select_related('user').order_by('-created_at')
        likers = [{'username': like.user.username, 'created_at': like.created_at.isoformat()} for like in likes]
        
        gallery = list(
            UserPostImage.objects.filter(post=p).order_by('order_index', 'id')
            .values_list('image', flat=True)
        )
        gallery_urls = [
            request.build_absolute_uri(f"{settings.MEDIA_URL}{str(path)}")
            if not str(path).startswith('http') else str(path)
            for path in gallery
        ]
        cover_url = None
        if gallery_urls:
            cover_url = gallery_urls[0]
        elif p.image:
            cover_url = request.build_absolute_uri(p.image.url)

        images.append({
            'id': p.id,
            'image_url': cover_url,  
            'images': gallery_urls,  
            'description': p.description,
            'location': p.location,
            'likes_count': likes_count,
            'user_liked': user_liked,
            'user_saved': user_saved,
            'likers': likers
        })
    return JsonResponse({'success': True, 'images': images})


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_user_image(request, image_id):
    """Briše UserPost i sve povezane slike."""
    try:
        post = UserPost.objects.get(id=image_id, user=request.user)
        # Delete related images
        for post_image in list(UserPostImage.objects.filter(post=post)):
            if post_image.image:
                try:
                    post_image.image.delete(save=False)
                except Exception:
                    pass
            post_image.delete()
        if post.image:
            post.image.delete(save=False)
        post.delete()
        return JsonResponse({'success': True})
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Image not found'}, status=404)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    data = request.data
    user = request.user
    for field in ['username', 'contact_info', 'full_name']:
        if data.get(field): setattr(user, field, data[field])
    user.save()
    return JsonResponse({'success': True, 'message': 'Profile updated'})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_profile_image(request):
    picture = request.data.get('picture')
    if not picture:
        return JsonResponse({'success': False, 'error': 'No image provided'}, status=400)
    fmt, imgstr = picture.split(';base64,')
    ext = fmt.split('/')[-1]
    image_file = ContentFile(base64.b64decode(imgstr), name=f"profile_{request.user.id}_{uuid.uuid4()}.{ext}")
    request.user.profile_image.save(image_file.name, image_file)
    request.user.save()
    url = request.build_absolute_uri(request.user.profile_image.url)
    return JsonResponse({'success': True, 'profile_image_url': url})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def remove_profile_image(request):
    user = request.user
    if user.profile_image:
        user.profile_image.delete()
        user.profile_image = None
        user.save()
    return JsonResponse({'success': True})


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def add_comment(request):
    post_id = request.data.get('post_id')
    text = request.data.get('text')
    if not post_id or not text:
        return JsonResponse({'success': False, 'error': 'Missing post_id or text'}, status=400)
    try:
        comment = UserComment.objects.create(user=request.user, post_id=post_id, text=text)
        return JsonResponse({
            'success': True, 
            'comment_id': comment.id,
            'created_at': comment.created_at.isoformat()  
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_comments(request, post_id):
    comments = UserComment.objects.filter(post_id=post_id).order_by('-created_at')
    data = []
    
    # Dohvati vlasnika slike
    post_owner = None
    try:
        post = UserPost.objects.get(id=post_id)
        post_owner = post.user.username
    except UserPost.DoesNotExist:
        pass
    
    for c in comments:
        # Dohvati broj lajkova za ovaj komentar
        likes_count = CommentLike.objects.filter(comment=c).count()
        
        # Provjeri da li trenutni korisnik lajka ovaj komentar
        user_liked = False
        if request.user.is_authenticated:
            user_liked = CommentLike.objects.filter(user=request.user, comment=c).exists()
        
        # Dohvati profilnu sliku korisnika koji je komentirao
        profile_image_url = None
        if c.user.profile_image:
            profile_image_url = request.build_absolute_uri(c.user.profile_image.url)
        
        data.append({
            'id': c.id,
            'user': c.user.username,
            'text': c.text,
            'created_at': c.created_at.isoformat(),
            'likes_count': likes_count,
            'user_liked': user_liked,
            'user_profile_image': profile_image_url,
            'post_owner': post_owner
        })
    
    return JsonResponse({'success': True, 'comments': data})


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = UserComment.objects.get(id=comment_id)
        
        # Provjeri da li je trenutni korisnik autor komentara ILI vlasnik slike
        if comment.user == request.user or comment.post.user == request.user:
            comment.delete()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Nemate dozvolu za brisanje ovog komentara'}, status=403)
    except UserComment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Comment not found'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_users(request):
    query = request.GET.get('query', '').strip()
    if not query:
        return JsonResponse({'success': False, 'error': 'Search query is required'}, status=400)
    users = User.objects.filter(Q(username__icontains=query) | Q(full_name__icontains=query))
    data = []
    for u in users:
        url = request.build_absolute_uri(u.profile_image.url) if u.profile_image else None
        data.append({'id': u.id, 'username': u.username, 'full_name': u.full_name, 'profile_image': url})
    return JsonResponse({'success': True, 'users': data})


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_profile_by_id(request, userId):
    """Dohvaćanje profila određenog korisnika."""
    try:
        user = User.objects.get(id=userId)
        profile_image_url = request.build_absolute_uri(user.profile_image.url) if user.profile_image else None
        
        # Provjeri da li trenutni korisnik prati ovog korisnika
        is_following = UserFollow.objects.filter(follower=request.user, following=user).exists()
        
        return JsonResponse({
            'success': True,
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.contact_info,
                'full_name': user.full_name,
                'posts': user.posts,
                'followers': user.followers,
                'following': user.following,
                'profile_image_url': profile_image_url,
                'is_following': is_following,
                'bio': getattr(user, 'bio', ''),
                'website': getattr(user, 'website', ''),
                'location': getattr(user, 'location', ''),
                'is_verified': getattr(user, 'is_verified', False)
            }
        })
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Korisnik nije pronađen'}, status=404)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_images_by_id(request, userId):
    """Dohvaćanje slika određenog korisnika."""
    try:
        user = User.objects.get(id=userId)
        posts = UserPost.objects.filter(user=user).order_by('-created_at')
        data = []
        for post in posts:
            # Multi-image support
            gallery = list(
                UserPostImage.objects.filter(post=post).order_by('order_index', 'id')
                .values_list('image', flat=True)
            )
            gallery_urls = [
                request.build_absolute_uri(f"{settings.MEDIA_URL}{str(path)}")
                if not str(path).startswith('http') else str(path)
                for path in gallery
            ]
            url = gallery_urls[0] if gallery_urls else (request.build_absolute_uri(post.image.url) if post.image else None)
            
            # Dohvati broj lajkova za ovu sliku
            likes_count = PostLike.objects.filter(post=post).count()
            
            # Provjeri da li trenutni korisnik lajka ovu sliku
            user_liked = PostLike.objects.filter(user=request.user, post=post).exists()
            
            # Provjeri da li trenutni korisnik sprema ovu sliku
            user_saved = SavedPost.objects.filter(user=request.user, post=post).exists()
            
            # Dohvati sve korisnike koji su lajkali sliku (od najnovijeg do najstarijeg)
            likes = PostLike.objects.filter(post=post).select_related('user').order_by('-created_at')
            likers = [{'username': like.user.username, 'created_at': like.created_at.isoformat()} for like in likes]
            
            data.append({
                'id': post.id,
                'image_url': url,     # cover
                'images': gallery_urls,
                'description': post.description,
                'location': post.location,
                'created_at': post.created_at.strftime('%Y-%m-%d %H:%M'),
                'likes_count': likes_count,
                'user_liked': user_liked,
                'user_saved': user_saved,
                'likers': likers
            })
        return JsonResponse({'success': True, 'images': data})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Korisnik nije pronađen'}, status=404)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def follow_user(request, userId):
    """Prati korisnika."""
    try:
        user_to_follow = User.objects.get(id=userId)
        current_user = request.user
        
        if current_user.id == user_to_follow.id:
            return JsonResponse({'success': False, 'error': 'Ne možete pratiti sami sebe'}, status=400)
        
        # Provjeri da li već prati korisnika
        if UserFollow.objects.filter(follower=current_user, following=user_to_follow).exists():
            return JsonResponse({'success': False, 'error': 'Već prati ovog korisnika'}, status=400)
        
        # Kreiraj follow vezu
        UserFollow.objects.create(follower=current_user, following=user_to_follow)
        
        # Ažuriraj brojeve
        current_user.following += 1
        current_user.save()
        user_to_follow.followers += 1
        user_to_follow.save()
        
        return JsonResponse({'success': True, 'message': 'Uspješno zapratili korisnika'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Korisnik nije pronađen'}, status=404)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def unfollow_user(request, userId):
    """Otprati korisnika."""
    try:
        user_to_unfollow = User.objects.get(id=userId)
        current_user = request.user
        
        if current_user.id == user_to_unfollow.id:
            return JsonResponse({'success': False, 'error': 'Ne možete otpratiti sami sebe'}, status=400)
        
        # Provjeri da li prati korisnika
        follow_relationship = UserFollow.objects.filter(follower=current_user, following=user_to_unfollow).first()
        if not follow_relationship:
            return JsonResponse({'success': False, 'error': 'Ne prati ovog korisnika'}, status=400)
        
        # Obriši follow vezu
        follow_relationship.delete()
        
        # Ažuriraj brojeve
        current_user.following -= 1
        current_user.save()
        user_to_unfollow.followers -= 1
        user_to_unfollow.save()
        
        return JsonResponse({'success': True, 'message': 'Uspješno otpratili korisnika'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Korisnik nije pronađen'}, status=404)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def like_comment(request, comment_id):
    """Lajka komentar."""
    try:
        comment = UserComment.objects.get(id=comment_id)
        user = request.user
        
        # Provjeri da li već lajka komentar
        if CommentLike.objects.filter(user=user, comment=comment).exists():
            return JsonResponse({'success': False, 'error': 'Već ste lajkali ovaj komentar'}, status=400)
        
        # Kreiraj lajk
        CommentLike.objects.create(user=user, comment=comment)
        
        return JsonResponse({'success': True, 'message': 'Komentar uspješno lajkan'})
    except UserComment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Komentar nije pronađen'}, status=404)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def unlike_comment(request, comment_id):
    """Ukloni lajk s komentara."""
    try:
        comment = UserComment.objects.get(id=comment_id)
        user = request.user
        
        # Pronađi i obriši lajk
        like = CommentLike.objects.filter(user=user, comment=comment).first()
        if not like:
            return JsonResponse({'success': False, 'error': 'Niste lajkali ovaj komentar'}, status=400)
        
        like.delete()
        
        return JsonResponse({'success': True, 'message': 'Lajk uspješno uklonjen'})
    except UserComment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Komentar nije pronađen'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_comment_likes(request, comment_id):
    """Dohvati broj lajkova za komentar."""
    try:
        comment = UserComment.objects.get(id=comment_id)
        likes_count = CommentLike.objects.filter(comment=comment).count()
        
        # Provjeri da li trenutni korisnik lajka komentar (ako je prijavljen)
        user_liked = False
        if request.user.is_authenticated:
            user_liked = CommentLike.objects.filter(user=request.user, comment=comment).exists()
        
        return JsonResponse({
            'success': True, 
            'likes_count': likes_count,
            'user_liked': user_liked
        })
    except UserComment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Komentar nije pronađen'}, status=404)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    """Lajka sliku."""
    try:
        post = UserPost.objects.get(id=post_id)
        user = request.user
        
        # Provjeri da li već lajka sliku
        if PostLike.objects.filter(user=user, post=post).exists():
            return JsonResponse({'success': False, 'error': 'Već ste lajkali ovu sliku'}, status=400)
        
        # Kreiraj lajk
        PostLike.objects.create(user=user, post=post)
        
        return JsonResponse({'success': True, 'message': 'Slika uspješno lajkana'})
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def unlike_post(request, post_id):
    """Ukloni lajk s slike."""
    try:
        post = UserPost.objects.get(id=post_id)
        user = request.user
        
        # Pronađi i obriši lajk
        like = PostLike.objects.filter(user=user, post=post).first()
        if not like:
            return JsonResponse({'success': False, 'error': 'Niste lajkali ovu sliku'}, status=400)
        
        like.delete()
        
        return JsonResponse({'success': True, 'message': 'Lajk uspješno uklonjen'})
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_likes(request, post_id):
    """Dohvati broj lajkova za sliku."""
    try:
        post = UserPost.objects.get(id=post_id)
        likes_count = PostLike.objects.filter(post=post).count()
        
        user_liked = False
        if request.user.is_authenticated:
            user_liked = PostLike.objects.filter(user=request.user, post=post).exists()
        
        likes = PostLike.objects.filter(post=post).select_related('user').order_by('-created_at')
        likers = [{'username': like.user.username, 'created_at': like.created_at.isoformat()} for like in likes]
        
        return JsonResponse({
            'success': True, 
            'likes_count': likes_count,
            'user_liked': user_liked,
            'likers': likers
        })
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    """Spremi sliku."""
    try:
        post = UserPost.objects.get(id=post_id)
        user = request.user
        
        if SavedPost.objects.filter(user=user, post=post).exists():
            return JsonResponse({'success': False, 'error': 'Već ste spremili ovu sliku'}, status=400)
        
        SavedPost.objects.create(user=user, post=post)
        
        return JsonResponse({'success': True, 'message': 'Slika uspješno spremljena'})
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def unsave_post(request, post_id):
    """Ukloni sliku iz spremanih."""
    try:
        post = UserPost.objects.get(id=post_id)
        user = request.user
        
        # Pronađi i obriši spremanje
        saved_post = SavedPost.objects.filter(user=user, post=post).first()
        if not saved_post:
            return JsonResponse({'success': False, 'error': 'Niste spremili ovu sliku'}, status=400)
        
        saved_post.delete()
        
        return JsonResponse({'success': True, 'message': 'Slika uspješno uklonjena iz spremanih'})
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_saved_posts(request):
    """Dohvati sve spremljene slike korisnika."""
    try:
        user = request.user
        saved_posts = SavedPost.objects.filter(user=user).select_related('post', 'post__user').order_by('-created_at')
        
        saved_images = []
        for saved_post in saved_posts:
            post = saved_post.post
            gallery = list(
                UserPostImage.objects.filter(post=post).order_by('order_index', 'id')
                .values_list('image', flat=True)
            )
            gallery_urls = [
                request.build_absolute_uri(f"{settings.MEDIA_URL}{str(path)}")
                if not str(path).startswith('http') else str(path)
                for path in gallery
            ]
            cover_url = gallery_urls[0] if gallery_urls else (request.build_absolute_uri(post.image.url) if post.image else None)

            saved_images.append({
                'id': post.id,
                'image_url': cover_url,
                'images': gallery_urls,
                'description': post.description,
                'location': post.location,
                'created_at': post.created_at.isoformat(),
                'user': {
                    'id': post.user.id,
                    'username': post.user.username,
                    'full_name': post.user.full_name,
                    'profile_image_url': request.build_absolute_uri(post.user.profile_image.url) if post.user.profile_image else None
                },
                'saved_at': saved_post.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'saved_images': saved_images
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_post_saved(request, post_id):
    """Provjeri da li je slika spremljena od strane trenutnog korisnika."""
    try:
        post = UserPost.objects.get(id=post_id)
        
        user_saved = False
        if request.user.is_authenticated:
            user_saved = SavedPost.objects.filter(user=request.user, post=post).exists()
        
        return JsonResponse({
            'success': True,
            'user_saved': user_saved
        })
    except UserPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slika nije pronađena'}, status=404)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_feed_posts(request):
    """Dohvaćanje feed objava za prijavljenog korisnika."""
    try:
        feed_type = request.GET.get('type', 'for_you')  # 'following' ili 'for_you'
        
        if feed_type == 'following':
            # Dohvati samo objave ljudi koje pratim (bez mojih objava)
            following_users = UserFollow.objects.filter(follower=request.user).values_list('following', flat=True)
            posts = UserPost.objects.filter(user__in=following_users).order_by('-created_at')
        else:
            # Dohvati sve objave (moje i ostalih) - For You
            posts = UserPost.objects.all().order_by('-created_at')
        
        feed_posts = []
        for post in posts:
            try:
                # Multi-image support
                gallery = list(
                    UserPostImage.objects.filter(post=post).order_by('order_index', 'id')
                    .values_list('image', flat=True)
                )
                gallery_urls = [
                    request.build_absolute_uri(f"{settings.MEDIA_URL}{str(path)}")
                    if not str(path).startswith('http') else str(path)
                    for path in gallery
                ]
                cover_url = gallery_urls[0] if gallery_urls else (request.build_absolute_uri(post.image.url) if post.image else None)
                
                # Dohvati broj lajkova za ovu objavu
                likes_count = PostLike.objects.filter(post=post).count()
                
                # Provjeri da li trenutni korisnik lajka ovu objavu
                user_liked = PostLike.objects.filter(user=request.user, post=post).exists()
                
                # Provjeri da li trenutni korisnik sprema ovu objavu
                user_saved = SavedPost.objects.filter(user=request.user, post=post).exists()
                
                # Dohvati komentare za ovu objavu (samo prva 2 za preview)
                comments = UserComment.objects.filter(post=post).order_by('-created_at')[:2]
                comments_data = []
                for comment in comments:
                    profile_image_url = None
                    if comment.user.profile_image:
                        profile_image_url = request.build_absolute_uri(comment.user.profile_image.url)
                    
                    comments_data.append({
                        'id': comment.id,
                        'user': comment.user.username,
                        'text': comment.text,
                        'created_at': comment.created_at.isoformat(),
                        'user_profile_image': profile_image_url
                    })
                
                # Dohvati profilnu sliku korisnika koji je objavio
                user_profile_image_url = None
                if post.user.profile_image:
                    user_profile_image_url = request.build_absolute_uri(post.user.profile_image.url)
                
                # Provjeri da li trenutni korisnik prati vlasnika objave
                is_following = UserFollow.objects.filter(follower=request.user, following=post.user).exists()
                
                feed_posts.append({
                    'id': post.id,
                    'image_url': cover_url,
                    'images': gallery_urls,
                    'description': post.description,
                    'location': post.location,
                    'created_at': post.created_at.isoformat(),
                    'username': post.user.username,
                    'user_id': post.user.id,
                    'user_profile_image': user_profile_image_url,
                    'likes_count': likes_count,
                    'user_liked': user_liked,
                    'user_saved': user_saved,
                    'comments': comments_data,
                    'is_following': is_following
                })
            except Exception as post_error:
                print(f"Error processing post {post.id}: {post_error}")
                continue
        
        return JsonResponse({
            'success': True,
            'posts': feed_posts
        })
    except Exception as e:
        print(f"Feed posts error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_following_users(request):
    """Dohvaćanje korisnika koje trenutni korisnik prati."""
    try:
        # Dohvati korisnike koje trenutni korisnik prati
        following_relationships = UserFollow.objects.filter(follower=request.user).select_related('following')[:20]
        
        users_data = []
        for relationship in following_relationships:
            user = relationship.following
            
            # Dohvati profilnu sliku
            profile_image_url = None
            if user.profile_image:
                profile_image_url = request.build_absolute_uri(user.profile_image.url)
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'profile_image': profile_image_url
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data
        })
    except Exception as e:
        print(f"Following users error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_suggested_users(request):
    """Dohvaćanje 5 random korisnika za suggested users."""
    try:
        # Dohvati sve korisnike osim trenutnog korisnika
        all_users = User.objects.exclude(id=request.user.id)
        
        # Dohvati korisnike koje trenutni korisnik već prati
        following_users = UserFollow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Filtriraj korisnike koje ne prati
        available_users = all_users.exclude(id__in=following_users)
        
        # Uzmi 5 random korisnika
        suggested_users = available_users.order_by('?')[:5]
        
        users_data = []
        for user in suggested_users:
            # Dohvati profilnu sliku
            profile_image_url = None
            if user.profile_image:
                profile_image_url = request.build_absolute_uri(user.profile_image.url)
            
            # Dohvati mutual followers (korisnici koje ja pratim, a oni prate ovog korisnika)
            mutual_followers = []
            if following_users.exists():
                # Pronađi korisnike koje ja pratim, a oni prate ovog korisnika
                mutual_users = UserFollow.objects.filter(
                    follower__in=following_users,
                    following=user
                ).values_list('follower__username', flat=True)
                mutual_followers = list(mutual_users)
            
            users_data.append({
                'id': user.id,
                'username': user.username,
                'profile_image_url': profile_image_url,
                'mutual_followers': mutual_followers,
                'is_following': False  # Ovi korisnici nisu praćeni
            })
        
        return JsonResponse({
            'success': True,
            'users': users_data
        })
    except Exception as e:
        print(f"Suggested users error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# Chat API Views
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Dohvaćanje svih razgovora za trenutnog korisnika."""
    try:
        from .models import Conversation, Message
        
        # Dohvati sve razgovore u kojima sudjeluje korisnik
        conversations = Conversation.objects.filter(
            participants=request.user
        ).prefetch_related(
            'participants', 'messages'
        ).order_by('-updated_at')
        
        conversations_data = []
        for conversation in conversations:
            # Dohvati drugog sudionika
            other_participant = conversation.get_other_participant(request.user)
            
            # Dohvati zadnju poruku
            last_message = conversation.messages.select_related('sender').last()
            
            # Dohvati broj nepročitanih poruka
            unread_count = conversation.messages.filter(
                is_read=False
            ).exclude(sender=request.user).count()
            
            # Dohvati profilnu sliku drugog sudionika
            profile_image_url = None
            if other_participant and other_participant.profile_image:
                profile_image_url = request.build_absolute_uri(other_participant.profile_image.url)
            
            conversations_data.append({
                'id': conversation.id,
                'other_participant': {
                    'id': other_participant.id if other_participant else None,
                    'username': other_participant.username if other_participant else None,
                    'full_name': other_participant.full_name if other_participant else None,
                    'profile_image': profile_image_url
                },
                'last_message': {
                    'content': last_message.content if last_message else None,
                    'sender_id': last_message.sender.id if last_message else None,
                    'sender_username': last_message.sender.username if last_message else None,
                    'created_at': last_message.created_at.isoformat() if last_message else None
                },
                'unread_count': unread_count,
                'updated_at': conversation.updated_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'conversations': conversations_data
        })
    except Exception as e:
        print(f"Get conversations error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conversation_id):
    """Dohvaćanje poruka za određeni razgovor."""
    try:
        from .models import Conversation, Message
        
        # Provjeri ima li korisnik pristup ovom razgovoru
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=request.user
        ).first()
        
        if not conversation:
            return JsonResponse({'success': False, 'error': 'Conversation not found'}, status=404)
        
        # Dohvati poruke
        messages = conversation.messages.select_related('sender').order_by('created_at')
        
        messages_data = []
        for message in messages:
            # Dohvati profilnu sliku pošiljatelja
            profile_image_url = None
            if message.sender.profile_image:
                profile_image_url = request.build_absolute_uri(message.sender.profile_image.url)
            
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'message_type': message.message_type,
                'file_url': message.file_url,
                'is_read': message.is_read,
                'sender': {
                    'id': message.sender.id,
                    'username': message.sender.username,
                    'full_name': message.sender.full_name,
                    'profile_image': profile_image_url
                },
                'created_at': message.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'messages': messages_data
        })
    except Exception as e:
        print(f"Get conversation messages error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Kreiranje novog razgovora s drugim korisnikom."""
    try:
        from .models import Conversation
        
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return JsonResponse({'success': False, 'error': 'other_user_id is required'}, status=400)
        
        # Provjeri postoji li korisnik
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
        
        # Provjeri postoji li već razgovor između ova dva korisnika
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            return JsonResponse({
                'success': True,
                'conversation_id': existing_conversation.id,
                'message': 'Conversation already exists'
            })
        
        # Kreiraj novi razgovor
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
        
        # Pripremi podatke o razgovoru za WebSocket notifikaciju
        from .serializers import ConversationSerializer
        conversation_data = ConversationSerializer(conversation, context={'request': request}).data
        
        # Pošalji notifikaciju oba korisnika da se lista razgovora treba ažurirati
        channel_layer = get_channel_layer()
        
        # Notifikacija za trenutnog korisnika
        async_to_sync(channel_layer.group_send)(
            f'user_notifications_{request.user.id}',
            {
                'type': 'conversation_created',
                'conversation': conversation_data
            }
        )
        
        # Notifikacija za drugog korisnika
        async_to_sync(channel_layer.group_send)(
            f'user_notifications_{other_user.id}',
            {
                'type': 'conversation_created',
                'conversation': conversation_data
            }
        )
        
        return JsonResponse({
            'success': True,
            'conversation_id': conversation.id,
            'message': 'Conversation created successfully'
        })
    except Exception as e:
        print(f"Create conversation error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_messages_as_read(request, conversation_id):
    """Označavanje poruka kao pročitane."""
    try:
        from .models import Conversation, Message, MessageReadStatus
        
        # Provjeri ima li korisnik pristup ovom razgovoru (sudionik ili ima poruke)
        conversation = Conversation.objects.filter(
            id=conversation_id
        ).filter(
            Q(participants=request.user) | 
            Q(messages__sender=request.user)
        ).first()
        
        if not conversation:
            return JsonResponse({'success': False, 'error': 'Conversation not found'}, status=404)
        
        # Ako korisnik ima poruke ali nije sudionik, dodaj ga nazad
        if conversation.messages.filter(sender=request.user).exists() and request.user not in conversation.participants.all():
            conversation.participants.add(request.user)
        
        # Označi sve nepročitane poruke u ovom razgovoru kao pročitane
        unread_messages = Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=request.user)
        
        for message in unread_messages:
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=request.user
            )
            message.is_read = True
            message.save()
        
        # Pošalji WebSocket notifikacije
        if unread_messages.exists():
            from .serializers import ConversationSerializer
            conversation_data = ConversationSerializer(conversation, context={'request': request}).data
            
            channel_layer = get_channel_layer()
            
            # Pošalji svim sudionicima -> NOTIFIKACIJSKI SOCKET (sidebar badge / reorder)
            for participant in conversation.participants.all():
                async_to_sync(channel_layer.group_send)(
                    f'user_notifications_{participant.id}',
                    {
                        'type': 'conversation_updated',
                        'conversation': conversation_data
                    }
                )

            # NOVO: obavijesti OTVORENI CHAT ROOM da su poruke pročitane
            # (pošiljatelj dobije "messages_read" i može prikazati "Seen")
            async_to_sync(channel_layer.group_send)(
                f'chat_{conversation.id}',
                {
                    'type': 'messages_read',
                    'user_id': request.user.id,
                    'username': request.user.username,
                }
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Messages marked as read'
        })
    except Exception as e:
        print(f"Mark messages as read error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """Slanje nove poruke u razgovor."""
    try:
        from .models import Conversation, Message
        
        # Provjeri ima li korisnik pristup ovom razgovoru (sudionik ili ima poruke)
        conversation = Conversation.objects.filter(
            id=conversation_id
        ).filter(
            Q(participants=request.user) | 
            Q(messages__sender=request.user)
        ).first()
        
        if not conversation:
            return JsonResponse({'success': False, 'error': 'Conversation not found'}, status=404)
        
        # Ako korisnik ima poruke ali nije sudionik, dodaj ga nazad
        if conversation.messages.filter(sender=request.user).exists() and request.user not in conversation.participants.all():
            conversation.participants.add(request.user)
        
        content = request.data.get('content', '').strip()
        if not content:
            return JsonResponse({'success': False, 'error': 'Message content is required'}, status=400)
        
        if len(content) > 5000:  # Maksimalna duljina poruke
            return JsonResponse({'success': False, 'error': 'Message too long (max 5000 characters)'}, status=400)
        
        # Kreiraj novu poruku
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content.strip()
        )
        
        # Dohvati profilnu sliku pošiljatelja
        profile_image_url = None
        if request.user.profile_image:
            profile_image_url = request.build_absolute_uri(request.user.profile_image.url)
        
        message_data = {
            'id': message.id,
            'content': message.content,
            'message_type': message.message_type,
            'file_url': message.file_url,
            'is_read': message.is_read,
            'sender': {
                'id': message.sender.id,
                'username': message.sender.username,
                'full_name': message.sender.full_name,
                'profile_image': profile_image_url
            },
            'created_at': message.created_at.isoformat()
        }
        
        # Ažuriraj conversation.updated_at da se razgovor pojavi na vrhu liste
        conversation.save()
        
        print(f"Message sent - conversation_id: {conversation.id}, message_count: {conversation.messages.count()}")
        
        # Pripremi podatke o razgovoru za WebSocket notifikaciju
        from .serializers import ConversationSerializer
        conversation_data = ConversationSerializer(conversation, context={'request': request}).data
        
        channel_layer = get_channel_layer()
        
        # Dohvati sve sudionike razgovora
        participants = conversation.participants.all()
        
        for participant in participants:
            if participant.id != request.user.id:  # Ne šalji notifikaciju pošiljatelju
                # Ako je ovo prva poruka, pošalji conversation_created
                if conversation.messages.count() == 1:
                    print(f"Sending conversation_created to user {participant.id}")
                    async_to_sync(channel_layer.group_send)(
                        f'user_notifications_{participant.id}',
                        {
                            'type': 'conversation_created',
                            'conversation': conversation_data
                        }
                    )
                else:
                    # Za sljedeće poruke, pošalji conversation_updated
                    print(f"Sending conversation_updated to user {participant.id}")
                    async_to_sync(channel_layer.group_send)(
                        f'user_notifications_{participant.id}',
                        {
                            'type': 'conversation_updated',
                            'conversation': conversation_data
                        }
                    )
        
        return JsonResponse({
            'success': True,
            'message': message_data
        })
    except Exception as e:
        print(f"Send message error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Brisanje razgovora za sve sudionike."""
    try:
        from .models import Conversation, Message, MessageReadStatus
        
        # Provjeri ima li korisnik pristup ovom razgovoru
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=request.user
        ).first()
        
        if not conversation:
            return JsonResponse({'success': False, 'error': 'Conversation not found'}, status=404)
        
        # Dohvati sve sudionike prije brisanja za WebSocket notifikacije
        participants = list(conversation.participants.all())
        
        # Obriši sve poruke u razgovoru
        Message.objects.filter(conversation=conversation).delete()
        
        # Obriši razgovor potpuno
        conversation.delete()
        
        # Pošalji WebSocket notifikaciju o brisanju razgovora svim sudionicima
        channel_layer = get_channel_layer()
        
        for participant in participants:
            # Pošalji notifikaciju svim sudionicima, uključujući onog koji je obrisao
            # Pošalji na user_notifications kanal
            async_to_sync(channel_layer.group_send)(
                f'user_notifications_{participant.id}',
                {
                    'type': 'conversation_deleted',
                    'conversation_id': conversation_id,
                    'deleted_by': request.user.id
                }
            )
            # Također pošalji na chat kanal ako je korisnik trenutno u tom chatu
            async_to_sync(channel_layer.group_send)(
                f'chat_{conversation_id}',
                {
                    'type': 'conversation_deleted',
                    'conversation_id': conversation_id,
                    'deleted_by': request.user.id
                }
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Conversation deleted successfully'
        })
    except Exception as e:
        print(f"Delete conversation error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_message(request, conversation_id, message_id):
    """Brisanje poruke samo od strane pošiljatelja."""
    try:
        from .models import Conversation, Message
        
        # Provjeri ima li korisnik pristup ovom razgovoru
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=request.user
        ).first()
        
        if not conversation:
            return JsonResponse({'success': False, 'error': 'Conversation not found'}, status=404)
        
        # Dohvati poruku
        message = Message.objects.filter(
            id=message_id,
            conversation=conversation,
            sender=request.user  # Samo pošiljatelj može obrisati poruku
        ).first()
        
        if not message:
            return JsonResponse({'success': False, 'error': 'Message not found or you cannot delete this message'}, status=404)
        
        # Obriši poruku
        message.delete()
        
        # Pošalji WebSocket notifikaciju o brisanju poruke
        channel_layer = get_channel_layer()
        
        # Dohvati sve sudionike razgovora
        participants = conversation.participants.all()
        
        for participant in participants:
            if participant.id != request.user.id:  # Ne šalji notifikaciju pošiljatelju
                async_to_sync(channel_layer.group_send)(
                    f'chat_{conversation_id}',
                    {
                        'type': 'message_deleted',
                        'message_id': message_id,
                        'deleted_by': request.user.id
                    }
                )
        
        return JsonResponse({
            'success': True,
            'message': 'Message deleted successfully'
        })
    except Exception as e:
        print(f"Delete message error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
