# Vademecum AI - Supabase Setup

## Descripción

Esta carpeta contiene los archivos necesarios para configurar la sincronización de la base de conocimiento con **Supabase** (PostgreSQL).

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `schema.sql` | Schema completo de PostgreSQL con tablas, índices, funciones y datos iniciales |

## Setup Rápido

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la contraseña del database (la necesitarás)
4. Espera a que el proyecto esté listo (~2 minutos)

### 2. Ejecutar el Schema

Hay dos formas de ejecutar el schema:

#### Opción A: SQL Editor (Recomendado para desarrollo)

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega el contenido de `schema.sql`
4. Ejecuta la consulta (botón **Run**)

#### Opción B: psql (Línea de comandos)

```bash
# Instalar psql si no lo tienes
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql-client

# Conectar
psql -h db.[tu-proyecto].supabase.co -p 5432 -U postgres -d postgres

# Ejecutar el schema
\i supabase/schema.sql
```

### 3. Configurar Variables de Entorno

Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

Puedes encontrar estas claves en:
- **Settings** → **API** → **Project API keys**

### 4. Sincronizar Datos

Una vez configurado, puedes sincronizar los datos desde el panel de administración de Vademecum AI o ejecutando:

```typescript
import { supabaseKBService } from './services/SupabaseKBService';

// Sincronizar todo (subir local + descargar remoto)
const result = await supabaseKBService.syncAll();

console.log(result.uploaded, 'elementos subidos');
console.log(result.downloaded, 'elementos descargados');
```

## Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `ingredients` | Ingredientes terapéuticos (plantas, remedios, etc.) |
| `categories` | Categorías de ingredientes |
| `body_systems` | Sistemas corporales (nervioso, digestivo, etc.) |
| `indications` | Indicaciones terapéuticas |
| `sinergias` | Relaciones sinérgicas entre ingredientes |
| `antagonisms` | Relaciones antagónicas |
| `products` | Productos comerciales |
| `product_ingredients` | Relación productos-ingredientes |
| `audit_log` | Historial de cambios |

### Relaciones

```
categories ───1:N─── ingredients ───N:M─── body_systems
                │
                └───N:M─── indications
                
ingredients ───1:N─── sinergias ───N:1─── ingredients
       │
       └───1:N─── antagonisms ───N:1─── ingredients
```

## API REST

Supabase genera automáticamente una API REST. Ejemplos:

```bash
# Obtener todos los ingredientes
curl -X GET "https://[tu-proyecto].supabase.co/rest/v1/ingredients?select=*" \
  -H "apikey: [tu-clave]" \
  -H "Authorization: Bearer [tu-token]"

# Buscar ingredientes por categoría
curl -X GET "https://[tu-proyecto].supabase.co/rest/v1/ingredients?category=eq.fitoterapia" \
  -H "apikey: [tu-clave]" \
  -H "Authorization: Bearer [tu-token]"

# Obtener sinergias de un ingrediente
curl -X GET "https://[tu-proyecto].supabase.co/rest/v1/sinergias?ingredient_a_id=eq.[uuid]" \
  -H "apikey: [tu-clave]" \
  -H "Authorization: Bearer [tu-token]"
```

## Sincronización

### Modo Local (Por defecto)

- Los datos se cargan desde los archivos JSON locales
- No requiere conexión a internet
- Ideal para uso offline

### Modo Supabase

- Los datos se sincronizan con PostgreSQL
- Permite compartir datos entre dispositivos
- Backup automático en la nube

### Estrategia de Sincronización

```
┌─────────────┐         ┌─────────────┐
│  Local DB   │◄───────►│  Supabase   │
│  (JSON)     │  sync   │  (Postgres) │
└─────────────┘         └─────────────┘
     │                        │
     └── Priority: Local ────┘
```

1. **Upload**: Los datos locales se suben a Supabase
2. **Download**: Los datos remotos se descargan al caché local
3. **Conflictos**: Se resuelven automáticamente (local tiene prioridad)

## Roles y Permisos

Por defecto, se usa **Row Level Security (RLS)**:

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `ingredients` | Pública | Solo autenticados |
| `sinergias` | Pública | Solo autenticados |
| `products` | Pública | Solo autenticados |

Para modificar esto, ve a **Authentication** → **Policies** en el dashboard.

## Backup

Supabase realiza automáticamente:
- Backups diarios del database
- Retención de 7 días
- Punto de recuperación (Point in Time Recovery)

Para backups manuales:
```sql
-- En el SQL Editor
SELECT * FROM pg_dump('[tu-base-de-datos]');
```

## Monitoreo

En el dashboard de Supabase:
- **Database** → **Logs**: Ver consultas lentas
- **Database** → **Replication**: Replicación en tiempo real
- **Project Settings** → **Usage**: Uso de recursos

## Solución de Problemas

### Error: Table not found

Asegúrate de que el schema se ejecutó correctamente:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Error: Permission denied

Verifica que el RLS está configurado correctamente:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Error: Connection refused

Verifica que la URL de Supabase es correcta:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
```

## Próximos Pasos

1. ✅ Ejecutar schema.sql
2. ✅ Configurar variables de entorno
3. ✅ Sincronizar datos iniciales
4. 🔄 (Opcional) Configurar autenticación de usuarios
5. 🔄 (Opcional) Configurar realtime subscriptions
6. 🔄 (Opcional) Añadir edge functions para lógica compleja

## Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vademecum AI GitHub](https://github.com/rps2217/vademecum-ai-local)
