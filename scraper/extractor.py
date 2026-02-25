import asyncio
import json
import logging
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Page

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

async def random_sleep(min_sec: float = 2.0, max_sec: float = 5.0):
    """Rate Limiting para no saturar el servidor."""
    await asyncio.sleep(random.uniform(min_sec, max_sec))

async def extract_product_data(page: Page, url: str) -> dict | None:
    """Extrae el HTML crudo de la ficha técnica de un producto."""
    try:
        logger.info(f"Extrayendo datos de: {url}")
        await page.goto(url, wait_until="domcontentloaded")
        await random_sleep()
        
        # Esperar a que el contenedor principal del producto cargue
        # Ejemplo: '.product-info-main', '.vtex-store-components-3-x-productNameContainer'
        await page.wait_for_selector(".product-info-main, .vtex-store-components-3-x-productNameContainer", timeout=10000)
        
        # Obtener el HTML completo de la página renderizada por JS
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # --- SELECTORES CSS DINÁMICOS (A AJUSTAR SEGÚN EL SITIO) ---
        
        # 1. Título del Producto
        title_elem = soup.select_one("h1.page-title, .vtex-store-components-3-x-productNameContainer span")
        title = title_elem.get_text(strip=True) if title_elem else "N/A"
        
        # 2. SKU / Código
        sku_elem = soup.select_one("[itemprop='sku'], .sku .value, .vtex-product-identifier-0-x-product-identifier__value")
        sku = sku_elem.get_text(strip=True) if sku_elem else "N/A"
        
        # 3. Marca / Laboratorio
        brand_elem = soup.select_one(".product-brand, [itemprop='brand'], .vtex-store-components-3-x-productBrand")
        brand = brand_elem.get_text(strip=True) if brand_elem else "N/A"
        
        # 4. Descripción y Detalles (HTML Crudo)
        # Aquí extraemos el bloque completo de texto/HTML para que el LLM lo procese después.
        # Buscamos las pestañas de "Descripción", "Información Adicional", "Composición".
        desc_elem = soup.select_one(".product.attribute.description, #description, .vtex-store-components-3-x-productDescriptionText")
        description_html = str(desc_elem) if desc_elem else ""
        
        # Opcional: Extraer tabla de especificaciones si existe
        specs_elem = soup.select_one(".product.attribute.additional, #additional, .vtex-store-components-3-x-specificationsTableContainer")
        specs_html = str(specs_elem) if specs_elem else ""
        
        # Consolidar el HTML crudo que enviaremos al LLM
        raw_technical_sheet = f"{description_html}\n{specs_html}"
        
        return {
            "url": url,
            "sku": sku,
            "title": title,
            "brand": brand,
            "raw_html": raw_technical_sheet
        }
        
    except Exception as e:
        error_msg = f"Error extrayendo {url}: {str(e)}"
        logger.error(error_msg)
        with open("error_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{error_msg}\n")
        return None

async def run_extractor(urls: list[str], output_file: str = "raw_data.jsonl"):
    """Orquesta la extracción de una lista de URLs y guarda en JSONL."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        # Bloquear imágenes para acelerar la carga
        await page.route("**/*", lambda route: route.continue_() if route.request.resource_type in ["document", "script", "xhr", "fetch"] else route.abort())

        for url in urls:
            data = await extract_product_data(page, url)
            if data:
                # Persistencia inmediata (JSON Lines)
                # Si el script se cae en el producto 500, los primeros 499 ya están guardados.
                with open(output_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(data, ensure_ascii=False) + "\n")
                    
        await browser.close()
        logger.info(f"Extracción finalizada. Datos guardados en {output_file}")

if __name__ == "__main__":
    # Para probar el extractor de forma aislada
    test_urls = [
        "https://www.farmaciasknop.com/ejemplo-producto-1",
        "https://www.farmaciasknop.com/ejemplo-producto-2"
    ]
    asyncio.run(run_extractor(test_urls))
