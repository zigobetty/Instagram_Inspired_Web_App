import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
from django.views.generic import DetailView
from .models import User
from .models import UserPost
from .models import UserComment
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
import json
from django.core.files.base import ContentFile
import base64
from django.contrib.auth import logout


def generate_unique_id():
    """Generira jedinstveni ID za korisnika."""
    return str(uuid.uuid4())

@ensure_csrf_cookie
def get_csrf_token(request):
    """Vraća CSRF token za frontend."""
    return JsonResponse({'csrfToken': get_token(request)})

@csrf_exempt
def check_user_exists(request):
    """Provjerava postoji li korisnik prema kontakt informacijama ili korisničkom imenu."""
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        username = data.get('username')

        if User.objects.filter(Q(contact_info=contact_info) | Q(username=username)).exists():
            return JsonResponse({'exists': True, 'message': 'Korisnik već postoji.'})
        else:
            return JsonResponse({'exists': False})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            contact_info = data.get('contact_info')
            username = data.get('username')
            full_name = data.get('full_name')
            password = data.get('password')

            # Hashiraj lozinku prije spremanja u bazu
            hashed_password = make_password(password)

            user = User.objects.create(
                username=username,
                contact_info=contact_info,
                full_name=full_name,
                password=hashed_password  # Spremi hashiranu lozinku
            )

            request.session['user_id'] = user.id  # Spremi user_id u sesiju

            return JsonResponse({'success': True, 'message': 'Korisnik uspješno registriran'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Metoda nije dopuštena'}, status=405)

@csrf_exempt
def login_user2(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        password = data.get('password')

        try:
            user = User.objects.filter(Q(contact_info=contact_info) | Q(username=contact_info)).first()

            if not user:
                print("❌ Korisnik ne postoji")
                return JsonResponse({'success': False, 'message': 'Korisnik ne postoji. Molimo registrirajte se.'}, status=404)

            # Provjera lozinke pomoću Django-ove sigurnosne funkcije
            if check_password(password, user.password):
                request.session['user_id'] = user.id  # POSTAVLJAMO USER_ID
                print(f"✅ Prijavljen korisnik: {user.username}, ID: {user.id}")  # Debug ispis

                return JsonResponse({'success': True, 'message': 'Prijava uspješna', 'user_id': user.id})
            else:
                print("❌ Pogrešna lozinka")
                return JsonResponse({'success': False, 'message': 'Pogrešna lozinka'}, status=401)

        except Exception as e:
            print(f"❌ Greška na serveru: {e}")  # Debug ispis
            return JsonResponse({'success': False, 'message': f'Greška na serveru: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Metoda nije dopuštena'}, status=405)


@csrf_exempt
def login_user(request):
    """Prijava korisnika sa sigurnom provjerom lozinke."""
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        password = data.get('password')

        user = User.objects.filter(Q(contact_info=contact_info) | Q(username=contact_info)).first()

        if not user:
            return JsonResponse({'success': False, 'message': 'Korisnik ne postoji. Molimo registrirajte se.'}, status=404)

        if check_password(password, user.password):
            request.session['user_id'] = user.id
            return JsonResponse({'success': True, 'message': 'Logiranje uspješno', 'user': {
                'id': user.id,
                'username': user.username,
                'email': user.contact_info,
                'full_name': user.full_name
            }})
        else:
            return JsonResponse({'success': False, 'message': 'Pogrešna lozinka'}, status=401)

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"success": True})

@csrf_exempt
def get_user_profile(request):
    """Dohvaćanje profila logiranog korisnika."""
    if request.method == 'GET':
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'Korisnik nije logiran.'}, status=401)

        user = User.objects.get(id=user_id)
        profile_image_url = request.build_absolute_uri(user.profile_image.url) if user.profile_image else None

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
                'profile_image_url': profile_image_url 
            }
        })

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

def list_users(request):
    """Prikaz popisa korisnika s opcijom filtriranja."""
    if request.method == 'GET':
        username = request.GET.get('username')
        created_at = request.GET.get('created_at')

        users = User.objects.all()
        if username:
            users = users.filter(username__icontains=username)
        if created_at:
            users = users.filter(created_at__date=created_at)

        user_list = list(users.values('id', 'username', 'contact_info', 'full_name', 'created_at'))
        return JsonResponse({'users': user_list})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

class UserDetailView(DetailView):
    """Dohvaćanje detalja korisnika."""
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
            'created_at': user.created_at,
            'updated_at': user.updated_at,
        })

@csrf_exempt
def delete_user(request):
    """Brisanje korisnika iz baze."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')

            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({'success': True, 'message': 'Korisnik uspješno obrisan'})

        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Korisnik ne postoji'}, status=404)

    return JsonResponse({'error': 'Invalid request method.'}, status=400)


@csrf_exempt
def upload_user_image(request):
    if request.method == 'POST':
        user_id = request.session.get('user_id')
        print(f"🛠 User ID iz sesije: {user_id}")  # Debug ispis

        if not user_id:
            return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

        data = json.loads(request.body)
        image_data = data.get('picture')
        description = data.get('description', '')

        if not image_data:
            return JsonResponse({'success': False, 'error': 'No image provided'}, status=400)

        try:
            user = User.objects.filter(id=user_id).first()
            print(f"🔎 Pronađen korisnik: {user}")  # Debug ispis

            if not user:
                return JsonResponse({'success': False, 'error': 'User does not exist'}, status=404)

            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]

            image_file = ContentFile(base64.b64decode(imgstr), name=f"user_{user.id}_{uuid.uuid4()}.{ext}")

            post = UserPost.objects.create(user=user, image=image_file, description=description)

            return JsonResponse({'success': True, 'message': 'Image uploaded successfully!', 'post_id': post.id})
        except Exception as e:
            print(f"❌ Greška kod uploada slike: {e}")  # Debug ispis
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)





@csrf_exempt
def get_user_images(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

    try:
        posts = UserPost.objects.filter(user_id=user_id).order_by('-created_at')
        images = [{'id': post.id, 'image_url': request.build_absolute_uri(post.image.url), 'description': post.description} for post in posts]

        print(f"✅ Dohvaćene slike: {images}")  # Debug ispis

        return JsonResponse({'success': True, 'images': images})
    except Exception as e:
        print(f"❌ Greška kod dohvaćanja slika: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
def delete_user_image(request, image_id):
    """Brisanje slike korisnika prema ID-ju"""
    if request.method == 'DELETE':
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

        try:
            post = UserPost.objects.get(id=image_id, user_id=user_id)
            if post.image:
                post.image.delete(save=False)  # Briše sliku iz medijskog direktorija
            post.delete()  # Briše zapis iz baze
            return JsonResponse({'success': True, 'message': 'Image deleted successfully'})
        except UserPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Image not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)



@csrf_exempt
def update_user_profile(request):
    """Ažurira profil logiranog korisnika"""
    if request.method == 'POST':
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

        data = json.loads(request.body)
        username = data.get('username')
        contact_info = data.get('contact_info')
        full_name = data.get('full_name')

        try:
            user = User.objects.get(id=user_id)
            if username:
                user.username = username
            if contact_info:
                user.contact_info = contact_info
            if full_name:
                user.full_name = full_name

            user.save()
            return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def update_profile_image(request):
    if request.method == 'POST':
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

        data = json.loads(request.body)
        image_data = data.get('picture')

        if not image_data:
            return JsonResponse({'success': False, 'error': 'No image provided'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]

            image_file = ContentFile(base64.b64decode(imgstr), name=f"profile_{user.id}_{uuid.uuid4()}.{ext}")

            user.profile_image.save(image_file.name, image_file)  # Sprema novu profilnu sliku
            user.save()

            # ✅ Vraća puni URL slike
            profile_image_url = request.build_absolute_uri(user.profile_image.url)

            return JsonResponse({'success': True, 'message': 'Profile image updated successfully', 'profile_image_url': profile_image_url})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def remove_profile_image(request):
    """Briše profilnu sliku korisnika i postavlja default sliku."""
    if request.method == 'POST':
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'User is not logged in'}, status=401)

        try:
            user = User.objects.get(id=user_id)
            
            # Briše sliku iz medijskog direktorija ako postoji
            if user.profile_image:
                user.profile_image.delete()
            
            # Postavlja polje na None
            user.profile_image = None
            user.save()

            return JsonResponse({'success': True, 'message': 'Profile image removed successfully'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def add_comment(request):
    if request.method == "POST":
        user_id = request.session.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "error": "User not logged in"}, status=401)

        data = json.loads(request.body)
        post_id = data.get("post_id")
        text = data.get("text")

        if not post_id or not text:
            return JsonResponse({"success": False, "error": "Missing post ID or comment text"}, status=400)

        try:
            user = User.objects.get(id=user_id)
            post = UserPost.objects.get(id=post_id)

            comment = UserComment.objects.create(user=user, post=post, text=text)

            return JsonResponse({"success": True, "message": "Comment added", "comment_id": comment.id})
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found"}, status=404)
        except UserPost.DoesNotExist:
            return JsonResponse({"success": False, "error": "Post not found"}, status=404)

    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def get_comments(request, post_id):
    if request.method == "GET":
        try:
            comments = UserComment.objects.filter(post_id=post_id).order_by("-created_at")
            comment_data = [
                {
                    "id": comment.id,
                    "user": comment.user.username,
                    "text": comment.text,
                    "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M"),
                }
                for comment in comments
            ]

            return JsonResponse({"success": True, "comments": comment_data})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)


@csrf_exempt
def delete_comment(request, comment_id):
    """Briše određeni komentar prema ID-ju"""
    if request.method == "DELETE":
        user_id = request.session.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "error": "User not logged in"}, status=401)

        try:
            comment = UserComment.objects.get(id=comment_id, user_id=user_id)
            comment.delete()
            return JsonResponse({"success": True, "message": "Comment deleted successfully"})
        except UserComment.DoesNotExist:
            return JsonResponse({"success": False, "error": "Comment not found"}, status=404)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def search_users(request):
    """Pretražuje korisnike prema korisničkom imenu ili punom imenu."""
    if request.method == "GET":
        query = request.GET.get("query", "").strip()

        if not query:
            return JsonResponse({"success": False, "error": "Search query is required"}, status=400)

        users = User.objects.filter(
            Q(username__icontains=query) | Q(full_name__icontains=query)
        )

        user_list = []
        for user in users:
            profile_image_url = None
            if user.profile_image:
                profile_image_url = request.build_absolute_uri(user.profile_image.url)
                
            user_list.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "profile_image": profile_image_url
            })

        return JsonResponse({"success": True, "users": user_list})

    return JsonResponse({"error": "Invalid request method"}, status=400)


