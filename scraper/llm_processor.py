import asyncio
import json
import logging
import os
from enum import Enum
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración del Cliente OpenAI (Puede apuntar a Ollama local cambiando base_url)
# Para Ollama local: client = AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "tu-api-key-aqui"))

# --- DEFINICIÓN ESTRICTA DEL ESQUEMA (PYDANTIC) ---
class SafetyStatus(str, Enum):
    SI = "SI"
    NO = "NO"
    PRECAUCION = "PRECAUCION"

class ProductSchema(BaseModel):
    sku: str = Field(description="Código único del producto")
    nombre_comercial: str = Field(description="Nombre del producto")
    descripcion: str = Field(description="Descripción general del producto")
    principios_activos: list[str] = Field(description="Lista de principios activos o ingredientes principales")
    posologia: str = Field(description="Dosis recomendada o modo de uso")
    indicaciones: list[str] = Field(description="Lista de síntomas o condiciones para las que se indica")
    advertencias: str = Field(description="Contraindicaciones, advertencias y efectos secundarios")
    tags_ia: list[str] = Field(description="5 etiquetas clave para búsqueda (ej: dolor, fitoterapia, sueño)")
    
    # Semáforo de seguridad inferido por la IA basado en la descripción
    apto_embarazo: SafetyStatus = Field(description="¿Es seguro en el embarazo basado en el texto?")
    apto_lactancia: SafetyStatus = Field(description="¿Es seguro en la lactancia basado en el texto?")
    apto_pediatria: SafetyStatus = Field(description="¿Es seguro para niños basado en el texto?")
    apto_diabeticos: SafetyStatus = Field(description="¿Contiene azúcar o es contraindicado para diabéticos?")
    apto_hipertensos: SafetyStatus = Field(description="¿Sube la presión arterial o tiene sodio alto?")
    apto_celiacos: SafetyStatus = Field(description="¿Contiene gluten?")
    
    sugerencia_complementaria: str = Field(description="Un consejo breve de salud relacionado al producto")

# --- PROMPT DEL SISTEMA ---
SYSTEM_PROMPT = """
Eres un Ingeniero de Datos Médicos y Farmacólogo Experto.
Tu tarea es analizar el texto crudo (HTML/Texto) extraído de la ficha técnica de un medicamento natural, homeopático o suplemento, y estructurarlo estrictamente en formato JSON.

REGLAS CRÍTICAS:
1. Extrae los principios activos reales (ej: "Extracto de Valeriana", no "Excipientes c.s.p.").
2. Si la posología no se menciona, escribe "Consultar al médico o farmacéutico".
3. Para el semáforo de seguridad (Embarazo, Lactancia, etc.):
   - Si el texto dice "No usar en embarazo", asigna "NO".
   - Si dice "Precaución" o "Consulte a su médico", asigna "PRECAUCION".
   - Si no menciona nada, por defecto en productos naturales/homeopáticos asigna "PRECAUCION" por seguridad, a menos que sea explícitamente seguro ("SI").
4. Limpia cualquier etiqueta HTML residual. Devuelve solo texto limpio.
"""

async def process_product_html(raw_data: dict) -> dict | None:
    """Envía el HTML crudo al LLM para extraer y estructurar los datos."""
    sku = raw_data.get("sku", "N/A")
    title = raw_data.get("title", "N/A")
    raw_html = raw_data.get("raw_html", "")
    
    if not raw_html or len(raw_html.strip()) < 10:
        logger.warning(f"SKU {sku} no tiene suficiente HTML para procesar.")
        return None

    user_prompt = f"Producto: {title}\nSKU: {sku}\n\nFicha Técnica Cruda:\n{raw_html}"

    try:
        logger.info(f"Procesando SKU {sku} con LLM...")
        
        # Usamos la funcionalidad de Structured Outputs (Response Format) de OpenAI
        # Esto garantiza que el JSON devuelto cumpla 100% con el esquema Pydantic
        response = await client.chat.completions.create(
            model="gpt-4o-mini", # Modelo rápido y económico, ideal para ETL
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "product_schema",
                    "schema": ProductSchema.model_json_schema(),
                    "strict": True
                }
            },
            temperature=0.1 # Baja temperatura para mayor determinismo
        )
        
        # Parsear el JSON devuelto por el LLM
        content = response.choices[0].message.content
        if not content:
            raise ValueError("El LLM devolvió un contenido vacío.")
            
        structured_json = json.loads(content)
        
        # Validar con Pydantic (Doble seguridad)
        validated_data = ProductSchema(**structured_json)
        
        return validated_data.model_dump()

    except Exception as e:
        error_msg = f"Error procesando SKU {sku} con LLM: {str(e)}"
        logger.error(error_msg)
        with open("llm_error_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{error_msg}\n")
        return None

async def run_llm_processor(input_file: str = "raw_data.jsonl", output_file: str = "structured_data.jsonl"):
    """Lee el archivo crudo, procesa cada línea con el LLM y guarda el resultado estructurado."""
    if not os.path.exists(input_file):
        logger.error(f"El archivo {input_file} no existe. Ejecuta el extractor primero.")
        return

    logger.info("Iniciando procesamiento LLM...")
    
    with open(input_file, "r", encoding="utf-8") as infile:
        lines = infile.readlines()

    for line in lines:
        if not line.strip(): continue
        
        raw_data = json.loads(line)
        
        # Procesar con LLM
        structured_data = await process_product_html(raw_data)
        
        if structured_data:
            # Guardar inmediatamente (Persistencia JSONL)
            with open(output_file, "a", encoding="utf-8") as outfile:
                outfile.write(json.dumps(structured_data, ensure_ascii=False) + "\n")
                
        # Pequeña pausa para no saturar la API (Rate Limiting)
        await asyncio.sleep(0.5)
        
    logger.info(f"Procesamiento LLM finalizado. Datos limpios en {output_file}")

if __name__ == "__main__":
    # Para probar el procesador de forma aislada
    asyncio.run(run_llm_processor())
