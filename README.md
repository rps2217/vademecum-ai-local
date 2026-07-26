# Vademécum AI - Guía Terapéutica para Farmacias

Aplicación web progresiva (PWA) para consultoras de farmacia que proporciona:

- **Fitoterapia**: Plantas medicinales con indicaciones, posología y contraindicaciones
- **Homeopatía**: Remedios homeopáticos con síntomas clave y modalidades
- **Aromaterapia**: Aceites esenciales con diluciones y propiedades
- **Suplementos**: Micronutrientes y compuestos bioactivos
- **Detección de sinergias** entre productos naturales
- **Búsqueda semántica** con IA local (100% offline)

---

## ✨ Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Local-First** | Base de conocimiento funciona 100% offline |
| **PWA** | Instalable en móvil y escritorio |
| **Búsqueda semántica** | IA local con Transformers.js |
| **Detección de sinergias** | Encuentra combinaciones beneficiosas |
| **Autenticación** | Contraseña compartida para equipos |
| **Métricas** | Estadísticas de uso integradas |

---

## 📚 Base de Conocimiento

### Fitoterapia (Plantas Medicinales)
- 45+ plantas medicinales
- Sistema nervioso: Valeriana, Pasiflora, Melisa, Hipérico, Ginkgo
- Digestivo: Jengibre, Manzanilla, Menta, Cúrcuma, Aloe
- Inmunidad: Equinácea, Propóleo, Ajo, Sauco
- Cardiovascular: Espino Blanco, Hoja de Olivo

### Homeopatía (Remedios)
- 30+ remedios homeopáticos
- Sistema nervioso: Arnica, Nux Vomica, Ignatia, Gelsemium
- Digestivo: Lycopodium, Carbo Veg, Bryonia
- Inmunidad: Belladonna, Ferrum Phos, Mercurius
- Piel: Graphites, Sulphur, Apis Mellifica

### Aromaterapia (Aceites Esenciales)
- 25+ aceites esenciales
- Relajantes: Lavanda, Manzanilla, Vetiver
- Energizantes: Romero, Menta, Eucalipto
- Antiinflamatorios: Gaulteria, Jengibre
- Antisépticos: Tea Tree, Ravintsara

---

## 🚀 Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior

### Desarrollo
```bash
# Clonar repositorio
git clone https://github.com/rps2217/vademecum-ai-local.git
cd vademecum-ai-local

# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
# Abre http://localhost:3000
```

### Producción
```bash
# Build
npm run build

# Previsualizar
npm run preview
```

---

## 🔐 Autenticación

La aplicación usa autenticación simple con contraseña compartida:

1. **Primera vez**: Configura una contraseña para proteger la app
2. **Otros dispositivos**: Usa la misma contraseña para acceder
3. **Seguridad**: La contraseña se guarda localmente (hash SHA-256)

Para cambiar contraseña: **Configuración → Seguridad**

---

## 📱 Instalación como PWA

1. Abre la aplicación en Chrome/Edge/Safari
2. En móvil: "Añadir a pantalla de inicio"
3. En escritorio: Click en el icono de instalación en la barra de direcciones

La app funcionará **sin conexión** una vez instalada.

---

## 🔧 Configuración

### Variables de Entorno
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave
```

### Supabase (Opcional)
Para sincronizar datos entre dispositivos:
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Habilitar Email Auth
3. Ejecutar SQL de migración
4. Configurar URL y Key en Ajustes

---

## 🧪 Tests

```bash
# Ejecutar tests E2E con Playwright
npm run test:e2e

# Tests unitarios (futuro)
npm run test:unit
```

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/           # Login, autenticación
│   ├── layout/          # Dashboard, navegación
│   └── ui/             # Componentes UI
├── core/
│   ├── knowledge-base/ # Fitoterapia, Homeopatía, Aceites
│   └── semantic-search/ # Búsqueda con IA
├── hooks/              # React hooks personalizados
├── services/           # Servicios (Supabase, Metrics, etc)
└── store/             # Estado global (Zustand)
```

---

## 📄 Licencia

MIT License

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit (`git commit -m 'Agregar nueva característica'`)
4. Push (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request
