@echo off
echo  Pokretanje ASGI servera za Instagram Chat...
echo.

REM Provjeri da li je virtual environment aktivan
if not defined VIRTUAL_ENV (
    echo Virtual environment nije aktivan!
    echo Aktivirajte virtual environment prvo:
    echo    workon instagram_env
    echo.
    pause
    exit /b 1
)

REM Instaliraj potrebne pakete
echo Instaliranje potrebnih paketa...
pip install -r requirements.txt

echo.
echo Pokretanje ASGI servera...
echo Server će biti dostupan na: http://localhost:8000
echo WebSocket podržan na: ws://localhost:8000/ws/
echo.

REM Pokreni ASGI server
python run_asgi_server.py

pause
