# Vademécum Inteligente (Local-First)

Aplicación web progresiva (PWA) para farmacéuticos que permite consultar medicamentos, analizar interacciones y obtener recomendaciones clínicas utilizando Inteligencia Artificial que se ejecuta 100% localmente en el dispositivo (sin necesidad de conexión a internet).

## Características Principales

1.  **Local-First Architecture**: Toda la base de datos de medicamentos se descarga y sincroniza en el navegador usando IndexedDB.
2.  **IA Clínica Local**: Integra `@mlc-ai/web-llm` y `Transformers.js` para ejecutar modelos de lenguaje (LLMs) directamente en la GPU/CPU del dispositivo del usuario.
3.  **Análisis Cruzado**: Permite seleccionar múltiples medicamentos en una "bandeja" para que la IA analice posibles interacciones, duplicidad terapéutica o contraindicaciones.
4.  **Soporte Offline (PWA)**: La aplicación se puede instalar en móviles y escritorio, funcionando completamente sin conexión a internet gracias a los Service Workers.
5.  **Scraper Modular (Python)**: Incluye un pipeline ETL automatizado para extraer y estructurar el catálogo de Farmacias Knop.

---

## 🚀 Cómo ejecutar el Frontend (Aplicación Web)

El frontend está construido con React, Vite y Tailwind CSS.

### Requisitos
*   [Node.js](https://nodejs.org/) (v18 o superior)

### Instalación y Ejecución Local

1.  **Clonar el repositorio** y navegar a la carpeta raíz.
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Iniciar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
4.  Abre tu navegador en `http://localhost:3000`.

### Despliegue (Producción)
Para generar la versión optimizada y los archivos del Service Worker (PWA):
```bash
npm run build
```
La carpeta `dist/` contendrá los archivos listos para ser alojados en Vercel, Netlify o GitHub Pages.

---

## 🕷️ Cómo ejecutar el Scraper (Extracción de Datos)

El módulo de scraping está diseñado para ser multiplataforma y autoinstalable. Extrae los datos de Farmacias Knop, los limpia usando un LLM (OpenAI o modelo local) y genera el catálogo para la aplicación web.

### Requisitos
*   [Python 3.10+](https://www.python.org/downloads/) (Asegúrate de marcar "Add Python to PATH" durante la instalación en Windows).

### Autoinstalación y Ejecución

Hemos incluido scripts que automatizan la creación del entorno virtual, la instalación de dependencias (Playwright, BeautifulSoup, Pydantic) y la ejecución del pipeline.

**En Windows:**
1. Abre la carpeta `scraper/`.
2. Haz doble clic en el archivo `run.bat` (o ejecútalo desde la terminal: `.\run.bat`).
3. El script te pedirá tu API Key de OpenAI (opcional si usas Ollama local).
4. Espera a que termine el proceso.

**En macOS / Linux:**
1. Abre una terminal y navega a la carpeta `scraper/`.
2. Dale permisos de ejecución al script:
   ```bash
   chmod +x run.sh
   ```
3. Ejecuta el script:
   ```bash
   ./run.sh
   ```

### ¿Qué hace el Scraper?
1.  **Crawling**: Navega por las categorías y extrae las URLs de los productos (`urls_extraidas.txt`).
2.  **Extracción**: Descarga el HTML crudo de cada ficha técnica (`raw_data.jsonl`).
3.  **Procesamiento LLM**: Limpia y estructura los datos en formato JSON estricto (`structured_data.jsonl`).

### Actualizar la Base de Datos de la App
Una vez que el scraper termine, generará un archivo llamado `structured_data.jsonl`.
Para que la aplicación web lo utilice:
1.  Renombra el archivo a `catalog.json`.
2.  Muévelo a la carpeta `public/` en la raíz del proyecto frontend.
3.  La próxima vez que abras la aplicación web, el `SyncService` detectará el nuevo archivo y actualizará la base de datos local (IndexedDB).
