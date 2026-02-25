import asyncio
import random
import logging
from playwright.async_api import async_playwright, Page

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# User-Agent realista para evitar bloqueos por WAF (Cloudflare, Akamai, etc.)
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Categorías objetivo de Farmacias Knop (URLs base)
CATEGORIES = [
    "https://www.farmaciasknop.com/homeopatia",
    "https://www.farmaciasknop.com/fitoterapia",
    "https://www.farmaciasknop.com/vitaminas-y-suplementos",
    "https://www.farmaciasknop.com/salud-natural"
]

async def random_sleep(min_sec: float = 2.0, max_sec: float = 5.0):
    """Implementa Rate Limiting con pausas aleatorias para simular comportamiento humano."""
    sleep_time = random.uniform(min_sec, max_sec)
    logger.debug(f"Pausa de {sleep_time:.2f} segundos...")
    await asyncio.sleep(sleep_time)

async def extract_urls_from_category(page: Page, category_url: str) -> set[str]:
    """Navega por una categoría, maneja la paginación y extrae las URLs de los productos."""
    product_urls = set()
    
    try:
        logger.info(f"Iniciando crawling en categoría: {category_url}")
        await page.goto(category_url, wait_until="domcontentloaded")
        
        page_num = 1
        while True:
            logger.info(f"Extrayendo página {page_num} de {category_url}")
            await random_sleep()
            
            # --- SELECTORES CSS DINÁMICOS (A AJUSTAR SEGÚN EL SITIO) ---
            # Busca los enlaces (<a>) que envuelven a los productos en la grilla.
            # Ejemplo común en Magento/VTEX: 'a.product-item-link', '.product-card a'
            product_links = await page.locator("a.product-item-link, .vtex-product-summary-2-x-clearLink").all()
            
            for link in product_links:
                href = await link.get_attribute("href")
                if href:
                    # Asegurar que la URL sea absoluta
                    full_url = href if href.startswith("http") else f"https://www.farmaciasknop.com{href}"
                    product_urls.add(full_url)
            
            # --- MANEJO DE PAGINACIÓN ---
            # Buscar el botón "Siguiente" o "Cargar más"
            # Ejemplo: '.action.next', '.vtex-search-result-3-x-buttonShowMore button'
            next_button = page.locator(".action.next, .vtex-search-result-3-x-buttonShowMore button").first
            
            if await next_button.count() > 0 and await next_button.is_visible():
                logger.info("Botón 'Siguiente' detectado. Navegando...")
                await next_button.click()
                # Esperar a que la red se calme o un elemento nuevo aparezca
                await page.wait_for_load_state("networkidle")
                page_num += 1
            else:
                logger.info(f"Fin de paginación alcanzado para {category_url}.")
                break
                
    except Exception as e:
        error_msg = f"Error crítico en categoría {category_url}: {str(e)}"
        logger.error(error_msg)
        with open("error_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{error_msg}\n")
            
    return product_urls

async def run_crawler() -> list[str]:
    """Orquesta el crawling de todas las categorías y retorna una lista única de URLs."""
    all_urls = set()
    
    async with async_playwright() as p:
        # Lanzar navegador (headless=False para depurar visualmente los selectores la primera vez)
        browser = await p.chromium.launch(headless=True)
        
        # Crear un contexto con User-Agent y Viewport realista
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1920, "height": 1080},
            java_script_enabled=True
        )
        
        page = await context.new_page()
        
        # Bloquear recursos innecesarios (imágenes, fuentes) para acelerar el scraping
        await page.route("**/*", lambda route: route.continue_() if route.request.resource_type in ["document", "script", "xhr", "fetch"] else route.abort())

        for category in CATEGORIES:
            urls = await extract_urls_from_category(page, category)
            all_urls.update(urls)
            
        await browser.close()
        
    logger.info(f"Crawling finalizado. Total de URLs únicas extraídas: {len(all_urls)}")
    return list(all_urls)

if __name__ == "__main__":
    # Para probar el crawler de forma aislada
    urls = asyncio.run(run_crawler())
    with open("urls_extraidas.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(urls))
