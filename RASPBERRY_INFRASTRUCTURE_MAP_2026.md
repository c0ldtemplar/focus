# Raspberry Pi — Mapa de Infraestructura Completo 2026

> **Fuente única de verdad** para todos los servicios, redes y configuraciones del host `192.168.4.7`
> Última actualización: 2026-03-31
> Mantener sincronizado tras cualquier cambio en la Raspberry.

---

## 1. Resumen del host

| Campo             | Valor                            |
| ----------------- | -------------------------------- |
| IP local          | `192.168.4.7`                    |
| Usuario operativo | `coldtemplar`                    |
| Reverse proxy     | Nginx Proxy Manager (NPM)        |
| Panel NPM         | `https://npm.rocalian.cl`        |
| Runtime de apps   | Docker + Docker Compose          |
| SSH key requerida | `tea-raspberry-ssh` (en Jenkins) |

---

## 2. Concepto clave: NPM Destination vs `container_name`

### ¿Por qué NPM puede usar el nombre del contenedor como hostname?

Nginx Proxy Manager corre **dentro de Docker**. Cuando configuras un proxy host en NPM y pones como destino `http://tea-connect-app:3334`, NPM resuelve ese nombre usando el **DNS interno de Docker**.

Docker asigna automáticamente un nombre DNS a cada contenedor dentro de una red bridge compartida. Si NPM y el contenedor destino están en la **misma red Docker**, NPM puede hablar con él solo usando el `container_name`.

```
Browser → NPM container (red shared) → tea-connect-app container (misma red)
          DNS interno Docker resuelve "tea-connect-app" → 172.18.0.X
```

### La regla crítica

> **Si un contenedor no está en la misma red Docker que NPM, NPM NO puede resolverlo por nombre.**
> En ese caso hay que usar la IP del host (`192.168.4.7`) y el puerto mapeado externamente.

Por eso `192.168.4.7:5001` (el registry) aparece con IP en lugar de nombre: ese servicio no está en la misma red que NPM.

### Resumen visual

| Destino en NPM                | Tipo de resolución     | Condición                         |
| ----------------------------- | ---------------------- | --------------------------------- |
| `http://tea-connect-app:3334` | DNS interno Docker     | Ambos en misma red Docker         |
| `http://192.168.4.7:5001`     | IP del host (loopback) | Contenedor fuera de la red de NPM |
| `http://grafana:3000`         | DNS interno Docker     | Grafana conectado a red de NPM    |

---

## 3. Inventario completo de contenedores

### 3.1 Servicios de infraestructura compartida

| container_name                 | Imagen/App            | Puerto interno | Puerto host mapeado | Dominio público               | Estado    |
| ------------------------------ | --------------------- | -------------- | ------------------- | ----------------------------- | --------- |
| `nginx-proxy-manager`          | NPM (Nginx)           | 80, 443, 81    | 80, 443, 81         | `https://npm.rocalian.cl`     | ✅ Online |
| `jenkins-pro`                  | Jenkins LTS           | 8080           | 127.0.0.1:8081      | `https://jenkins.rocalian.cl` | ✅ Online |
| `grafana`                      | Grafana OSS           | 3000           | —                   | (URL pendiente de confirmar)  | ✅ Online |
| `rocalian-monitor`             | Uptime Kuma o similar | 3001           | —                   | (URL pendiente de confirmar)  | ✅ Online |
| `infrastructure-control-panel` | Panel admin           | 3000           | —                   | `https://admin.rocalian.cl`   | ✅ Online |

### 3.2 TEA Connect — stack productivo

| container_name         | Imagen               | Puerto interno | Puerto host           | Red Docker            | Estado    |
| ---------------------- | -------------------- | -------------- | --------------------- | --------------------- | --------- |
| `tea-connect-app`      | tea-connect (custom) | 3334           | `127.0.0.1:3334`      | `tea-connect_default` | ✅ Online |
| `tea-connect-postgres` | postgres:16.2-alpine | 5432           | `127.0.0.1:5435`      | `tea-connect_default` | ✅ Online |
| `tea-connect-redis`    | redis:7.2-alpine     | 6379           | `127.0.0.1:6380`      | `tea-connect_default` | ✅ Online |
| `tea-connect-minio`    | minio (2024-01)      | 9000, 9001     | `127.0.0.1:9010/9011` | `tea-connect_default` | ✅ Online |

### 3.3 WordPress — rocalian.cl

| container_name | Imagen        | Puerto | Dominio               | Estado                      |
| -------------- | ------------- | ------ | --------------------- | --------------------------- |
| `rocalian-wp`  | WordPress     | 80     | `https://rocalian.cl` | ⚠️ Error DB (ver sección 6) |
| (DB asociada)  | MySQL/MariaDB | 3306   | —                     | Verificar estado            |

### 3.4 WordPress — ftailor.cl

| container_name | Imagen        | Puerto | Dominio             | Estado                      |
| -------------- | ------------- | ------ | ------------------- | --------------------------- |
| `ftailor-wp`   | WordPress     | 80     | `http://ftailor.cl` | ⚠️ Error DB (ver sección 6) |
| (DB asociada)  | MySQL/MariaDB | 3306   | —                   | Verificar estado            |

### 3.5 Aplicación e-tomas

| container_name | Puerto | Dominio                      | Estado    |
| -------------- | ------ | ---------------------------- | --------- |
| `e-tomas-app`  | 3000   | `https://etomas.rocalian.cl` | ✅ Online |

### 3.6 Docker Registry

| Servicio      | Endpoint           | SSL | Estado    |
| ------------- | ------------------ | --- | --------- |
| Registry (v2) | `192.168.4.7:5001` | ✅  | ✅ Online |

> El registry usa IP directa porque no comparte red con NPM.
> Usado por Jenkins para push/pull de imágenes de `tea-connect`.

---

## 4. Mapa de redes Docker

### Problema de redes múltiples

Cuando hay múltiples docker-compose en la misma máquina, **cada stack crea su propia red bridge aislada**. Los contenedores de distintos stacks NO se ven entre sí por nombre por defecto.

```
Stack tea-connect:     red → tea-connect_default (172.18.0.0/16 aprox)
Stack rocalian-wp:     red → rocalian_default    (172.19.0.0/16 aprox)
Stack npm:             red → npm_default          (172.20.0.0/16 aprox)
```

### Solución recomendada: red compartida externa

Crear una red externa llamada `shared-proxy` y conectar a ella todos los contenedores que NPM debe resolver por nombre:

```bash
docker network create shared-proxy
```

Luego en cada `docker-compose.yml` relevante:

```yaml
networks:
  default:
    name: shared-proxy
    external: true
```

O agregar la red adicional sin perder la red interna del stack:

```yaml
services:
  tea-connect-app:
    networks:
      - default
      - shared-proxy

networks:
  default:
  shared-proxy:
    external: true
```

### Estado actual de redes (a verificar)

```bash
# Ejecutar en Raspberry para ver el estado real:
sudo docker network ls
sudo docker network inspect shared-proxy 2>/dev/null || echo "No existe red shared-proxy"
sudo docker inspect tea-connect-app --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
sudo docker inspect nginx-proxy-manager --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
```

---

## 5. Configuración NPM — Proxy Hosts activos

| Dominio origen                | Destino NPM                                | SSL           | Estado    | Creado     |
| ----------------------------- | ------------------------------------------ | ------------- | --------- | ---------- |
| `https://admin.rocalian.cl`   | `http://infrastructure-control-panel:3000` | HTTP Only     | ✅ Online | 04/02/2026 |
| `https://etomas.rocalian.cl`  | `http://e-tomas-app:3000`                  | HTTP Only     | ✅ Online | 04/02/2026 |
| `http://ftailor.cl`           | `http://ftailor-wp:80`                     | HTTP Only     | ⚠️ Error  | 04/02/2026 |
| (grafana URL)                 | `http://grafana:3000`                      | HTTP Only     | ✅ Online | 29/12/2025 |
| `https://jenkins.rocalian.cl` | `http://jenkins-pro:8080`                  | Let's Encrypt | ✅ Online | 29/12/2025 |
| (monitor URL)                 | `http://rocalian-monitor:3001`             | HTTP Only     | ✅ Online | 04/02/2026 |
| `https://npm.rocalian.cl`     | `http://nginx-proxy-manager:81`            | Let's Encrypt | ✅ Online | 29/12/2025 |
| `https://rocalian.cl`         | `http://rocalian-wp:80`                    | HTTP Only     | ⚠️ Error  | 04/02/2026 |
| (registry URL)                | `http://192.168.4.7:5001`                  | Let's Encrypt | ✅ Online | 26/01/2026 |
| `https://tea.syncrond.cl`     | `http://tea-connect-app:3334`              | HTTP Only     | ✅ Online | 30/03/2026 |

---

## 6. WordPress — Diagnóstico y corrección de error de DB

### Síntoma

Ambos sitios WordPress muestran "Error al conectar a la base de datos" tras migración.

### Causa probable

Tras migrar la Raspberry (cambio de IP, rename de contenedores, o recreación del stack), los valores en `wp-config.php` de cada WordPress apuntan a una DB que ya no existe en esa dirección.

### Diagnóstico

```bash
# Ver estado de contenedores WordPress y sus DBs
sudo docker ps -a | grep -E "wp|mysql|mariadb"

# Ver logs del contenedor WordPress
sudo docker logs rocalian-wp --tail=50
sudo docker logs ftailor-wp --tail=50

# Ver wp-config.php de rocalian
sudo docker exec rocalian-wp cat /var/www/html/wp-config.php | grep -E "DB_HOST|DB_NAME|DB_USER|DB_PASSWORD"

# Ver wp-config.php de ftailor
sudo docker exec ftailor-wp cat /var/www/html/wp-config.php | grep -E "DB_HOST|DB_NAME|DB_USER|DB_PASSWORD"
```

### Corrección

Una vez identificado el container_name de la base de datos MySQL/MariaDB:

```bash
# Opción 1: actualizar vía WP-CLI (si está instalado)
sudo docker exec rocalian-wp wp config set DB_HOST nombre-del-contenedor-mysql --allow-root

# Opción 2: editar wp-config.php directamente
sudo docker exec -it rocalian-wp bash
# Dentro del contenedor:
sed -i "s/define('DB_HOST', '.*')/define('DB_HOST', 'nombre-correcto-mysql')/" /var/www/html/wp-config.php
```

### Alternativa: usar variables de entorno en docker-compose

La forma más robusta es NO hardcodear en wp-config.php sino pasar las credenciales como variables de entorno en el compose:

```yaml
services:
  rocalian-wp:
    image: wordpress:latest
    environment:
      WORDPRESS_DB_HOST: rocalian-mysql:3306
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: ${WP_ROCALIAN_DB_PASSWORD}
      WORDPRESS_DB_NAME: rocalian_wp
    depends_on:
      - rocalian-mysql
```

---

## 7. Recomendaciones para máxima robustez

### 7.1 Red compartida (CRÍTICO)

```bash
# Crear red compartida una vez
sudo docker network create shared-proxy

# Verificar que NPM está en esa red
sudo docker network connect shared-proxy nginx-proxy-manager

# Conectar cada servicio que NPM proxea
sudo docker network connect shared-proxy tea-connect-app
sudo docker network connect shared-proxy e-tomas-app
sudo docker network connect shared-proxy grafana
sudo docker network connect shared-proxy rocalian-monitor
sudo docker network connect shared-proxy infrastructure-control-panel
sudo docker network connect shared-proxy rocalian-wp
sudo docker network connect shared-proxy ftailor-wp
sudo docker network connect shared-proxy jenkins-pro
```

Luego declarar `shared-proxy` como `external` en cada compose para que persista tras reinicios.

### 7.2 Puertos — qué debe estar expuesto vs privado

| Puerto | Servicio             | Exposición correcta       | Notas                              |
| ------ | -------------------- | ------------------------- | ---------------------------------- |
| 80     | NPM (HTTP)           | `0.0.0.0:80`              | Recibe todo el tráfico web         |
| 443    | NPM (HTTPS)          | `0.0.0.0:443`             | Recibe todo el tráfico TLS         |
| 81     | NPM admin            | `127.0.0.1:81`            | Solo acceso interno / tunelado NPM |
| 8081   | Jenkins              | `127.0.0.1:8081`          | Solo acceso interno / vía NPM      |
| 5001   | Docker registry      | `0.0.0.0:5001` (con auth) | Necesario para push desde Jenkins  |
| 5435   | tea-connect-postgres | `127.0.0.1:5435`          | NUNCA expuesto públicamente        |
| 6380   | tea-connect-redis    | `127.0.0.1:6380`          | NUNCA expuesto públicamente        |
| 9010   | MinIO API            | `127.0.0.1:9010`          | Solo acceso interno                |
| 9011   | MinIO Console        | `127.0.0.1:9011`          | Solo acceso interno                |
| 3334   | tea-connect-app      | `127.0.0.1:3334`          | Solo vía NPM                       |
| 3000   | Grafana              | interno (vía red shared)  | Solo vía NPM                       |
| 3001   | rocalian-monitor     | interno (vía red shared)  | Solo vía NPM                       |
| 3306   | MySQL/MariaDB WP     | `127.0.0.1:XXXX`          | NUNCA expuesto públicamente        |

### 7.3 SSL — estado y mejoras

| Dominio                       | SSL actual    | Acción recomendada                   |
| ----------------------------- | ------------- | ------------------------------------ |
| `https://npm.rocalian.cl`     | Let's Encrypt | ✅ OK                                |
| `https://jenkins.rocalian.cl` | Let's Encrypt | ✅ OK                                |
| `https://admin.rocalian.cl`   | HTTP Only     | Migrar a Let's Encrypt               |
| `https://etomas.rocalian.cl`  | HTTP Only     | Migrar a Let's Encrypt               |
| `https://rocalian.cl`         | HTTP Only     | Migrar a Let's Encrypt (tras fix DB) |
| `http://ftailor.cl`           | Sin SSL       | Agregar Let's Encrypt (tras fix DB)  |
| `https://tea.syncrond.cl`     | HTTP Only     | **Migrar a Let's Encrypt urgente**   |

### 7.4 Verificación rápida del estado completo

```bash
# Script de verificación — ejecutar en Raspberry
echo "=== CONTAINERS ===" && sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo "" && echo "=== NETWORKS ===" && sudo docker network ls
echo "" && echo "=== DISK ===" && df -h /opt/tea-connect /var/lib/docker
echo "" && echo "=== MEMORY ===" && free -h
echo "" && echo "=== TEA CONNECT HEALTH ===" && curl -s http://localhost:3334/api/v1/health
```

---

## 8. Acceso SSH al host

### Configuración recomendada en `~/.ssh/config` (en tu máquina de trabajo)

```ssh-config
Host raspberry
  HostName 192.168.4.7
  User coldtemplar
  IdentityFile ~/.ssh/id_raspberry
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

### Setup inicial de clave SSH

```bash
# En tu máquina de trabajo:
ssh-keygen -t ed25519 -C "raspberry-access-2026" -f ~/.ssh/id_raspberry

# Copiar clave pública a la Raspberry:
ssh-copy-id -i ~/.ssh/id_raspberry.pub coldtemplar@192.168.4.7

# Verificar acceso:
ssh raspberry "echo 'acceso OK'"
```

---

## 9. Ubicaciones clave en la Raspberry

| Ruta                                      | Propósito                                   |
| ----------------------------------------- | ------------------------------------------- |
| `/opt/tea-connect/app`                    | Repo de tea-connect (fuente canónica)       |
| `/opt/tea-connect/shared/.env.production` | Variables de entorno producción tea-connect |
| `/opt/rocalian/`                          | Stack WordPress rocalian (a confirmar)      |
| `/opt/ftailor/`                           | Stack WordPress ftailor (a confirmar)       |
| `/opt/etomas/`                            | App e-tomas (a confirmar)                   |
| `/var/lib/docker/volumes/`                | Volúmenes Docker (DBs, datos)               |
| `/opt/jenkins_home` o volumen Docker      | Datos Jenkins                               |

---

## 10. Pendientes críticos

| #   | Tarea                                                     | Prioridad                |
| --- | --------------------------------------------------------- | ------------------------ |
| 1   | Arreglar WordPress rocalian.cl (DB_HOST correcto)         | ✅ Resuelto (via script) |
| 2   | Arreglar WordPress ftailor.cl (DB_HOST correcto)          | ✅ Resuelto (via script) |
| 3   | Verificar red `shared-proxy` existe y todos están en ella | ✅ Resuelto (via script) |
| 4   | Migrar `tea.syncrond.cl` a Let's Encrypt                  | 🟡 Media                 |
| 5   | Migrar dominios rocalian a Let's Encrypt                  | 🟡 Media                 |
| 6   | Confirmar rutas reales de compose files en Raspberry      | 🟡 Media                 |
| 7   | Documentar credenciales MySQL de WordPress                | 🟡 Media                 |
| 8   | Configurar backup automatizado de volúmenes Docker        | 🟡 Media                 |

---

---

## 12. Credenciales requeridas en Jenkins

Estas son las credenciales que el Jenkinsfile consume. Todas deben existir en
**Manage Jenkins → Credentials → System → Global credentials**.

| ID en Jenkins             | Tipo               | Usado en stage                                   | Descripción                                                 |
| ------------------------- | ------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `raspberry-github-deploy` | Username/Password  | Checkout (job config)                            | PAT de GitHub para que Jenkins en Raspberry clone el repo   |
| `tea-raspberry-ssh`       | SSH Username + key | `Production Release`, `Post-Deploy Health Check` | Clave SSH para que Jenkins ejecute comandos en la Raspberry |
| `CLERK_SECRET_KEY`        | Secret text        | `QA: Parallel Gates`                             | Clerk secret key de producción                              |
| `CLERK_IMPORT_PASSWORD`   | Secret text        | `QA: Parallel Gates`                             | Password para importar usuarios demo a Clerk                |
| `production-dotenv`       | Secret file        | `Production Release`                             | Archivo `.env.production` completo                          |

> **Nota:** La credencial GitHub que usaba el job (`rocalian-dev`) fue reemplazada
> por `raspberry-github-deploy`, cuyo token identifica explícitamente el origen
> "Jenkins en Raspberry Pi". Ver sección 13 para los pasos de creación.

---

## 13. Modos de deploy — los 3 flujos disponibles

### Modo 1 — Jenkins en Raspberry (remoto) ← FLUJO ACTIVO

```text
Desarrollador
  └── git push origin main
        └── GitHub (c0ldtemplar/tea-connect)
              └── Jenkins en Raspberry (192.168.4.7:8080)
                    ├── git clone / fetch desde GitHub  ← necesita PAT (raspberry-github-deploy)
                    ├── pnpm install + build
                    ├── docker buildx build --platform linux/arm64
                    ├── docker push → registry local (192.168.4.7:5000)
                    └── SSH deploy → tea-connect-app en la misma Raspberry
```

**Cuándo usarlo:** deploy a producción desde cualquier máquina, sin depender del entorno local.

**Credencial GitHub requerida:** `raspberry-github-deploy` (PAT con scope `repo:read`)

**Disparar manualmente:**

```bash
# Desde tu máquina de trabajo (con SSH hacia la Raspberry):
ssh coldtemplar@192.168.4.7 \
  "curl -sS -b /tmp/jc.txt -u 'coldtemplar:BB2024' \
   -H \"\$(curl -sS -c /tmp/jc.txt -u 'coldtemplar:BB2024' \
     http://127.0.0.1:8080/crumbIssuer/api/json | python3 -c \
     'import sys,json; d=json.load(sys.stdin); print(\"Jenkins-Crumb: \"+d[\"crumb\"])')\" \
   -X POST 'http://127.0.0.1:8080/job/teaconnect/build'"
```

---

### Modo 2 — Jenkins local en Windows WSL → push directo a Raspberry

```text
Windows WSL (Ubuntu)
  └── Jenkins local (docker run jenkins en WSL)
        ├── git clone desde GitHub  ← PAT local (puede ser el mismo o uno distinto)
        ├── pnpm install + build
        ├── docker buildx build --platform linux/arm64
        ├── docker push → registry en Raspberry (192.168.4.7:5000)
        └── SSH deploy → tea-connect-app en Raspberry  ← necesita tea-raspberry-ssh
```

**Cuándo usarlo:** cuando el internet es lento y conviene compilar localmente antes de subir solo la imagen.

**Requisitos previos en WSL:**

```bash
# 1. Habilitar acceso al registry de Raspberry desde WSL
echo '{ "insecure-registries": ["192.168.4.7:5000"] }' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# 2. Verificar conectividad al registry
curl http://192.168.4.7:5000/v2/_catalog

# 3. Buildx con soporte ARM64
docker buildx create --name rpi-builder --use
docker buildx inspect --bootstrap
```

**Variable de entorno clave en el Jenkins WSL:**

```text
RASPBERRY_HOST = 192.168.4.7
RASPBERRY_APP_DIR = /opt/tea-connect/app
```

---

### Modo 3 — Jenkins local en Ubuntu nativa → push directo a Raspberry

```text
Ubuntu nativa (máquina de desarrollo)
  └── Jenkins local (docker run jenkins en Ubuntu)
        ├── git clone desde GitHub  ← PAT local
        ├── pnpm install + build
        ├── docker buildx build --platform linux/arm64
        ├── docker push → registry en Raspberry (192.168.4.7:5000)
        └── SSH deploy → tea-connect-app en Raspberry  ← necesita tea-raspberry-ssh
```

**Cuándo usarlo:** cuando se trabaja en Ubuntu nativa con mejor rendimiento de Docker que en WSL.

**Idéntico al Modo 2** en configuración. La diferencia es el host donde corre el Jenkins local.

---

### Comparativa rápida

| Criterio                   | Modo 1 (Raspberry) | Modo 2 (WSL)    | Modo 3 (Ubuntu) |
| -------------------------- | ------------------ | --------------- | --------------- |
| Compilación                | En Raspberry       | En Windows WSL  | En Ubuntu       |
| Requiere push a GitHub     | Sí                 | Sí              | Sí              |
| Requiere acceso SSH a Pi   | Solo para deploy   | Sí              | Sí              |
| Tiempo de build ARM64      | Más lento (RPi)    | Medio (emulado) | Medio (emulado) |
| Impacto en recursos del Pi | Alto durante build | Bajo            | Bajo            |
| Útil para CI automático    | Sí                 | No              | No              |

---

## 14. Pasos para crear credenciales

### 14.1 GitHub — Crear PAT para Jenkins en Raspberry

1. En tu navegador, ir a **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**

2. Clic en **"Generate new token"**

3. Configurar:
   - **Token name:** `raspberry-jenkins-deploy-2026`
   - **Expiration:** 1 year (o `No expiration` si lo rotás manualmente)
   - **Resource owner:** `c0ldtemplar`
   - **Repository access:** Only selected repositories → `tea-connect`
   - **Permissions → Repository:**
     - `Contents`: **Read-only**
     - `Metadata`: **Read-only** (se activa sola)

4. Clic **"Generate token"** y copiar el token (solo se muestra una vez).

> El token se verá así: `github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

### 14.2 Jenkins — Registrar la credencial GitHub

1. Ir a **`https://jenkins.rocalian.cl`** → **Manage Jenkins → Credentials → System → Global credentials (unrestricted)**

2. Clic en **"Add Credentials"**

3. Configurar:
   - **Kind:** `Username with password`
   - **Scope:** `Global`
   - **Username:** `c0ldtemplar` ← tu usuario de GitHub
   - **Password:** (pegar el PAT generado en 14.1)
   - **ID:** `raspberry-github-deploy`
   - **Description:** `GitHub PAT — Jenkins en Raspberry Pi 192.168.4.7`

4. Clic **"Create"**

---

### 14.3 Jenkins — Actualizar el job teaconnect para usar la nueva credencial

1. Ir a **`https://jenkins.rocalian.cl/job/teaconnect/configure`**

2. En la sección **"Pipeline"** → **"Definition"** = `Pipeline script from SCM`

3. En **"Credentials"**, cambiar de `rocalian-dev` a `raspberry-github-deploy`

4. Clic **"Save"**

---

### 14.4 Jenkins — Credencial SSH para deploy en Raspberry (`tea-raspberry-ssh`)

Esta credencial permite que Jenkins ejecute comandos remotos en la Raspberry vía SSH.

**Generar par de claves dedicado para Jenkins:**

```bash
# En tu máquina de trabajo:
ssh-keygen -t ed25519 -C "jenkins-raspberry-deploy-2026" -f ~/.ssh/jenkins_raspberry_deploy
# No poner passphrase (Jenkins no puede ingresarla interactivamente)
```

**Autorizar la clave en la Raspberry:**

```bash
ssh coldtemplar@192.168.4.7 \
  "echo '$(cat ~/.ssh/jenkins_raspberry_deploy.pub)' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Registrar en Jenkins:**

1. **Manage Jenkins → Credentials → System → Global → Add Credentials**
2. Configurar:
   - **Kind:** `SSH Username with private key`
   - **Scope:** `Global`
   - **ID:** `tea-raspberry-ssh`
   - **Description:** `SSH key — deploy a Raspberry Pi 192.168.4.7`
   - **Username:** `coldtemplar`
   - **Private Key:** `Enter directly` → pegar el contenido de `~/.ssh/jenkins_raspberry_deploy` (la clave privada)

3. Clic **"Create"**

---

### 14.5 Verificación rápida post-configuración

```bash
# Desde el workspace de Jenkins, verificar acceso a GitHub:
# Ir a https://jenkins.rocalian.cl/job/teaconnect/ → Build Now

# Verificar SSH a Raspberry desde Jenkins:
ssh -o StrictHostKeyChecking=no coldtemplar@192.168.4.7 "echo 'SSH desde Jenkins OK'"

# Verificar que el registry acepta push:
curl http://192.168.4.7:5000/v2/_catalog
```

---

## 15. Historial de cambios

| Fecha      | Cambio                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| 2026-03-30 | Documento creado — inventario desde NPM + compose files                     |
| 2026-03-30 | Agregado proxy host `tea-connect-app:3334` en NPM                           |
| 2026-03-31 | Agregadas secciones 12–14: credenciales, 3 modos de deploy, pasos setup     |
| 2026-04-11 | Pendientes críticos 1, 2 y 3 resueltos vía script de remediación automática |
