# Propuesta de Rediseño UX/UI: Vademecum AI "Modern & Simple"

El objetivo de esta propuesta es aumentar la claridad visual, reducir la carga cognitiva y mejorar la velocidad de interacción en el mostrador de farmacia, manteniendo la robustez de la información.

## 1. Principios de Diseño
- **Jerarquía Visual Clara:** Tipografía con contrastes definidos para diferenciar títulos, metadatos y contenido clínico.
- **Densidad de Información Equilibrada:** Uso de *progressive disclosure* (mostrar lo necesario, ocultar lo secundario) para evitar el abrumamiento.
- **Consistencia de Acción:** Elementos interactivos (botones, chips) con un lenguaje visual único y predecible.
- **Espaciado y Claridad:** Aumento de *whitespace* estratégico para separar grupos de información.

## 2. Áreas de Enfoque (Rediseño)

### A. Fichas de Patología y Producto (`PathologyDetail.tsx`)
- **Header:** Resumen clínico compacto (nombre, códigos, sistemas) usando *badges* más estilizados.
- **Layout de Columnas:** Dividir en "Tratamiento / Recomendación" (izquierda) y "Detalle Clínico / Seguridad" (derecha/modal), adaptativo a móvil.
- **Acciones:** Agrupación lógica de botones de acción rápida ("Cómo actúa", "Ver ficha completa").

### B. Sistema de Búsqueda y Filtros (`SearchPage.tsx`)
- **Input de Búsqueda:** Enfocado y prominente, con *autocomplete* visual.
- **Chips de Filtro:** Diseño tipo "píldora" más delgado, con indicadores de estado de selección claros.

### C. Dashboard / Home (`HomePage.tsx`)
- **Tarjetas de Acceso Rápido:** Diseño más limpio, con iconos lineales monocromáticos para reducir ruido visual.

## 3. Ejemplo de Design Tokens (Tailwind v4)
- **Rounded Corners:** `rounded-lg` (8px) para elementos grandes, `rounded-md` (6px) para pequeños.
- **Shadows:** `shadow-sm` muy sutil para tarjetas.
- **Typography:** `font-sans` (Inter o sistema), pesos 400, 600, 700.
- **Colores:** Paleta de neutros (`slate`) para estructurar, con acentos de color específicos por tipo (ej. `emerald` para natural, `sky` para recomendaciones comerciales).

---

¿Te parece bien esta dirección de diseño? Si estás de acuerdo, procederé a implementarla gradualmente en los componentes principales.
