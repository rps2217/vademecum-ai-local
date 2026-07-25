#!/usr/bin/env python3
"""
Scraper On-Demand para un solo producto
======================================
Este script permite buscar información de un producto específico
usando su SKU o URL directa.

Uso:
    python single_product_scraper.py --sku "12345"
    python single_product_scraper.py --url "https://www.farmaciasknop.com/producto"
    python single_product_scraper.py --sku "12345" --format json

Retorna:
    - Datos estructurados del producto
    - O un JSON con la información encontrada
"""

import argparse
import asyncio
import json
import logging
import random
import sys
import os

# Agregar el directorio scraper al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Page

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# URLs base de Farmacias Knop
BASE_URL = "https://www.farmaciasknop.com"
SEARCH_URL_TEMPLATE = f"{BASE_URL}/catalogsearch/result?q={{sku}}"


async def random_sleep(min_sec: float = 1.5, max_sec: float = 3.0):
    """Rate limiting adaptativo."""
    await asyncio.sleep(random.uniform(min_sec, max_sec))


async def search_product_by_sku(page: Page, sku: str) -> str | None:
    """
    Busca un producto por SKU en el sitio y retorna la URL del producto.
    
    Estrategia:
    1. Ir a la página de búsqueda con el SKU
    2. Buscar el primer resultado que coincida
    3. Retornar la URL del producto
    """
    try:
        search_url = SEARCH_URL_TEMPLATE.format(sku=sku)
        logger.info(f"Buscando SKU '{sku}' en: {search_url}")
        
        await page.goto(search_url, wait_until="domcontentloaded")
        await random_sleep()
        
        # Esperar a que carguen los resultados de búsqueda
        await page.wait_for_selector(
            ".product-item, .vtex-product-summary-2-x-productSummary, .search-results .item",
            timeout=10000
        )
        
        # Buscar el producto más relevante
        # Estrategia: buscar coincidencia exacta con SKU en el resultado
        product_links = await page.query_selector_all(
            "a.product-item-link, .vtex-product-summary-2-x-productLink, .item a"
        )
        
        for link in product_links[:5]:  # Revisar primeros 5 resultados
            href = await link.get_attribute("href")
            if href and BASE_URL in href:
                # Verificar si el SKU aparece en la URL o título
                title = await link.text_content()
                if sku.lower() in (href + (title or "")).lower():
                    logger.info(f"Producto encontrado: {href}")
                    return href
        
        # Si no hay coincidencia exacta, retornar el primer resultado
        if product_links:
            href = await product_links[0].get_attribute("href")
            logger.info(f"Usando primer resultado: {href}")
            return href
        
        return None
        
    except Exception as e:
        logger.error(f"Error buscando SKU {sku}: {e}")
        return None


async def extract_product_data(page: Page, url: str) -> dict | None:
    """
    Extrae información estructurada de un producto desde su URL.
    """
    try:
        logger.info(f"Extrayendo datos de: {url}")
        await page.goto(url, wait_until="domcontentloaded")
        await random_sleep()
        
        # Esperar contenedor del producto
        await page.wait_for_selector(
            ".product-info-main, .vtex-store-components-3-x-productNameContainer, [data-product]",
            timeout=15000
        )
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # 1. Nombre comercial
        title_elem = soup.select_one(
            "h1.page-title span, .vtex-store-components-3-x-productNameContainer span, h1.product-name"
        )
        nombre_comercial = title_elem.get_text(strip=True) if title_elem else None
        
        # 2. SKU
        sku_elem = soup.select_one(
            "[itemprop='sku'], .sku .value, .vtex-product-identifier-0-x-product-identifier__value, .product-code"
        )
        sku = sku_elem.get_text(strip=True) if sku_elem else None
        
        # 3. Marca / Laboratorio
        brand_elem = soup.select_one(
            ".product-brand, [itemprop='brand'], .vtex-store-components-3-x-productBrand, .brand"
        )
        marca = brand_elem.get_text(strip=True) if brand_elem else None
        
        # 4. Descripción
        desc_elem = soup.select_one(
            ".product.attribute.description, #description, .vtex-store-components-3-x-productDescriptionText, .description"
        )
        descripcion = desc_elem.get_text(strip=True) if desc_elem else None
        
        # 5. Precio
        price_elem = soup.select_one(
            "[itemprop='price'], .price-wrapper .price, .vtex-store-components-3-x-sellingPrice, .product-price"
        )
        precio = price_elem.get_text(strip=True) if price_elem else None
        
        # 6. Categoría
        cat_elem = soup.select_one(
            ".breadcrumbs .current, .vtex-breadcrumb-1-x-current, .category-path"
        )
        categoria = cat_elem.get_text(strip=True) if cat_elem else None
        
        # 7. Principios activos (buscar en descripción o especificaciones)
        principios = []
        specs = soup.select(".specs-table tr, .additional-attributes tr, .product-attributes tr")
        for row in specs:
            label = row.select_one("th, .label")
            if label and "principio" in label.get_text().lower():
                value = row.select_one("td, .data")
                if value:
                    principios = [p.strip() for p in value.get_text().split(",")]
                    break
        
        # 8. Indicaciones
        indicaciones_elem = soup.select_one(
            "#tab-label-additional, .product-attributes h3:has-text('Indicaciones')"
        )
        indicaciones = []
        if indicaciones_elem:
            parent = indicaciones_elem.find_parent()
            if parent:
                content = parent.get_text(strip=True)
                if content:
                    indicaciones = [i.strip() for i in content.split("\n") if i.strip()]
        
        # 9. URL de imagen
        img_elem = soup.select_one(
            ".product-image-photo, .vtex-store-components-3-x-productImage, img[itemprop='image']"
        )
        imagen_url = await img_elem.get_attribute("src") if img_elem else None
        
        return {
            "success": True,
            "sku_original": None,  # Se filled externamente
            "url_fuente": url,
            "datos": {
                "nombre_comercial": nombre_comercial,
                "sku": sku,
                "marca": marca,
                "descripcion": descripcion,
                "precio": precio,
                "categoria": categoria,
                "principios_activos": principios,
                "indicaciones": indicaciones,
                "imagen_url": imagen_url
            },
            "errores": []
        }
        
    except Exception as e:
        logger.error(f"Error extrayendo {url}: {e}")
        return {
            "success": False,
            "url_fuente": url,
            "datos": None,
            "errores": [str(e)]
        }


async def scrape_single_product(sku: str = None, url: str = None) -> dict:
    """
    Función principal para scraping on-demand de un solo producto.
    
    Args:
        sku: Código SKU del producto a buscar
        url: URL directa del producto (si se tiene)
    
    Returns:
        dict con datos del producto o información de error
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        # Bloquear imágenes para acelerar
        await page.route("**/*", lambda route: route.continue_() 
                        if route.request.resource_type in ["document", "script", "xhr", "fetch"] 
                        else route.abort())
        
        try:
            # Si tenemos URL directa, usarla
            if url:
                result = await extract_product_data(page, url)
            # Si tenemos SKU, buscar primero
            elif sku:
                logger.info(f"Iniciando búsqueda para SKU: {sku}")
                product_url = await search_product_by_sku(page, sku)
                
                if not product_url:
                    return {
                        "success": False,
                        "sku": sku,
                        "datos": None,
                        "errores": [f"No se encontró producto con SKU: {sku}"]
                    }
                
                result = await extract_product_data(page, product_url)
                result["sku_original"] = sku
            else:
                return {
                    "success": False,
                    "datos": None,
                    "errores": ["Se requiere SKU o URL"]
                }
            
            return result
            
        finally:
            await browser.close()


def main():
    """CLI para ejecutar el scraper."""
    parser = argparse.ArgumentParser(description="Scraper On-Demand para Farmacias Knop")
    parser.add_argument("--sku", "-s", help="SKU del producto a buscar")
    parser.add_argument("--url", "-u", help="URL directa del producto")
    parser.add_argument("--format", "-f", choices=["json", "text"], default="json",
                       help="Formato de salida (default: json)")
    
    args = parser.parse_args()
    
    if not args.sku and not args.url:
        parser.print_help()
        sys.exit(1)
    
    # Ejecutar scraper
    result = asyncio.run(scrape_single_product(sku=args.sku, url=args.url))
    
    # Output
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result["success"] and result["datos"]:
            datos = result["datos"]
            print(f"=== PRODUCTO ENCONTRADO ===")
            print(f"Nombre: {datos.get('nombre_comercial', 'N/A')}")
            print(f"SKU: {datos.get('sku', 'N/A')}")
            print(f"Marca: {datos.get('marca', 'N/A')}")
            print(f"Categoría: {datos.get('categoria', 'N/A')}")
            if datos.get('principios_activos'):
                print(f"Principios: {', '.join(datos['principios_activos'])}")
            if datos.get('descripcion'):
                print(f"Descripción: {datos['descripcion'][:200]}...")
        else:
            print(f"ERROR: {result.get('errores', ['Error desconocido'])}")


if __name__ == "__main__":
    main()
