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
- [Opcional] Gemini API Key para eventos reales

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

### Sin API Key de Gemini
La aplicación funciona perfectamente sin la integración de Gemini. Solo necesitas configurar `GEMINI_API_KEY` en `.env.local` para obtener eventos reales.

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ErrorBoundary.tsx
│   ├── EventFeed.tsx
│   ├── InterestPicker.tsx
│   └── MapOverlay.tsx
├── services/           # Servicios y APIs
│   └── geminiService.ts
├── types.ts            # Tipos TypeScript
├── constants.ts        # Constantes y configuraciones
├── App.tsx            # Componente principal
└── main.tsx           # Punto de entrada
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Verifica tipos TypeScript

## Despliegue en Raspberry Pi

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas.

## Tecnologías Utilizadas

- **Frontend**: React 19, Vite, TypeScript
- **Estilos**: Tailwind CSS
- **Mapas**: Leaflet, React-Leaflet
- **Animaciones**: Motion
- **IA**: Google Gemini API
- **Servidor**: Express.js
- **Contenedores**: Docker

## Licencia

MIT License - Ver archivo LICENSE para detalles

## Soporte

Para reportar problemas o solicitar características, por favor abre un issue en el repositorio de GitHub.
