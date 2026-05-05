# 🚀 Despliegue en Raspberry Pi - Focus AI Studio

## 📋 Requisitos

- **Raspberry Pi** con Raspberry Pi OS (64-bit) o Ubuntu Server
- **Node.js 20+** (si no usas Docker)
- **Docker** (recomendado para producción)
- **3GB RAM** mínimo (4GB recomendado)
- Conexión a Internet

## 🐳 Opción 1: Despliegue con Docker (Recomendado)

### 1. Preparar la Raspberry Pi

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario actual a grupo docker (para evitar sudo)
sudo usermod -aG docker $USER
# IMPORTANTE: Cierra sesión y vuelve a entrar
```

### 2. Clonar y configurar

```bash
# Clonar repositorio
git clone https://github.com/c0ldtemplar/focus.git
cd focus

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus API keys
```

**Variables obligatorias para eventos reales:**
```
SEATGEEK_CLIENT_ID=tu_client_id_aqui
# Consigue gratis en: https://platform.seatgeek.com/
```

**Variables opcionales:**
```
GEMINI_API_KEY=    # Opcional (fallback IA)
FIREBASE_*         # Opcional (auth con Firebase)
```

### 3. Construir y ejecutar

```bash
# Construir imagen
docker compose build

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

**Acceso:**
- App: `http://<raspberry-ip>:3002`
- Health: `http://<raspberry-ip>:3002/health`

## 💻 Opción 2: Instalación directa (Sin Docker)

### 1. Instalar Node.js 20+

```bash
# Usar nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # Debe ser v20.x o superior
```

### 2. Clonar y configurar

```bash
git clone https://github.com/c0ldtemplar/focus.git
cd focus
cp .env.example .env
# Editar .env con tus API keys
```

### 3. Instalar y levantar

```bash
# Instalar dependencias exactas desde package-lock.json
npm ci

# Build de producción
npm run build

# Iniciar (usando systemd para persistencia)
sudo nano /etc/systemd/system/focus.service
```

**Contenido de `focus.service`:**
```ini
[Unit]
Description=Focus AI Studio
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/focus
ExecStart=/home/pi/.nvm/versions/node/v20.20.1/bin/node /home/pi/focus/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable focus
sudo systemctl start focus
sudo systemctl status focus

# Ver logs
sudo journalctl -u focus -f
```

> Ajusta `User`, `WorkingDirectory` y `ExecStart` si tu usuario o ruta no son `pi` y `/home/pi/focus`.
> Para ver el binario exacto de Node en tu Raspberry: `which node`.

## 🔧 Configuración de APIs

### SeatGeek (Recomendado - Gratis)

1. Registro: https://platform.seatgeek.com/
2. Crear una app → Obtén `client_id`
3. Agregar a `.env`:
   ```
   SEATGEEK_CLIENT_ID=tu_client_id
   ```
4. La app busca eventos en un radio configurado (1-10km)

**Tipos de eventos soportados:**
- Conciertos (Música)
- Deportes
- Teatro
- Festivales (incluye gastronomía)
- Conferencias (Tecnología)

### Gemini AI (Fallback - Opcional)

Si SeatGeek no devuelve suficientes eventos, Gemini genera sugerencias inteligentes locales.

```bash
# Obtener API key
https://ai.google.dev/

# En .env:
GEMINI_API_KEY=tu_clave_gemini
```

## 📡 Verificación

```bash
# Probar que la app responde
curl http://localhost:3000/health

# logs
docker compose logs -f focus-app  # Docker
sudo journalctl -u focus -f        # systemd

# Métricas
curl http://localhost:3000/health
```

## 🐛 Solución de problemas

### Puerto 3000 en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matarlo
sudo kill -9 <PID>
```

### Permisos Docker
```bash
# Si docker no funciona sin sudo
sudo usermod -aG docker $USER
# Reiniciar sesión
```

### Logs
```bash
# Docker
docker compose logs focus-app

# systemd
sudo journalctl -u focus -f --no-pager

# Archivo (modo directo)
tail -f /tmp/focus.log
```

### Reconstruir
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 🔄 Actualizaciones

```bash
git pull origin main
docker compose down
docker compose build
docker compose up -d
```

O con systemd:
```bash
git pull origin main
rm -rf node_modules
npm ci
npm run build
sudo systemctl restart focus
```

Si `npm run build` falla con un error de `@jridgewell/trace-mapping` o exports ESM, casi siempre es un `node_modules` inconsistente. Reinstala limpio:

```bash
rm -rf node_modules package-lock.json
git checkout -- package-lock.json
npm ci
npm run build
```

Si `sudo systemctl restart focus` devuelve `Unit focus.service not found`, el servicio todavía no existe o tiene otro nombre:

```bash
systemctl list-unit-files | grep -i focus
sudo nano /etc/systemd/system/focus.service
sudo systemctl daemon-reload
sudo systemctl enable --now focus
sudo systemctl status focus
```

## 📊 Monitoreo

**Health check:** `http://localhost:3000/health`
```json
{ "status": "ok", "timestamp": "2026-05-04T..." }
```

**Uso de recursos:**
```bash
docker stats focus-app  # Docker
htop                    # General
```

## 🎯 Variables de entorno completas

```env
# APIs
SEATGEEK_CLIENT_ID=        # Obligatorio para eventos reales
SEATGEEK_CLIENT_SECRET=    # Opcional
GEMINI_API_KEY=            # Opcional (fallback IA)

# Firebase (opcional - modo demo si no)
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

## 🎉 Listo!

La aplicación debería estar corriendo en `http://<raspberry-ip>:3002` (Docker) o `http://<raspberry-ip>:3000` (directo).

**Credenciales demo:**
- Email: `test@focus.local`
- Password: `test123`

---

¿Problemas? Revisa logs y verifica que las API keys sean correctas.
