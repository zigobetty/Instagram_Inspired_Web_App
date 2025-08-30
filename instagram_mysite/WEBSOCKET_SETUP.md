# 🔌 WebSocket Setup za Instagram Chat

## Problem
Standardni Django development server (`python manage.py runserver`) ne podržava WebSocket protokol, što uzrokuje grešku:
```
WebSocket connection failed: Error during WebSocket handshake: Unexpected response code: 200
```

## Rješenje
Koristimo ASGI server koji podržava WebSocket konekcije.

## 📋 Koraci za pokretanje

### 1. Instaliraj potrebne pakete
```bash
pip install -r requirements.txt
```

### 2. Pokreni ASGI server

#### Opcija A: Koristi batch datoteku (Windows)
```bash
start_asgi_server.bat
```

#### Opcija B: Pokreni direktno
```bash
python run_asgi_server.py
```

#### Opcija C: Koristi uvicorn direktno
```bash
uvicorn instagram_mysite.asgi:application --host 0.0.0.0 --port 8000 --reload
```

### 3. Provjeri da li radi
- 🌐 HTTP API: http://localhost:8000
- 🔌 WebSocket: ws://localhost:8000/ws/chat/{conversation_id}/

## 🚨 Važne napomene

1. **NE koristi** `python manage.py runserver` - neće raditi WebSocket
2. **Koristi samo** ASGI server iz ovih uputa
3. **Provjeri** da je virtual environment aktivan
4. **Instaliraj** sve pakete iz `requirements.txt`

## 🔧 Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'uvicorn'"
```bash
pip install uvicorn==0.24.0
```

### Problem: "ModuleNotFoundError: No module named 'channels'"
```bash
pip install channels==4.0.0
```

### Problem: WebSocket i dalje ne radi
1. Provjeri da li je ASGI server pokrenut
2. Provjeri konzolu za greške
3. Provjeri da li je `asgi.py` ispravno konfiguriran

## ✅ Uspješno pokretanje
Kada je sve ispravno, trebali biste vidjeti:
```
🚀 Pokretanje ASGI servera za Instagram Chat...
📍 Server će biti dostupan na: http://localhost:8000
🔌 WebSocket podržan na: ws://localhost:8000/ws/
⏹️  Za zaustavljanje pritisnite Ctrl+C
--------------------------------------------------
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
