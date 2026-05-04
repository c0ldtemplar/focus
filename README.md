# Focus AI Studio - Local Event Discovery

## Descripción
Focus es una aplicación de descubrimiento de eventos locales que utiliza IA para encontrar eventos relevantes basados en tus intereses y ubicación. La aplicación filtra el ruido y te ayuda a encontrar experiencias auténticas en tu área.

## Características Principales
- 🎯 **Filtrado por intereses**: Selecciona múltiples categorías de interés
- 📍 **Geolocalización**: Eventos dentro de un radio configurable (1-10km)
- 🗺️ **Mapa interactivo**: Visualización de eventos en mapa Leaflet
- 🎨 **Diseño responsive**: Interfaz bento-grid optimizada para todos los dispositivos
- ⚡ **Caché inteligente**: Resultados cacheados por 5 minutos
- ♿ **Accesibilidad**: Soporte completo para navegación por teclado y lectores de pantalla
- 🔄 **Retry automático**: Reintentos con backoff exponencial
- 💾 **Persistencia**: Preferencias guardadas en localStorage

## Instalación Local

### Prerrequisitos
- Node.js 20+
- npm o yarn
- [Opcional] API Key de SeatGeek para eventos reales (gratis)
- [Opcional] Gemini API Key como fallback

### Pasos

1. Clonar el repositorio:
```bash
git clone https://github.com/c0ldtemplar/focus.git
cd focus
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

4. Iniciar la aplicación:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### Configuración de Intereses
1. Selecciona tus intereses haciendo clic en las tarjetas
2. Los filtros se guardan automáticamente en localStorage
3. Puedes ajustar el radio de búsqueda (1-10km)

### Visualización de Eventos
- **Evento principal**: Tarjeta hero con el evento más relevante
- **Eventos secundarios**: Grid de 2 columnas con eventos adicionales
- **Mapa**: Ubicación de todos los eventos en el área seleccionada

### APIs de Eventos (Configuración)

Focus ahora soporta múltiples fuentes de eventos:

#### 1. SeatGeek API (Recomendado - Gratis)
Fuente principal con eventos reales: conciertos, deportes, teatro.

1. Regístrate gratis: https://platform.seatgeek.com/
2. Crea una app y obtén tu `client_id`
3. Agrega a `.env`:
   ```env
   SEATGEEK_CLIENT_ID=tu_client_id_aqui
   ```
4. La app buscará automáticamente eventos en tu radio configurado

**Nota:** Sin `SEATGEEK_CLIENT_ID`, la app usa solo fallback de Gemini IA.

#### 2. Gemini AI (Fallback - Opcional)
Genera sugerencias inteligentes locales cuando las APIs no tienen datos.

```env
GEMINI_API_KEY=tu_clave_gemini  # https://ai.google.dev/
```

### Sin API Keys Configuradas
La aplicación funciona en **modo demo**:
- Autenticación con usuarios de prueba (`test@focus.local` / `test123`)
- Eventos generados por IA (Gemini) solo si `GEMINI_API_KEY` está configurada
- Si no hay `SEATGEEK_CLIENT_ID`, se usan datos de ejemplo hasta que configures la API

Para eventos reales de SeatGeek, configura `SEATGEEK_CLIENT_ID` en `.env`.

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ErrorBoundary.tsx
│   ├── InterestPicker.tsx
│   ├── MapOverlay.tsx
│   └── Auth/           # Componentes de autenticación
├── contexts/           # Contextos (AuthContext)
├── pages/              # Páginas con routing
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── services/           # Servicios y APIs
│   ├── eventService.ts      # Agregador principal (SeatGeek + Gemini)
│   └── geminiFallback.ts    # Fallback con Gemini IA
├── lib/                # Librerías externas
│   └── firebase.ts
├── types.ts            # Tipos TypeScript
├── constants.ts        # Constantes y configuraciones
├── App.tsx            # Enrutador principal
└── main.tsx           # Punto de entrada
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Verifica tipos TypeScript

## Despliegue en Raspberry Pi

Ver [DEPLOY_RASPBERRY.md](DEPLOY_RASPBERRY.md) para instrucciones detalladas de instalación y configuración en Raspberry Pi (ARM64).

## Tecnologías Utilizadas

- **Frontend**: React 19, Vite, TypeScript, React Router DOM
- **Estilos**: Tailwind CSS
- **Mapas**: Leaflet, React-Leaflet
- **Animaciones**: Motion (Framer Motion)
- **IA**: Google Gemini API (fallback)
- **Eventos APIs**: SeatGeek API (principal), Gemini AI (fallback)
- **Servidor**: Express.js
- **Contenedores**: Docker & Docker Compose
- **Autenticación**: Firebase Auth (opcional) / Modo Demo

## Licencia

MIT License - Ver archivo LICENSE para detalles

## Soporte

Para reportar problemas o solicitar características, por favor abre un issue en el repositorio de GitHub.
