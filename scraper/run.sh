#!/bin/bash

# ============================================================================
# Script de Instalación y Ejecución Automática del Scraper (Linux/macOS)
# ============================================================================

echo "======================================================="
echo "  Iniciando Instalación del Scraper - Farmacias Knop   "
echo "======================================================="

# 1. Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado."
    echo "Por favor, instala Python 3.10 o superior desde https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 detectado."

# 2. Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual (venv)..."
    python3 -m venv venv
else
    echo "✅ Entorno virtual ya existe."
fi

# 3. Activar entorno virtual
echo "🔄 Activando entorno virtual..."
source venv/bin/activate

# 4. Instalar dependencias
echo "📥 Instalando dependencias desde requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Instalar navegadores de Playwright
echo "🌐 Instalando navegadores de Playwright (Chromium)..."
playwright install chromium

# 6. Solicitar API Key si no está configurada
if [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "⚠️  ATENCIÓN: La variable OPENAI_API_KEY no está configurada."
    echo "El scraper necesita una API Key de OpenAI para procesar los datos médicos."
    read -p "Introduce tu OPENAI_API_KEY (o presiona Enter para usar Ollama local): " api_key
    if [ ! -z "$api_key" ]; then
        export OPENAI_API_KEY="$api_key"
        echo "✅ API Key configurada temporalmente para esta sesión."
    else
        echo "⚠️  Continuando sin API Key. Asegúrate de tener Ollama corriendo localmente."
    fi
fi

# 7. Ejecutar el pipeline
echo ""
echo "🚀 Ejecutando el Pipeline de Scraping..."
echo "======================================================="
python pipeline.py

echo ""
echo "✅ Proceso finalizado."
echo "Los datos estructurados se encuentran en: structured_data.jsonl"
echo "Para importar estos datos a la aplicación web, renombra el archivo a 'catalog.json' y colócalo en la carpeta 'public/' del frontend."
