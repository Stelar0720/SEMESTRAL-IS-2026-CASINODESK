# CasinoDesk - UI/UX Prototype Specification

## 1. Concept & Vision

**CasinoDesk** es un sistema de control y compliance AML/CFT para casinos de alto valor. El prototipo visual debe transmitir **confianza institucional**, **velocidad operativa** y **precisión regulatoria**. La estética combina un diseño **premium con toques de lujo nocturno** — evocando la atmósfera de un casino exclusivo mientras mantiene la claridad funcional requerida para entornos de alta presión.

El usuario debe sentir que está operando en un **centro de comando de nivel ejecutivo**, no en una aplicación genérica.

---

## 2. Design Language

### Aesthetic Direction
**"Luxury Command Center"** —Interfaces oscuras con acentos dorados y verdes de status. Inspirado en dashboards de trading institucional y software de casinos premium. Elegante pero funcional.

### Color Palette

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| **Primary Dark** | Charcoal Black | `#1A1A1F` | Fondos principales |
| **Secondary Dark** | Deep Slate | `#252530` | Cards, paneles |
| **Surface** | Warm Grey | `#2D2D38` | Elementos elevados |
| **Accent Gold** | Casino Gold | `#D4AF37` | Highlights, branding |
| **Text Primary** | Off-White | `#F5F5F0` | Texto principal |
| **Text Secondary** | Warm Grey | `#9A9AA5` | Texto secundario |
| **Status Green** | Emerald | `#10B981` | Verde - Autorizado |
| **Status Yellow** | Amber Warning | `#F59E0B` | Amarillo - Atención |
| **Status Red** | Ruby Alert | `#EF4444` | Rojo - Bloqueado |
| **Border** | Subtle Grey | `#3A3A45` | Bordes sutiles |

### Typography

- **Headings**: Inter (700) — Sans-serif moderno, alta legibilidad
- **Body**: Inter (400, 500) — Claridad en datos numéricos
- **Monospace**: JetBrains Mono — IDs, hashes, montos
- **Scale**: 12px base, 1.25 ratio (12, 15, 19, 24, 30, 37)

### Spatial System

- **Base unit**: 4px
- **Spacing**: 4, 8, 12, 16, 24, 32, 48, 64
- **Border radius**: 4px (inputs), 8px (cards), 12px (modals)
- **Shadows**: Minimal, solo en elementos elevados

### Motion Philosophy

- **Transiciones suaves**: 200ms ease-out para estados hover
- **Feedback inmediato**: Transformaciones sutiles en botones
- **Alertas pulsantes**: Status indicators con animación suave
- **Sin animaciones excesivas**: Prioridad a velocidad perceived

### Visual Assets

- **Icons**: Lucide Icons (línea fina, consistente)
- **Indicadores de status**: Círculos con glow sutil
- **Decorativos**: Líneas doradas sutiles, gradientes mínimos

---

## 3. Layout & Structure

### Arquitectura de Páginas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (fixed)                                                                │
│ Logo | Selector Caja | Usuario | Hora | Accesos Rápidos              │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │                                                                      │
│ SIDEBAR  │  MAIN CONTENT AREA                                          │
│ (fixed)  │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│ Nav      │  │  Stats Bar (resumen turno)                               │  │
│ Options  │  └──────────────────────────────────────────────────────────┘  │
│          │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────┐  │
│          │  │                                                          │  │
│          │  │  Content Panel (transacciones / dashboard / alertas)    │  │
│          │  │                                                          │  │
│          │  │                                                          │  │
│          │  └──────────────────────────────────────────────────────────┘  │
│          │                                                                      │
└──────────┴──────────────────────────────────────────────────────────────┘
```

### Responsive Strategy

- **Desktop first**: Optimizado para pantallas de operador (1920x1080+)
- **Tablet**: Adaptable para iPads en mesa de juego
- **Mobile**: Vista restringida, solo alertas críticas

---

## 4. Features & Interactions

### 4.1 Vista Operador (Cajero)

#### Pantalla Principal - Inicio Turno
- **Stats turno**: Monto total operado, transacciones, buy-in/cash-out count
- **Semáforo global**: Estado del sistema AML
- **Acciones rápidas**: Botones F1 (Buy-in), F2 (Cash-out)
- **Historial reciente**: Últimas 5 transacciones del turno

#### Flujo Buy-in
1. Click "Buy-in" → Modal con formulario
2. Ingresar monto → Selector instrumento de pago
3. Si >= $2,000 → Solicitar identificación (manual o QR simulado)
4. Verificación de screening → Resultado semáforo
5. Confirmar → Generar expediente → Imprimir comprobante

#### Flujo Cash-out
1. Click "Cash-out" → Escanear tickets
2. Validar autenticidad → Mostrar resumen
3. Aplicar comisión si aplica
4. Verificación KYC si >= $2,000
5. Confirmar entrega → Imprimir comprobante

### 4.2 Vista Oficial de Compliance

#### Dashboard Principal
- **Alertas abiertas**: Contador con severidad
- **RTE pendientes**: Bandeja de revisión
- **ROS mes**: Reportes sospechosos generados
- **Heatmap turno**: Actividad por hora
- **Salud sistema**: Estado APIs (simulado)

#### Gestión de Alertas
- **Lista filtrable**: Todas / Críticas / PEP / Fraccionamiento
- **Detalle expandable**: Cronología, datos cliente, acciones
- **Acciones**: Marcar revisado, generar ROS, descartar

#### Reportes
- **RTE**: Lista con filtros, exportar a PDF
- **ROS**: Formulario de creación, envío a UAF (simulado)

### 4.3 Estados y Edge Cases

| Estado | Visual | Acción |
|--------|--------|--------|
| **Loading** | Skeleton con shimmer | Spinner en botones |
| **Empty** | Ilustración + mensaje | Call to action claro |
| **Error** | Banner rojo顶部 | Retry button visible |
| **Timeout API** | Modal de advertencia | Fallback a datos cache |
| **Offline** | Banner naranja | Indicador de sync |

---

## 5. Component Inventory

### 5.1 Navigation Components

#### Sidebar
- **Default**: Fondo `#252530`, ancho 240px
- **Hover item**: Fondo `#3A3A45`, borde izquierdo dorado
- **Active item**: Fondo `#2D2D38`, icono dorado
- **Collapsed**: Iconos únicamente, tooltip en hover

#### Header Bar
- **Fixed top**: Logo izquierda, acciones derecha
- **Selector caja**: Dropdown con cajas activas
- **Usuario**: Avatar + nombre + rol
- **Reloj**: Formato HH:MM, actualización en tiempo real

### 5.2 Data Display Components

#### Stats Card
```
┌─────────────────────────────┐
│  Icon  │  Label            │
│        │  Value (grande)   │
│        │  Subtext          │
└─────────────────────────────┘
```
- **Default**: Fondo `#252530`, borde sutil
- **Hover**: Elevación sutil, borde dorado
- **Alert variant**: Borde color de status

#### Transaction Row
```
┌───────────────────────────────────────────────────────────────┐
│ Hora  │ Tipo │ Cliente      │ Monto     │ Status │ Acciones  │
└───────────────────────────────────────────────────────────────┘
```
- **Default**: Fondo transparente
- **Hover**: Fondo `#2D2D38`
- **Selected**: Borde izquierdo dorado

#### Semáforo Indicator
```
● VERDE   — Autorizado, sin alertas
● AMARILLO — Requiere evaluación
● ROJO    — Bloqueado
```
- **Visual**: Círculo con glow del color correspondiente
- **Animación**: Pulso sutil en ROJO

### 5.3 Form Components

#### Input Field
- **Default**: Fondo `#1A1A1F`, borde `#3A3A45`
- **Focus**: Borde dorado, glow sutil
- **Error**: Borde rojo, mensaje debajo
- **Disabled**: Opacidad 50%

#### Button Primary
```
background: #D4AF37
color: #1A1A1F
font-weight: 600
```
- **Hover**: Brillo aumentado
- **Active**: Scale 0.98
- **Disabled**: Opacidad 50%, cursor not-allowed
- **Loading**: Spinner interno

#### Button Secondary
```
background: transparent
border: 1px solid #D4AF37
color: #D4AF37
```
- **Hover**: Fondo rgba(#D4AF37, 0.1)

### 5.4 Feedback Components

#### Toast Notification
- **Success**: Borde verde, icono check
- **Warning**: Borde amarillo, icono warning
- **Error**: Borde rojo, icono X
- **Position**: Top-right, stack vertical

#### Modal
- **Overlay**: rgba(#000, 0.8)
- **Container**: Fondo `#252530`, max-width 600px
- **Animation**: Fade + scale desde centro

---

## 6. Technical Approach

### Stack
- **HTML5 + CSS3 + Vanilla JS** — Prototipo standalone
- **CSS Variables** — Sistema de diseño consistente
- **No frameworks** — Para validación rápida de concepto

### File Structure
```
casino-desk-prototype/
├── index.html           # Main entry
├── css/
│   └── styles.css       # All styles
├── js/
│   └── app.js           # Interactions
├── pages/
│   ├── operador.html    # Vista cajero
│   ├── oficial.html     # Vista oficial
│   └── login.html       # Login
└── spec.md
```

### Interactivity
- **Simulated data**: JSON embebido para demo
- **State management**: Vanilla JS con event delegation
- **Navigation**: Hash-based routing simple

---

## 7. Screen Breakdown

### 7.1 Login Page
- Formulario centrado con logo
- Campos: Usuario, Contraseña
- Botón "Iniciar Sesión"
- Link "Olvidé mi contraseña" (decorativo)

### 7.2 Operador Dashboard
- Stats turno en top
- Acciones rápidas (Buy-in, Cash-out)
- Cola de clientes
- Historial transacciones
- Panel lateral: Acumulador, Semáforo

### 7.3 Buy-in Modal
- Paso 1: Monto + Instrumento
- Paso 2: Identificación (si KYC)
- Paso 3: Verificación + Confirmación
- Comprobante imprimible

### 7.4 Oficial Dashboard
- Grid de stats (alertas, RTE, ROS)
- Lista de alertas recientes
- Acciones rápidas
- Heatmap de actividad

### 7.5 Alerta Detail Modal
- Datos cliente (hash, no PII real)
- Cronología de transacciones
- Acciones: Evaluar, ROS, Descartar

---

## 8. Accessibility & UX Constraints

### Visibilidad en Baja Iluminación
- **Alto contraste**: Texto claro sobre fondo oscuro
- **Indicadores grandes**: Semáforo mínimo 48px
- **Colores diferenciados**: Verde/Amarillo/Rojo claramente distinguibles

### Velocidad de Operación
- **Atajos de teclado**: F1, F2 para acciones rápidas
- **Flujo minimalista**: Máximo 3 clicks para transacción
- **Feedback inmediato**: Resultado visible en <1s

### Privacidad
- **Sin PII visible**: Solo hashes parciales
- **Datos sensibles ocultos**: Solo últimos 4 caracteres visibles