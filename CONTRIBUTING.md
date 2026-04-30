# Guía de Contribución - Focus AI Studio

## Cómo Contribuir

¡Gracias por considerar contribuir a Focus! Este proyecto está diseñado para ser accesible a desarrolladores de todos los niveles.

## Configuración del Entorno

### Requisitos Previos

- Node.js 20+ (recomendado)
- npm 9+ o yarn
- Git
- Docker (opcional, para despliegue)

### Instalación Local

1. **Clonar el repositorio:**
```bash
git clone https://github.com/c0ldtemplar/focus.git
cd focus
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar entorno:**
```bash
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

4. **Iniciar desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Código

### Organización de Archivos

```
src/
├── components/          # Componentes React reutilizables
│   ├── ErrorBoundary.tsx    # Manejo de errores
│   ├── EventFeed.tsx        # Feed de eventos
│   ├── InterestPicker.tsx   # Selector de intereses
│   └── MapOverlay.tsx       # Mapa de eventos
├── services/            # Lógica de negocio y APIs
│   └── geminiService.ts     # Servicio de Gemini
├── types.ts             # Tipos TypeScript
├── constants.ts         # Constantes y configuraciones
├── App.tsx             # Componente principal
└── main.tsx            # Punto de entrada
```

### Convenciones de Nomenclatura

- **Componentes**: PascalCase (`EventFeed`, `InterestPicker`)
- **Funciones**: camelCase (`fetchEvents`, `toggleInterest`)
- **Variables**: camelCase (`userSettings`, `activeInterests`)
- **Constantes**: UPPER_SNAKE_CASE (`CACHE_DURATION_MS`)
- **Archivos**: kebab-case (`event-feed.tsx`, `gemini-service.ts`)

## Desarrollo

### Branching Strategy

- **main**: Producción, siempre estable
- **develop**: Desarrollo activo, integración
- **feature/***: Nuevas características
- **fix/***: Corrección de bugs
- **hotfix/***: Correcciones urgentes

### Workflow Git

1. **Crear branch:**
```bash
git checkout -b feature/nueva-caracteristica
```

2. **Desarrollar:**
```bash
# Hacer cambios
npm run lint  # Verificar tipos
npm run build # Asegurar build exitoso
```

3. **Commit:**
```bash
git add .
git commit -m "feat: agregar nueva característica"
```

4. **Push:**
```bash
git push origin feature/nueva-caracteristica
```

5. **Pull Request:**
- Crear PR contra `develop`
- Describir cambios
- Solicitar revisión

### Commit Messages

Usar convención [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato (sin cambios lógicos)
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

Ejemplos:
```bash
git commit -m "feat: agregar caché en geminiService"
git commit -m "fix: corregir error en InterestPicker"
git commit -m "docs: actualizar README"
```

## Estándares de Código

### TypeScript

- **Tipos explícitos**: Evitar `any`
- **Interfaces**: Preferir sobre `type`
- **Generics**: Usar cuando aplique
- **Null safety**: Manejar casos nulos

Ejemplo:
```typescript
// ✅ Correcto
interface User {
  id: string;
  name: string;
}

// ❌ Incorrecto
const user: any = {};
```

### React

- **Componentes funcionales**: Usar hooks
- **Props**: Tipar todas las props
- **Estado**: Minimalista, solo necesario
- **Efectos**: Limpiar suscripciones
- **Keys**: Únicas en listas

Ejemplo:
```typescript
// ✅ Correcto
interface Props {
  items: Item[];
  onSelect: (item: Item) => void;
}

const List: React.FC<Props> = ({ items, onSelect }) => {
  return items.map(item => (
    <div key={item.id} onClick={() => onSelect(item)}>
      {item.name}
    </div>
  ));
};
```

### Estilo

- **Tailwind**: Utility-first
- **Responsive**: Mobile-first
- **Accesibilidad**: ARIA labels, teclado
- **Consistencia**: Seguir patrones existentes

### Performance

- **Memoización**: `useCallback`, `useMemo`
- **Lazy loading**: Componentes pesados
- **Bundle**: Mantenerlo pequeño
- **Images**: Optimizar formatos

## Testing

### Estrategia

- **Unit tests**: Componentes, servicios
- **Integration tests**: Flujos completos
- **E2E tests**: Escenarios de usuario

### Herramientas

- **Vitest**: Unit tests
- **React Testing Library**: Componentes
- **Cypress**: E2E tests

### Ejemplo Test

```typescript
import { render, screen } from '@testing-library/react';
import { InterestPicker } from './InterestPicker';

describe('InterestPicker', () => {
  it('should render interests', () => {
    const interests = [
      { id: '1', name: 'Música', icon: 'music', active: false }
    ];
    
    render(<InterestPicker interests={interests} onToggle={() => {}} />);
    
    expect(screen.getByText('Música')).toBeInTheDocument();
  });
});
```

## Revisión de Código

### Checklist PR

- [ ] Código sigue estándares
- [ ] Tests incluidos/actualizados
- [ ] Documentación actualizada
- [ ] Build exitoso
- [ ] Linting sin errores
- [ ] No hay memory leaks
- [ ] Accesibilidad considerada
- [ ] Performance no degradada

### Revisores

- Mínimo 1 aprobación
- Sin conflictos de merge
- CI/CD pasa

## Documentación

### Qué Documentar

- **Nuevas características**: Uso, ejemplos
- **Cambios breaking**: Migración
- **APIs**: Endpoints, parámetros
- **Configuración**: Variables de entorno

### Dónde Documentar

- **README.md**: General, instalación
- **ARCHITECTURE.md**: Arquitectura técnica
- **DEPLOYMENT.md**: Despliegue
- **CONTRIBUTING.md**: Esta guía
- **Inline comments**: Código complejo

## Reportar Issues

### Bug Reports

Incluir:
- Descripción clara
- Pasos para reproducir
- Comportamiento esperado
- Comportamiento actual
- Capturas de pantalla
- Entorno (OS, navegador, versión)

### Feature Requests

Incluir:
- Descripción del problema
- Solución propuesta
- Casos de uso
- Alternativas consideradas
- Beneficios esperados

## Comunidad

### Código de Conducta

- Respeto mutuo
- Lenguaje inclusivo
- Constructivo, no destructivo
- Ayudar, no solo criticar

### Canales

- **Issues**: Bugs, features
- **PRs**: Contribuciones
- **Discussions**: Preguntas, ideas

## Reconocimientos

- Agradecer a los contribuidores
- Mencionar en CHANGELOG
- Considerar acceso a repositorio

## Preguntas Frecuentes

**¿Puedo contribuir sin experiencia previa?**
¡Sí! Empezar con issues marcados como "good first issue".

**¿Cómo pruebo mis cambios?**
`npm run lint` y `npm run build` antes de commit.

**¿Qué pasa si mi PR no es aceptado?**
Feedback constructivo, iterar y mejorar.

**¿Puedo usar este proyecto comercialmente?**
Sí, licencia MIT permite uso comercial.

## Agradecimientos

Gracias a todos los contribuidores que hacen Focus mejor cada día. ¡Tu contribución importa!

---

*Última actualización: Abril 2026*
