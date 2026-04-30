# Arquitectura de Focus AI Studio

## Visión General

Focus es una aplicación full-stack de descubrimiento de eventos locales que combina un frontend moderno con integración de IA para proporcionar recomendaciones personalizadas basadas en intereses del usuario y ubicación geográfica.

## Arquitectura del Sistema

### 1. Frontend (React + Vite + TypeScript)

#### Componentes Principales

- **App.tsx**: Componente raíz que gestiona el estado global
  - Intereses del usuario
  - Configuración de ubicación
  - Estado de carga
  - Manejo de errores

- **InterestPicker.tsx**: Selector de intereses
  - Botones toggle con estados activos/inactivos
  - Navegación por teclado (Enter/Espacio)
  - ARIA labels para accesibilidad
  - Persistencia en localStorage

- **EventFeed.tsx**: Feed de eventos
  - Estados de carga con skeletons
  - Manejo de listas vacías
  - Animaciones de entrada (Framer Motion)
  - Soporte para eventos prioritarios

- **MapOverlay.tsx**: Visualización en mapa
  - Leaflet para renderizado de mapas
  - Marcadores de eventos
  - Radio de búsqueda visual
  - Accesibilidad mejorada

- **ErrorBoundary.tsx**: Captura de errores
  - Manejo de errores de React
  - Fallback UI amigable
  - Logging de errores

### 2. Servicios y APIs

#### GeminiService

**Responsabilidades:**
- Comunicación con Google Gemini API
- Caché de resultados (5 minutos)
- Deduplicación de peticiones
- Retry con backoff exponencial
- Validación de respuestas
- Manejo de errores graceful

**Características:**
```typescript
- Caché en memoria (Map)
- Request deduplication
- Exponential backoff (3 retries)
- Response validation
- Graceful degradation (funciona sin API key)
```

### 3. Backend (Express.js)

**server.js**
- Servidor estático para producción
- Health check endpoint (`/health`)
- Soporte para SPA routing
- Configuración optimizada para Docker

### 4. Diseño de Datos

#### Tipos Principales

```typescript
interface LocalEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
  };
  distance: number; // km
  source: 'scout' | 'community' | 'official';
  isPriority: boolean;
}

interface Interest {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

interface UserSettings {
  radius: number; // 1-10 km
  location: [number, number];
  locationName: string;
}
```

## Flujo de Datos

### 1. Inicialización
```
Usuario → App.tsx → Carga settings/interests → localStorage
```

### 2. Selección de Intereses
```
Usuario → InterestPicker → App.tsx → localStorage
```

### 3. Obtención de Eventos
```
App.tsx → GeminiService → (Caché?) → Gemini API → Validación → App.tsx
```

### 4. Renderizado
```
App.tsx → EventFeed.tsx + MapOverlay.tsx → UI
```

## Patrones de Diseño

### 1. Error Boundaries
- Captura de errores en componentes
- Fallback UI
- Logging centralizado

### 2. Custom Hooks
- `useCallback` para optimización
- `useEffect` para efectos secundarios
- `useState` para estado local

### 3. Service Layer
- Separación de responsabilidades
- Reutilización de lógica
- Fácil testing

### 4. Caché Pattern
- Reducción de llamadas API
- Mejora de performance
- Experiencia offline mejorada

## Decisiones Arquitectónicas

### 1. React + Vite
- **Por qué**: Performance, DX excelente, ecosistema maduro
- **Alternativas consideradas**: Next.js (descartado por simplicidad)

### 2. Tailwind CSS
- **Por qué**: Utility-first, consistente, fácil mantenimiento
- **Alternativas**: CSS modules, styled-components

### 3. Leaflet para Mapas
- **Por qué**: Ligero, compatible con React, sin dependencias pesadas
- **Alternativas**: Google Maps (descartado por costos/licencias)

### 4. Docker
- **Por qué**: Consistencia, portabilidad, fácil despliegue
- **Beneficio**: Mismo entorno en dev/prod

## Performance Optimizations

### 1. Caché de Resultados
- 5 minutos de TTL
- Key basada en intereses + ubicación

### 2. Request Deduplication
- Evita llamadas duplicadas simultáneas
- Mejora performance y reduce costos API

### 3. Lazy Loading
- Componentes cargados bajo demanda
- Reducción de bundle inicial

### 4. Code Splitting
- Vite automático
- Rutas divididas

## Seguridad

### 1. Environment Variables
- API keys no expuestas en cliente
- Validación de inputs

### 2. Docker Security
- Non-root user
- Memory limits
- Network isolation

### 3. Data Validation
- Validación de respuestas API
- Type checking con TypeScript

## Escalabilidad

### 1. Horizontal
- Stateless por diseño
- Fácil replicación
- Balanceo de carga simple

### 2. Vertical
- Memory limits configurables
- CPU limits si necesario

### 3. Caché
- Redis potencial (futuro)
- Memcached alternativa

## Mantenimiento

### 1. Logging
- Console errors capturados
- Error boundaries
- Health checks

### 2. Monitoring
- Docker health checks
- Logs accesibles
- Metrics potenciales

### 3. Updates
- Dependencias actualizables
- Breaking changes manejables
- Migración documentada

## Testing Strategy

### 1. Unit Tests
- Componentes aislados
- Servicios
- Utilidades

### 2. Integration Tests
- Flujos completos
- API integration
- State management

### 3. E2E Tests
- Cypress/Playwright
- Flujos de usuario
- Cross-browser

## Futuras Mejoras

1. **SSR**: Next.js para mejor SEO
2. **PWA**: Offline support, push notifications
3. **Analytics**: Event tracking, user behavior
4. **A/B Testing**: Optimización de conversiones
5. **CDN**: Cloudflare para assets estáticos
6. **GraphQL**: API más flexible
7. **Microservices**: Separación de responsabilidades

## Conclusión

La arquitectura de Focus está diseñada para ser:
- **Mantenible**: Código limpio, separación clara
- **Escalable**: Crecimiento horizontal/vertical
- **Performant**: Optimizaciones en todos los niveles
- **Segura**: Buenas prácticas implementadas
- **User-friendly**: DX e UX excelentes

El stack elegido balancea perfectamente modernidad, performance y simplicidad, permitiendo iterar rápido mientras se mantiene código de alta calidad.
