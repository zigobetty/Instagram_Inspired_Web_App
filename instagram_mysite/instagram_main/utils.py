import re
from django.core.exceptions import ValidationError

def validate_contact_info(contact_info):
    email_regex = r'^\S+@\S+\.\S+$'  # Osnovna provjera za email
    phone_regex = r'^\+?\d{7,15}$'   # Osnovna provjera za broj mobitela

    if re.match(email_regex, contact_info):
        return 'email'
    elif re.match(phone_regex, contact_info):
        return 'phone'
    else:
        raise ValidationError("Unesite ispravan email ili broj mobitela.")
