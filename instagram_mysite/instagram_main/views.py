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


