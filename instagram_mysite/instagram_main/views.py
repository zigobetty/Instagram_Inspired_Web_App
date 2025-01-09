# instagram_main/views.py

import re
import json
from django.forms import ValidationError
from django.http import JsonResponse
from django.middleware.csrf import get_token  # Import za CSRF token
from django.views.decorators.csrf import csrf_exempt  # Import za CSRF isključivanje
from .models import User
from .utils import validate_contact_info  # Import funkcije za validaciju
from django.contrib.auth.hashers import check_password

from django.db.models import Q
from django.views.generic import DetailView


def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})


@csrf_exempt
def check_user_exists(request):
    """
    Endpoint za provjeru postojanja korisnika.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        username = data.get('username')

        if User.objects.filter(contact_info=contact_info).exists() or User.objects.filter(username=username).exists():
            return JsonResponse({'exists': True, 'message': 'Korisnik već postoji.'})
        else:
            return JsonResponse({'exists': False})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Preuzmi JSON podatke iz zahtjeva
            contact_info = data.get('contact_info')
            username = data.get('username')
            full_name = data.get('full_name')
            password = data.get('password')

            # Provjeri validnost kontakta
            contact_type = validate_contact_info(contact_info)

            # Kreiraj novog korisnika
            user = User.objects.create(
                username=username,
                contact_info=contact_info,
                full_name=full_name,
                password=password,
            )
            return JsonResponse({'success': True, 'message': 'User registered successfully'})
        except ValidationError as e:
            return JsonResponse({'success': False, 'error': str(e)})
        except Exception as e:
            return JsonResponse({'success': False, 'error': 'Server error: ' + str(e)})



@csrf_exempt
def login_user(request):
    """
    Endpoint za provjeru korisničkih vjerodajnica prilikom logiranja.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        password = data.get('password')

        try:
            # Dohvati korisnika prema kontakt informacijama (email ili broj mobitela)
            user = User.objects.get(contact_info=contact_info)

            # Provjeri da li unijeta lozinka odgovara pohranjenoj lozinci (u čistom tekstu)
            if user.password == password:
                return JsonResponse({'success': True, 'message': 'Logiranje uspješno'})
            else:
                return JsonResponse({'success': False, 'message': 'Pogrešna lozinka'})

        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Korisnik ne postoji. Molimo, registrirajte se.'})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def login_user2(request):
    """
    Endpoint za provjeru korisničkih vjerodajnica prilikom logiranja.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        contact_info = data.get('contact_info')
        password = data.get('password')

        try:
            # Dohvati korisnika prema kontakt informacijama (email, broj mobitela) ili korisničkom imenu
            user = None

            if User.objects.filter(contact_info=contact_info).exists():
                user = User.objects.get(contact_info=contact_info)
            elif User.objects.filter(username=contact_info).exists():
                user = User.objects.get(username=contact_info)
            else:
                return JsonResponse({'success': False, 'message': 'Korisnik ne postoji. Molimo, registrirajte se.'})

            # Provjeri da li unijeta lozinka odgovara pohranjenoj lozinci (u čistom tekstu)
            if user.password == password:
                return JsonResponse({'success': True, 'message': 'Logiranje uspješno'})
            else:
                return JsonResponse({'success': False, 'message': 'Pogrešna lozinka'})

        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Korisnik ne postoji. Molimo, registrirajte se.'})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)


# ZA 2. PRAKTIČNI ZADATAK
# http://localhost:3000/users na ovom linku se prikazuje
def list_users(request):
    """
    Dohvati popis korisnika s opcijom filtriranja prema username i datumu.
    """
    if request.method == 'GET':
        # Dohvati query parametre
        username = request.GET.get('username', None)
        created_at = request.GET.get('created_at', None)

        # Filtriraj korisnike
        users = User.objects.all()
        if username:
            users = users.filter(username__icontains=username)
        if created_at:
            users = users.filter(created_at__date=created_at)

        # Konvertiraj u JSON format
        user_list = list(users.values('id', 'username', 'contact_info', 'full_name', 'created_at'))
        return JsonResponse({'users': user_list})

    return JsonResponse({'error': 'Invalid request method.'}, status=400)

class UserDetailView(DetailView):
    model = User
    pk_url_kwarg = 'pk'  # Primarni ključ iz URL-a
    context_object_name = 'user'  # Objekt koji se prosljeđuje u template
    template_name = None  # Nema template jer vraćamo JSON odgovor

    def render_to_response(self, context, **response_kwargs):
        user = context['user']
        # Pretvaramo korisnika u JSON format
        data = {
            'id': user.id,
            'username': user.username,
            'contact_info': user.contact_info,
            'full_name': user.full_name,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
        }
        return JsonResponse(data)


@csrf_exempt
def delete_user(request):
    """
    Endpoint za brisanje korisnika iz baze.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')

            # Provjeri postoji li korisnik
            user = User.objects.get(id=user_id)
            user.delete()  # Obriši korisnika

            return JsonResponse({'success': True, 'message': 'User deleted successfully'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User does not exist'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'error': 'Invalid request method'}, status=400)
