@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Script de Instalación y Ejecución Automática del Scraper (Windows)
:: ============================================================================

echo =======================================================
echo   Iniciando Instalacion del Scraper - Farmacias Knop   
echo =======================================================

:: 1. Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Error: Python no esta instalado o no esta en el PATH.
    echo Por favor, instala Python 3.10 o superior desde https://www.python.org/downloads/
    echo Asegurate de marcar la opcion "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)

echo [OK] Python detectado.

:: 2. Crear entorno virtual si no existe
if not exist "venv\" (
    echo [ ] Creando entorno virtual (venv)...
    python -m venv venv
) else (
    echo [OK] Entorno virtual ya existe.
)

:: 3. Activar entorno virtual
echo [ ] Activando entorno virtual...
call venv\Scripts\activate.bat

:: 4. Instalar dependencias
echo [ ] Instalando dependencias desde requirements.txt...
python -m pip install --upgrade pip
pip install -r requirements.txt

:: 5. Instalar navegadores de Playwright
echo [ ] Instalando navegadores de Playwright (Chromium)...
playwright install chromium

:: 6. Solicitar API Key si no está configurada
if "%OPENAI_API_KEY%"=="" (
    echo.
    echo [!] ATENCION: La variable OPENAI_API_KEY no esta configurada.
    echo El scraper necesita una API Key de OpenAI para procesar los datos medicos.
    set /p api_key="Introduce tu OPENAI_API_KEY (o presiona Enter para usar Ollama local): "
    if not "!api_key!"=="" (
        set OPENAI_API_KEY=!api_key!
        echo [OK] API Key configurada temporalmente para esta sesion.
    ) else (
        echo [!] Continuando sin API Key. Asegurate de tener Ollama corriendo localmente.
    )
)

:: 7. Ejecutar el pipeline
echo.
echo [ ] Ejecutando el Pipeline de Scraping...
echo =======================================================
python pipeline.py

echo.
echo [OK] Proceso finalizado.
echo Los datos estructurados se encuentran en: structured_data.jsonl
echo Para importar estos datos a la aplicacion web, renombra el archivo a 'catalog.json' y colocalo en la carpeta 'public/' del frontend.
pause
