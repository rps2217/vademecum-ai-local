---
# Protocolo de Diseño y UI/UX (shadcn/ui & Clean UI)


## 1. Reglas de Estructura de Componentes
- Utilizar exclusivamente Tailwind CSS y componentes de `shadcn/ui` (basados en Radix UI).
- Evitar librerías CSS externas o estilos inline (`style={{...}}`). Usa la función/utilidad `cn()` para fusionar clases de Tailwind.
- Mantener los componentes pequeños y de responsabilidad única. Si un componente supera las 150 líneas, extrae subcomponentes en archivos independientes.


## 2. Consistencia y Layout (Clean UI)
- Usar estrictamente la escala de espaciado estándar de Tailwind (`gap-2`, `gap-4`, `p-4`, `p-6`, etc.). Quedan prohibidos los valores arbitrarios en px (ej: `p-[13px]`, `w-[321px]`).
- Aplicar la filosofía Mobile-First en los layouts (ej: `flex-col md:flex-row`).
- Reducción de ruido visual: No usar bordes marcados si el contraste de fondo (`bg-muted`, `bg-card`) ya delimita la sección. Evitar sombras excesivas.
- Máximo 1 botón primario (`variant="default"`) por vista principal para mantener una jerarquía clara. El resto deben ser `variant="outline"`, `variant="ghost"` o `variant="secondary"`.


## 3. Accesibilidad y Micro-interacciones
- Todo elemento interactivo debe incluir estados claros para `:hover`, `:focus-visible` y `:active`.
- Los íconos aislados (Lucide Icons) DEBEN incluir un atributo `aria-label` o una etiqueta accesible con `sr-only` para lectores de pantalla.
- Toda acción asíncrona debe reflejar un estado de carga (`loading` / `disabled`) de forma inmediata.
---
