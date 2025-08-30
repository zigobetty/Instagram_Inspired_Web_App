#!/usr/bin/env python
"""
ASGI server za Instagram chat aplikaciju
Pokretanje: python run_asgi_server.py
"""

import os
import sys
import django

# Dodaj Django project u Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Postavi Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'instagram_mysite.settings')

# Inicijaliziraj Django
django.setup()

# Import ASGI aplikaciju
from instagram_mysite.asgi import application

if __name__ == "__main__":
    import uvicorn
    
    print("Pokretanje ASGI servera za Instagram Chat...")
    print("Server će biti dostupan na: http://localhost:8000")
    print("WebSocket podržan na: ws://localhost:8000/ws/")
    print("Za zaustavljanje pritisnite Ctrl+C")
    print("-" * 50)
    
    # Pokreni ASGI server
    uvicorn.run(
        "instagram_mysite.asgi:application",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
