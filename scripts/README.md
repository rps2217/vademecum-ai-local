# Guía del Scraper Masivo Profesional

Has dado el salto a las grandes ligas. Este sistema está diseñado para correr en tu propia computadora (fuera del navegador) y descargar miles de productos sin que se cuelgue la pestaña.

## ¿Cómo funciona?

El proceso está dividido en dos fases para que sea invencible:

1. **Fase 1: Extracción Bruta (`scraper_local.ts`)**
   - Usa un navegador invisible (Playwright) para navegar por Farmacias Knop.
   - Pasa las páginas automáticamente (Paginación).
   - Extrae el HTML, lo limpia y guarda el texto puro en un archivo `knop_raw_data.json`.
   - *Velocidad:* Extrae unos 60 productos por minuto. No gasta cuota de IA.

2. **Fase 2: Procesamiento IA (`processor_ia.ts`)**
   - Lee el archivo `knop_raw_data.json`.
   - Le envía el texto limpio a Gemini para que lo convierta en el JSON médico estructurado.
   - Guarda el resultado final en `knop_processed_data.json`.
   - *Velocidad:* 1 producto cada 5 segundos (para respetar el límite de 15 RPM de Gemini).
   - *Ventaja:* Si se corta el internet o te bloquean por cuota, el script guarda el progreso. Cuando lo vuelvas a correr, continuará desde donde se quedó.

## ¿Cómo ejecutarlo en tu computadora?

Necesitas tener instalado **Node.js** en tu PC.

1. Abre una terminal en tu computadora y navega hasta la carpeta de tu proyecto.
2. Entra a la carpeta de scripts:
   ```bash
   cd scripts
   ```
3. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   npx playwright install chromium
   ```
4. **Paso 1: Ejecuta el Scraper (Descarga los datos crudos)**
   ```bash
   npm run scrape
   ```
   *Espera a que termine y genere el archivo `knop_raw_data.json`.*

5. **Paso 2: Ejecuta el Procesador IA**
   - Antes de correrlo, abre `scripts/processor_ia.ts` y pon tu API Key de Gemini en la línea 8 (`GEMINI_API_KEY`).
   ```bash
   npm run process
   ```
   *Espera a que termine y genere el archivo `knop_processed_data.json`.*

## ¿Y qué hago con el archivo final?

El archivo `knop_processed_data.json` contendrá miles de productos perfectamente estructurados. Puedes:
1. Convertirlo a CSV usando cualquier herramienta online (JSON to CSV) y subirlo a tu Google Sheet.
2. Importarlo directamente a una base de datos real (Supabase, Firebase, MongoDB) cuando tu app crezca.

## Sobre tu pregunta de la IA Local (WebLLM / Llama 3)

Sí, es totalmente posible usar una IA local. Si tienes una buena tarjeta gráfica (Nvidia RTX 3060 o superior) o un Mac M1/M2/M3 con al menos 16GB de RAM, puedes correr modelos como **Llama 3 (8B)** o **Mistral** localmente usando herramientas como **Ollama** o **LM Studio**.

**¿Cómo se integraría con este scraper?**
En lugar de llamar a `GoogleGenAI` en el archivo `processor_ia.ts`, harías una petición HTTP a tu propio servidor local de Ollama (`http://localhost:11434/api/generate`).

**Ventajas de la IA Local:**
- Costo $0.
- Cuota infinita (puedes procesar 5,000 productos en un par de horas sin pausas).
- Privacidad total.

**Desventajas:**
- Los modelos pequeños (8B) a veces son un poco "tontos" y no respetan el formato JSON tan estrictamente como Gemini, por lo que tendrías que programar más validaciones en el código para arreglar sus errores.

¡Disfruta tu nuevo motor de extracción masiva!
