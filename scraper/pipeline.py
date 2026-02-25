import asyncio
import logging
import os
from crawler import run_crawler
from extractor import run_extractor
from llm_processor import run_llm_processor

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    """Orquestador Principal del Pipeline ETL."""
    
    logger.info("=== INICIANDO PIPELINE DE SCRAPING FARMACIAS KNOP ===")
    
    # Archivos de persistencia
    URLS_FILE = "urls_extraidas.txt"
    RAW_DATA_FILE = "raw_data.jsonl"
    STRUCTURED_DATA_FILE = "structured_data.jsonl"
    
    # 1. FASE DE CRAWLING (Extracción de URLs)
    if not os.path.exists(URLS_FILE):
        logger.info("Fase 1: Crawling de Categorías...")
        urls = await run_crawler()
        with open(URLS_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(urls))
    else:
        logger.info(f"Fase 1: Omitida. Archivo {URLS_FILE} ya existe.")
        with open(URLS_FILE, "r", encoding="utf-8") as f:
            urls = [line.strip() for line in f if line.strip()]

    # 2. FASE DE EXTRACCIÓN (Scraping de Fichas Técnicas)
    if not os.path.exists(RAW_DATA_FILE):
        logger.info("Fase 2: Extracción de HTML Crudo...")
        await run_extractor(urls, output_file=RAW_DATA_FILE)
    else:
        logger.info(f"Fase 2: Omitida. Archivo {RAW_DATA_FILE} ya existe.")
        
    # 3. FASE DE PROCESAMIENTO NLP (Estructuración con LLM)
    if not os.path.exists(STRUCTURED_DATA_FILE):
        logger.info("Fase 3: Procesamiento Semántico con LLM...")
        # Asegúrate de tener la variable de entorno OPENAI_API_KEY configurada
        if not os.getenv("OPENAI_API_KEY"):
            logger.warning("¡ATENCIÓN! No se encontró OPENAI_API_KEY. El procesamiento LLM podría fallar si no usas un modelo local (Ollama).")
            
        await run_llm_processor(input_file=RAW_DATA_FILE, output_file=STRUCTURED_DATA_FILE)
    else:
        logger.info(f"Fase 3: Omitida. Archivo {STRUCTURED_DATA_FILE} ya existe.")

    logger.info("=== PIPELINE COMPLETADO EXITOSAMENTE ===")
    logger.info(f"Los datos finales estructurados y validados están en: {STRUCTURED_DATA_FILE}")

if __name__ == "__main__":
    # Ejecutar el orquestador asíncrono
    asyncio.run(main())
