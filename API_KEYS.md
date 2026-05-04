# 🔑 Configuración de APIs - Focus AI Studio

## APIs Disponibles

### 1. SeatGeek API (Principal - Gratis)

**Registro:** https://platform.seatgeek.com/

**Pasos:**
1. Crear cuenta gratuita
2. Click "Create an App"
3. Nombre app: "Focus AI Studio"
4. Descripción: "Local event discovery"
5. Una vez creada, copiar el `client_id`
6. Pegar en `.env`:
   ```
   SEATGEEK_CLIENT_ID=abcd1234efgh5678ijkl9012mnop3456
   ```

**¿Qué obtienes?**
- Eventos reales: conciertos, deportes, teatro
-地理位置 coordinates y direcciones
- Imágenes de eventos
- Información de venues
- Precios (si están disponibles)

**Límites gratuitos:**
- 60 requests/minute
- Hasta 100 eventos por request
- Cache de 5 minutos en la app

### 2. Gemini AI (Fallback - Opcional)

**Registro:** https://ai.google.dev/

**Pasos:**
1. Ir a Google AI Studio
2. Crear API key
3. Copiar la clave
4. Pegar en `.env`:
   ```
   GEMINI_API_KEY=AIzaSy...tu_clave...
   ```

**¿Para qué sirve?**
- Genera sugerencias de eventos locales cuando SeatGeek no tiene datos
- Crea descripciones creativas
- Prioriza eventos basado en intereses

### 3. Firebase Auth (Opcional)

Si quieres autenticación real con Firebase (en vez de modo demo):

**Registro:** https://firebase.google.com/

1. Crear proyecto
2. Activar Authentication → Email/Password y Google
3. Obtener config:
   - API Key
   - Auth Domain
   - Project ID
   - etc.
4. Agregar a `.env`:
   ```
   FIREBASE_API_KEY=...
   FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   FIREBASE_PROJECT_ID=tu-proyecto
   ...
   ```

**Sin Firebase:** La app usa modo demo con usuarios de prueba:
- `test@focus.local` / `test123`
- `demo@focus.local` / `demo123`

## 📁 Archivo .env de ejemplo

```env
# APIs de Eventos
SEATGEEK_CLIENT_ID=                # Obligatorio para datos reales
SEATGEEK_CLIENT_SECRET=            # Opcional

# IA (Fallback)
GEMINI_API_KEY=                    # Opcional

# Firebase Auth (Opcional)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Sistema
NODE_ENV=production
PORT=3000
```

## 🔄 Orden de prioridad de fuentes

1. **SeatGeek** (si `SEATGEEK_CLIENT_ID` configurado) → eventos reales
2. **Gemini AI** (si `GEMINI_API_KEY` configurado) → sugerencias IA
3. **Modo demo** → datos de ejemplo

## 📊 Ejemplo de flujo

```javascript
// Usuario configura solo SeatGeek
SEATGEEK_CLIENT_ID=abc123

// App busca en SeatGeek → obtiene 5 eventos reales
// Si SeatGeek no devuelve eventos → fallback a Gemini (si tiene clave)
// Si tampoco → modo demolimitado

// Resultado: eventos personalizados y reales en tu área
```

## 💡 Consejos

- **SeatGeek gratis** es más que suficiente para uso personal
- Configura solo `SEATGEEK_CLIENT_ID` y listo
- Gemini es opcional, pero mejora la calidad cuando hay pocos eventos
- Firebase no es necesario (usa modo demo)

¿Necesitas ayuda? Revisa `DEPLOY_RASPBERRY.md` para despliegue completo.
