# Devitrak Design System

Guía de referencia de diseño para mantener consistencia visual en la aplicación y proyectos derivados.

---

## 1. Filosofía de Diseño

- **Estilo:** Limpio, profesional, enfocado en enterprise (inspirado en Untitled UI)
- **Enfoque:** Mobile-first, accesible, altamente reutilizable
- **Modo:** Light mode (infraestructura de CSS variables lista para dark mode)
- **Librerías UI:** Ant Design v5 + Material-UI v5 (customizadas con CSS propio)

---

## 2. Paleta de Colores

### Primario — Azul (Acciones / Navegación)

| Token           | Hex         | Uso                          |
|----------------|-------------|------------------------------|
| `blue-dark-600` | `#155EEF`   | Botón primario, CTA          |
| `blue-dark-700` | `#004EEA`   | Hover de botón primario      |
| `blue-dark-800` | `#0040C1`   | Estado activo                |
| `blue-700`      | `#175CD3`   | Fondo de navbar              |
| `blue-dark-100` | `#D1E0FF`   | Fondo suave, botón light     |

### Acento — Púrpura (Marca)

| Token          | Hex       | Uso                        |
|---------------|-----------|----------------------------|
| `primary-600`  | `#7F56D9` | Checkbox checked, brand    |
| `primary-100`  | `#F4EBFF` | Focus ring background      |
| `primary-50`   | `#F9F5FF` | Badge brand background     |

### Neutros — Grises

| Token        | Hex       | Uso                          |
|-------------|-----------|------------------------------|
| `gray-900`   | `#101828` | Texto principal              |
| `gray-700`   | `#344054` | Texto secundario             |
| `gray-600`   | `#475467` | Texto terciario, tabla body  |
| `gray-500`   | `#667085` | Placeholder, hints           |
| `gray-300`   | `#D0D5DD` | Bordes de inputs y botones   |
| `gray-200`   | `#EAECF0` | Bordes de cards y tablas     |
| `gray-100`   | `#F2F4F7` | Fondos suaves                |
| `gray-50`    | `#F9FAFB` | Fondo general de la app      |

### Semánticos

| Estado    | Color principal | Fondo claro | Uso                   |
|-----------|----------------|-------------|------------------------|
| Éxito     | `#027A48`       | `#ECFDF3`   | Confirmaciones, badges |
| Error     | `#B42318`       | `#FEF3F2`   | Errores, botón danger  |
| Advertencia | `#DC6803`     | `#FFFAEB`   | Alertas                |

### Base

| Token        | Valor     |
|-------------|-----------|
| Blanco       | `#FFFFFF` |
| Fondo app    | `#F9FAFB` |
| Fondo navbar | `#175CD3` |

---

## 3. Tipografía

**Fuente:** Inter (Google Fonts)  
**Fallback:** Open Sans, sans-serif

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
```

### Escala Tipográfica

| Nombre          | Tamaño | Altura | Peso | Uso                        |
|----------------|--------|--------|------|----------------------------|
| Title          | 36px   | 44px   | 600  | Encabezados de página      |
| Large Heading  | 30px   | 38px   | 600  | Secciones principales      |
| Medium Heading | 20px   | 30px   | 400  | Subtítulos de sección      |
| Subtitle       | 18px   | 28px   | 600  | Títulos de card/modal      |
| Body Large     | 16px   | 24px   | 600  | Etiquetas de formulario    |
| Body           | 14px   | 20px   | 400  | Texto general              |
| Body Semibold  | 14px   | 20px   | 600  | Texto enfatizado           |
| Caption        | 12px   | 18px   | 500  | Hints, metadata, headers de tabla |

### Pesos disponibles
`100` `400` `500` `600` `900`

### Letter Spacing
- Títulos grandes: `-0.72px`
- Resto: `0px`

---

## 4. Espaciado

Base de `4px`. Todos los espaciados son múltiplos de 4 u 8.

| Token | px  | rem    | Uso típico                |
|-------|-----|--------|---------------------------|
| 2xs   | 2px | —      | Badges (padding interno)  |
| xs    | 4px | 0.25rem | Gaps mínimos             |
| sm    | 8px | 0.5rem  | Padding interno componentes |
| md    | 12px | 0.75rem | Gaps entre elementos     |
| lg    | 16px | 1rem    | Padding de sección       |
| xl    | 24px | 1.5rem  | Padding de contenedor    |
| 2xl   | 32px | 2rem    | Separación entre bloques |
| 3xl   | 48px | 3rem    | Secciones grandes        |

**Valores de padding más comunes:** `8px 12px`, `10px 14px`, `12px 16px`, `16px 24px`

---

## 5. Border Radius

| Nombre   | Valor   | Componentes                    |
|---------|---------|--------------------------------|
| sm      | 4px     | Checkboxes, elementos pequeños |
| md      | 6–8px   | Botones, inputs, nav items     |
| lg      | 12px    | Cards, tablas, modales         |
| full    | 9999px  | Badges, pills, avatares        |

---

## 6. Sombras

| Nombre | CSS                                                                                      |
|--------|------------------------------------------------------------------------------------------|
| xs     | `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`                                                |
| sm     | `1px 1px 2px rgba(16, 24, 40, 0.05)`                                                    |
| md     | `0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)`       |
| lg     | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`                    |

**Uso:**
- Botones → `xs`
- Inputs → `sm`
- Cards, tablas, modales → `md`
- Banners, dropdowns → `lg`

---

## 7. Componentes

### Botones

Cuatro variantes. Todos comparten: `border-radius: 6px`, `font: Inter 600 14px`, `transition: all 0.3s ease`.

| Variante    | Fondo     | Borde       | Texto     | Hover              |
|------------|-----------|-------------|-----------|---------------------|
| Primary    | `#155EEF` | `#155EEF`   | `#FFFFFF` | `brightness(0.9)`  |
| Secondary  | `#FFFFFF` | `#D0D5DD`   | `#344054` | fondo gris claro   |
| Danger     | `#B42318` | `#B42318`   | `#FFFFFF` | `brightness(0.9)`  |
| Light Blue | `#D1E0FF` | `#EFF4FF`   | `#175CD3` | `#C0D6FF`          |

**Tamaños:**

| Size | Height | Padding    |
|------|--------|------------|
| sm   | 32px   | 8px 12px   |
| md   | 40px   | 10px 14px  |
| lg   | 44px   | 10px 16px  |
| xl   | 48px   | 12px 18px  |

**Props API:**
- `size`: `"sm" | "md" | "lg" | "xl"`
- `iconLeading` / `iconTrailing`: nodo React
- `isDisabled`: boolean
- `isLoading`: boolean
- `href`: string
- `func`: onClick handler
- Gap icono–texto: `8px`

---

### Cards

```
border: 1px solid #EAECF0
border-radius: 12px
background: #FFFFFF
box-shadow: md
```

---

### Inputs

```
border: 1px solid #D0D5DD
border-radius: 8px
height: 40px
padding: 12px
box-shadow: sm
font: Inter 14px
background: #FFFFFF
```

Estado focus: sin outline adicional. Estado deshabilitado: `#7AA5FA`.

---

### Badges / Pills

Border radius: `9999px`. Font weight: `500`.

| Color scheme | Fondo     | Texto     | Dot       | Borde     |
|-------------|-----------|-----------|-----------|-----------|
| Brand       | `#F9F5FF` | `#6941C6` | `#7F56D9` | `#E9D7FE` |
| Gray        | `#F2F4F7` | `#344054` | `#667085` | `#D0D5DD` |
| Error       | `#FEF3F2` | `#B42318` | `#F04438` | `#FECDCA` |
| Warning     | `#FFFAEB` | `#B54708` | `#F79009` | `#FEDF89` |
| Success     | `#ECFDF3` | `#027A48` | `#12B76A` | `#ABEFC6` |
| Blue        | `#EFF8FF` | `#175CD3` | `#2E90FA` | `#B2DDFF` |
| Purple      | `#F4F3FF` | `#5925DC` | `#7A5AF8` | `#D9D6FE` |
| Pink        | `#FDF2FA` | `#C11574` | `#EE46BC` | `#FCCEEE` |
| Orange      | `#FFF6ED` | `#C4320A` | `#EF6820` | `#F9DBAF` |

**Tamaños:** `sm` → `2px 8px`, 12px font | `md` → `2px 10px`, 14px font

---

### Tabla (Ant Design customizada)

```
border: 1px solid #EAECF0
border-radius: 12px
background: #FFFFFF
box-shadow: md
font-family: Inter
```

| Zona    | Fondo     | Padding    | Font | Peso | Color     |
|---------|-----------|------------|------|------|-----------|
| Header  | `#F9FAFB` | `12px 24px`| 12px | 500  | `#475467` |
| Body    | `#FFFFFF` | `16px 24px`| 14px | 400  | `#475467` |
| Odd row | `#F9FAFB` | —          | —    | —    | —         |

Paginación activa: fondo `#D1E0FF`, borde `#84ADFF`, texto `#101828`.

---

### Checkbox

```
border: 1px solid #D0D5DD
border-radius: 4px
background: #FFFFFF
transition: 0.15s ease-in-out
```

Checked: fondo `#7F56D9`, borde `#7F56D9`.  
Focus ring: `0 0 0 4px #F4EBFF`.  
Label: `font-weight: 500`, color `#344054`.

---

### Modal (Ant Design)

```
centered: true
mask-closable: false
destroy-on-hidden: true
default-width: 1000px
```

---

### Navbar

```
background: #175CD3
height: 72px
font: Inter 600
text-color: #FFFFFF
```

Nav items: `padding: 8px 12px`, `border-radius: 6px`, hover fondo `#0040C1`.  
Avatar: `width/height: 40px`, `border-radius: 200px`.

---

### Banner

```
background: #F0F9FF
border-radius: 12px
padding: 1rem
gap: 12px
box-shadow: lg
```

Título: `16px 600 #0C4A6E`. Descripción: `14px #475569`.

---

## 8. Layout

### Estructura de página

```
┌─────────────────────────────────────┐
│ Upper Banner (opcional)             │
├─────────────────────────────────────┤
│ Navbar (72px, fijo)                 │
├─────────────────────────────────────┤
│ Content Area                        │
│   min-height: calc(100dvh - 80px)  │
│   padding: 0 20px (mobile)         │
│   margin: 1rem 0                   │
└─────────────────────────────────────┘
```

### Grid (MUI 12 columnas)

| Breakpoint | Rango       | Comportamiento             |
|-----------|-------------|----------------------------|
| xs        | 0–599px     | 1 columna, padding reducido |
| sm        | 600–899px   | 2–3 columnas               |
| md        | 900–1199px  | 3–4 columnas               |
| lg        | 1200px+     | Ancho completo, sidebars   |

---

## 9. Animaciones y Transiciones

| Uso                   | Valor                  |
|----------------------|------------------------|
| Botones, hover       | `all 0.3s ease`        |
| Checkboxes           | `0.15s ease-in-out`    |
| Scroll               | `scroll-behavior: smooth` |
| Loading states       | Lottie animations      |

Focus outline botones: `outline: 4px auto -webkit-focus-ring-color`.

---

## 10. Scrollbar

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #FAFAFA; }
scrollbar-gutter: stable; /* evita layout shift */
```

Firefox: `scrollbar-width: thin`.

---

## 11. Variables CSS (tokens globales)

Definidas en `src/index.css`. Usar siempre las variables sobre valores hardcoded:

```css
/* Colores */
--gray-900: #101828;
--gray-700: #344054;
--gray-600: #475467;
--gray-500: #667085;
--gray-300: #D0D5DD;
--gray-200: #EAECF0;
--gray-100: #F2F4F7;
--gray-50:  #F9FAFB;

--blue-dark-600: #155EEF;
--blue-dark-700: #004EEA;
--blue-700:      #175CD3;
--blue-dark-100: #D1E0FF;

--primary-600: #7F56D9;
--primary-100: #F4EBFF;

--success-700: #027A48;
--error:       #B42318;

--main-background-color: #F9FAFB;
--gray-background:       #FAFAFA;
```

---

## 12. Librerías y Dependencias de UI

| Librería              | Versión  | Uso                                  |
|----------------------|----------|--------------------------------------|
| antd                 | 5.16.2   | Table, Modal, Select, Drawer, Card   |
| @mui/material        | 5.13.1   | Grid, Typography, OutlinedInput      |
| lucide-react         | 1.20.0   | Íconos                               |
| react-hook-form      | 7.44.3   | Manejo de formularios                |
| lottie-web           | 5.10.2   | Animaciones de carga                 |
| echarts / recharts   | 5.5 / 2.1 | Gráficas                           |
| react-datepicker     | 7.5.0    | Selector de fechas                   |
| @stripe/react-stripe-js | 3.3.18 | Pagos                             |

---

## 13. Reglas de Consistencia

1. **No hardcodear colores.** Usar siempre las CSS variables o los tokens documentados arriba.
2. **Border radius en cards y tablas siempre 12px.**
3. **Botones siempre con shadow `xs` y `transition: all 0.3s ease`.**
4. **Fuente siempre Inter.** Nunca cambiar a otra sin actualizar este documento.
5. **Spacing múltiplo de 4px.** No usar valores arbitrarios como 7px, 11px, 15px.
6. **Íconos con Lucide React** salvo que el componente de Ant Design incluya los suyos propios.
7. **Formularios con react-hook-form.** No mezclar con estado local de React para validación.
8. **Tablas con Ant Design** customizadas con la clase `table-ant-customized`.
9. **Modales con Ant Design** con `centered`, `maskClosable: false`, `destroyOnHidden: true`.
10. **Nuevos colores de estado** deben seguir el patrón de badges: fondo claro + texto oscuro + dot + borde del mismo tono.
