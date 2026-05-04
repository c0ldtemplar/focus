# Instrucciones de Inicio - Focus AI Studio

## ✅ Estado actual: Servidor corriendo en puerto 3000

El servidor de producción está **activo** y sirviendo la aplicación.

## 🌐 URLs disponibles

- **Landing page (pública):** http://localhost:3000/
- **Login/Signup:** http://localhost:3000/login
- **Dashboard (protegido):** http://localhost:3000/dashboard

## 🔐 Credenciales de acceso (modo demo)

```
Email: test@focus.local
Password: test123
```

## 📝 Comandos disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción (build + servidor)
npm run build
npm start

# Limpiar y reconstruir
npm run clean && npm run build && npm start

# Usar script de inicio automatico
./start.sh
```

## 🔄 Reiniciar el servidor

Si el puerto 3000 está ocupado:

```bash
# Opción 1: Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Opción 2: Usar puerto diferente
PORT=3001 npm start
```

## 🗂️ Estructura de rutas nueva

```
/                    → Landing page pública (accesible sin login)
/login               → Página de autenticación (login/signup)
/dashboard           → Dashboard con eventos (requiere autenticación)
```

## 💾 Persistencia de datos

La aplicación guarda en `localStorage`:
- `focus-interests` → Intereses seleccionados
- `focus-settings` → Configuración (radio, ubicación)
- `focus-bookmarks` → Eventos guardados
- `focus-demo-user` → Sesión en modo demo

## 🧪 Tests

```bash
npm run test          # Tests unitarios
npm run test:e2e      # Tests end-to-end (Playwright)
npm run lint          # Verificar código
```

## 🐛 Solución de problemas

### Puerto 3000 en uso
```bash
lsof -ti:3000 | xargs kill -9
```

### Limpiar build
```bash
npm run clean
```

### Ver logs del servidor
```bash
tail -f /tmp/prod.log
```

## 📱 Modo desarrollo vs producción

- **Desarrollo (`npm run dev`):** Vite dev server en puerto 3000, HMR activo
- **Producción (`npm start`):** Express sirve archivos estáticos desde `dist/`
