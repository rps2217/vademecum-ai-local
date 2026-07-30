# Instrucciones para Crear Tablas en Supabase

## Opción 1: Dashboard de Supabase (Recomendado)

### Pasos:

1. **Abre el Dashboard de Supabase:**
   ```
   https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt
   ```

2. **Ve al SQL Editor:**
   - En el menú lateral izquierdo, haz clic en **SQL Editor** (icono de terminal)

3. **Crea una nueva consulta:**
   - Clic en el botón **New Query** (esquina superior derecha)

4. **Copia el contenido del archivo:**
   ```
   scripts/supabase_synergies_schema.sql
   ```
   
   O copia este SQL directamente:

```sql
-- TABLA 1: ingredient_knowledge
CREATE TABLE IF NOT EXISTS public.ingredient_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nombre_latin VARCHAR(255),
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    mecanismo_accion TEXT,
    beneficios TEXT[],
    dosis_recomendada VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_knowledge_id ON public.ingredient_knowledge(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_knowledge_categoria ON public.ingredient_knowledge(categoria);

-- TABLA 2: ingredient_relationships
CREATE TABLE IF NOT EXISTS public.ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient1_id VARCHAR(100) NOT NULL,
    ingredient2_id VARCHAR(100) NOT NULL,
    tipo_relacion VARCHAR(20) NOT NULL CHECK (tipo_relacion IN ('sinergia', 'antagonismo')),
    nivel VARCHAR(10) NOT NULL CHECK (nivel IN ('alto', 'medio', 'bajo')),
    tipo VARCHAR(20) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ingredient1_id, ingredient2_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_ing1 ON public.ingredient_relationships(ingredient1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_ing2 ON public.ingredient_relationships(ingredient2_id);

-- TABLA 3: product_synergies
CREATE TABLE IF NOT EXISTS public.product_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto1_sku VARCHAR(100) NOT NULL,
    producto2_sku VARCHAR(100) NOT NULL,
    nivel_sinergia VARCHAR(10) CHECK (nivel_sinergia IN ('alto', 'medio', 'bajo')),
    tipo_relacion VARCHAR(20),
    descripcion TEXT,
    beneficios_combinados TEXT[],
    explicacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto1_sku, producto2_sku)
);

CREATE INDEX IF NOT EXISTS idx_product_synergies_p1 ON public.product_synergies(producto1_sku);
CREATE INDEX IF NOT EXISTS idx_product_synergies_p2 ON public.product_synergies(producto2_sku);

-- TABLA 4: product_ingredient_analysis
CREATE TABLE IF NOT EXISTS public.product_ingredient_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_sku VARCHAR(100) UNIQUE NOT NULL,
    ingredientes_encontrados TEXT[],
    ingredientes_sin_match TEXT[],
    cobertura_kb INTEGER DEFAULT 0,
    categoria_predominante VARCHAR(50),
    analisis_explicacion TEXT,
    nivel_analisis_completo INTEGER DEFAULT 0,
    requiere_ia_externa BOOLEAN DEFAULT FALSE,
    fecha_analisis TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_producto ON public.product_ingredient_analysis(producto_sku);

-- ACTIVAR RLS
ALTER TABLE public.ingredient_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredient_analysis ENABLE ROW LEVEL SECURITY;

-- POLITICAS PUBLICAS
CREATE POLICY "Public read ingredient_knowledge" ON public.ingredient_knowledge FOR SELECT USING (true);
CREATE POLICY "Public read ingredient_relationships" ON public.ingredient_relationships FOR SELECT USING (true);
CREATE POLICY "Public read product_synergies" ON public.product_synergies FOR SELECT USING (true);
CREATE POLICY "Public read product_ingredient_analysis" ON public.product_ingredient_analysis FOR SELECT USING (true);

-- INSERTAR DATOS DE PRUEBA
INSERT INTO public.ingredient_knowledge (ingredient_id, nombre, categoria, descripcion, mecanismo_accion, beneficios, dosis_recomendada)
VALUES 
    ('vitamina_c', 'Vitamina C', 'vitaminas', 'Antioxidante esencial', 'Actua como antioxidante', ARRAY['Refuerza el sistema inmune', 'Protege contra dano oxidativo'], '75-90mg/dia'),
    ('zinc', 'Zinc', 'minerales', 'Mineral esencial', 'Cofactor de metaloenzimas', ARRAY['Fortalecimiento inmune', 'Cicatrizacion'], '8-11mg/dia'),
    ('magnesio', 'Magnesio', 'minerales', 'Mineral esencial', 'Cofactor de ATP', ARRAY['Relajacion muscular', 'Funcion nerviosa'], '310-420mg/dia'),
    ('vitamina_d3', 'Vitamina D3', 'vitaminas', 'Vitamina liposoluble', 'Regula absorcion de calcio', ARRAY['Fortalecimiento oseo', 'Soporte inmune'], '600-2000 UI/dia'),
    ('omega_3', 'Omega-3', 'acidos_grasos', 'Acidos grasos esenciales', 'Estructura neuronal', ARRAY['Salud cardiovascular', 'Funcion cerebral'], '1000-3000mg/dia')
ON CONFLICT (ingredient_id) DO NOTHING;

-- RELACIONES
INSERT INTO public.ingredient_relationships (ingredient1_id, ingredient2_id, tipo_relacion, nivel, tipo, descripcion)
VALUES
    ('vitamina_c', 'zinc', 'sinergia', 'alto', 'complementario', 'Sinergia en funcion inmunologica'),
    ('vitamina_d3', 'magnesio', 'sinergia', 'alto', 'cofactor', 'Cofactor en activacion de vitamina D'),
    ('omega_3', 'vitamina_d3', 'sinergia', 'alto', 'complementario', 'Absorcion y utilizacion'),
    ('zinc', 'magnesio', 'sinergia', 'medio', 'complementario', 'Absorcion intestinal competitiva')
ON CONFLICT (ingredient1_id, ingredient2_id) DO NOTHING;
```

5. **Ejecuta el SQL:**
   - Haz clic en el botón **RUN** (o presiona Ctrl+Enter)

6. **Verifica que se crearon las tablas:**
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver las 4 tablas nuevas

---

## Opción 2: Usando Supabase CLI

```bash
# Instalar Supabase CLI (si no la tienes)
npm install -g supabase

# Login
supabase login

# Vincular proyecto
supabase link --project-ref pspxqzwxulgmzarlqwtt

# Ejecutar SQL
supabase db execute -f scripts/supabase_synergies_schema.sql
```

---

## Opción 3: API de Management (Avanzado)

Si tienes un token de acceso personal:

```bash
curl -X POST "https://api.supabase.com/v1/projects/pspxqzwxulgmzarlqwtt/database/query" \
  -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE..."}'
```

---

## Verificación

Después de crear las tablas, puedes verificar en el Dashboard:

1. Ve a **Table Editor**
2. Busca las tablas:
   - `ingredient_knowledge`
   - `ingredient_relationships`
   - `product_synergies`
   - `product_ingredient_analysis`

---

## ¿Problemas?

Si hay errores:
1. Verifica que el SQL no tenga errores de sintaxis
2. Asegúrate de tener permisos de admin
3. Consulta la documentación: https://supabase.com/docs/guides/database/overview
