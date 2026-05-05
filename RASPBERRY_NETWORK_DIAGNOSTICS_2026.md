# Diagnostico de red - Focus en Raspberry / rocalian.cl

Fecha de revision: 2026-05-05

## Resumen ejecutivo

`npm.rocalian.cl` responde por HTTPS y sirve la UI de Nginx Proxy Manager.
`focus.rocalian.cl` llega a Cloudflare. Inicialmente devolvia `502 Bad Gateway`; luego de activar Let's Encrypt en NPM cambio a loop de redirects (`ERR_TOO_MANY_REDIRECTS`).
`https://focus.rocalian.cl:3000/` no es una ruta valida cuando el DNS esta proxied por Cloudflare: el puerto 3000 no esta entre los puertos HTTP/HTTPS que Cloudflare proxy soporta por defecto.

La falla mas probable no esta en DNS publico, sino entre Nginx Proxy Manager y el backend de Focus:

```text
Cliente externo
  -> Cloudflare proxy
  -> origen/Nginx Proxy Manager
  -> backend Focus en Raspberry
```

El tramo que falla es probablemente:

El estado actual mas probable es un conflicto de SSL/redirect entre Cloudflare y Nginx Proxy Manager:

```text
Cloudflare esta usando Flexible o llega al origen por HTTP
NPM tiene Let's Encrypt / Force SSL
NPM responde 301 a https://focus.rocalian.cl/
Cloudflare repite el request hacia el origen como HTTP
Loop
```

## Hallazgos externos

### DNS publico

Comando:

```bash
dig +short focus.rocalian.cl A focus.rocalian.cl AAAA npm.rocalian.cl A npm.rocalian.cl AAAA rocalian.cl A
```

Resultado observado:

```text
focus.rocalian.cl -> 172.67.189.217, 104.21.10.8
focus.rocalian.cl -> 2606:4700:3033::ac43:bdd9, 2606:4700:3032::6815:a08
npm.rocalian.cl   -> 172.67.189.217, 104.21.10.8
npm.rocalian.cl   -> 2606:4700:3033::ac43:bdd9, 2606:4700:3032::6815:a08
rocalian.cl       -> 104.21.10.8, 172.67.189.217
```

Conclusion: los registros estan proxied por Cloudflare. No exponen directamente la IP real del origen.

### HTTP/HTTPS

Comandos:

```bash
curl -I --max-time 10 https://focus.rocalian.cl/
curl -I --max-time 10 https://npm.rocalian.cl/
curl -I --max-time 10 https://focus.rocalian.cl:3000/
curl -I --max-time 10 https://focus.rocalian.cl:8443/
```

Resultados observados:

```text
https://focus.rocalian.cl/       -> HTTP/2 502, server: cloudflare (estado inicial)
https://focus.rocalian.cl/       -> HTTP/2 301 a https://focus.rocalian.cl/ repetido (estado tras Let's Encrypt en NPM)
https://npm.rocalian.cl/         -> HTTP/2 200, server: cloudflare
https://focus.rocalian.cl:3000/  -> timeout
https://focus.rocalian.cl:8443/  -> HTTP/2 502, server: cloudflare
```

Conclusion:

- Cloudflare y el origen de NPM responden.
- `focus.rocalian.cl` tiene ruta publica.
- El cambio de `502` a loop indica que NPM ya encuentra algo para el host, pero la capa SSL/redirect esta mal alineada.
- `:3000` no debe usarse desde fuera via Cloudflare proxied.

### Redirect loop observado

Comando:

```bash
curl -I --max-redirs 10 -L --max-time 15 https://focus.rocalian.cl/
```

Resultado observado:

```text
HTTP/2 301
location: https://focus.rocalian.cl/
server: cloudflare

HTTP/2 301
location: https://focus.rocalian.cl/
server: cloudflare

curl: (47) Maximum (10) redirects followed
```

Conclusion: el origen/proxy devuelve redirect a la misma URL HTTPS. Esto suele pasar con Cloudflare `Flexible` + NPM `Force SSL`, o cuando NPM recibe `X-Forwarded-Proto: http` y fuerza HTTPS aunque el cliente externo ya este en HTTPS.

### Certificado publico

Comando:

```bash
openssl s_client -connect focus.rocalian.cl:443 -servername focus.rocalian.cl </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Resultado observado:

```text
subject=CN=rocalian.cl
issuer=C=US, O=Google Trust Services, CN=WE1
notBefore=Mar 16 04:49:53 2026 GMT
notAfter=Jun 14 05:48:14 2026 GMT
SAN: DNS:rocalian.cl, DNS:*.rocalian.cl
```

Conclusion: el certificado publico de Cloudflare cubre `focus.rocalian.cl`.

## Cloudflare y puertos

Cloudflare proxy soporta por defecto estos puertos HTTP:

```text
80, 8080, 8880, 2052, 2082, 2086, 2095
```

Y estos puertos HTTPS:

```text
443, 2053, 2083, 2087, 2096, 8443
```

Por eso `https://focus.rocalian.cl:3000/` y `:3002` no son objetivos correctos si el record esta proxied por Cloudflare.

Referencia oficial: https://developers.cloudflare.com/fundamentals/reference/network-ports/

## Configuracion esperada en Nginx Proxy Manager

### Inventario NPM observado

Configuraciones reportadas en Nginx Proxy Manager:

```text
Destination                              SSL             Access   Status
http://infrastructure-control-panel:3000 HTTP Only       Public   Online
http://e-tomas-app:3000                  HTTP Only       Public   Online
http://focus-nginx:80                    Let's Encrypt   Public   Online
http://ftailor-wp:80                     Let's Encrypt   Public   Online
http://grafana:3000                      HTTP Only       Public   Online
http://jenkins-pro:8080                  Let's Encrypt   Public   Online
http://nginx-proxy-manager:3000          Let's Encrypt   Public   Online
http://tu-mayordomo-app:80               Let's Encrypt   Public   Online
http://rocalian-wp:80                    Let's Encrypt   Public   Online
http://192.168.4.7:5001                  Let's Encrypt   Public   Online
http://tea-connect-app:3334              HTTP Only       Public   Online
http://tea-rocalian-app:3000             Let's Encrypt   Public   Online
```

Conclusion: usar `Let's Encrypt` en NPM no es el problema por si mismo, porque varios hosts lo usan. La diferencia de `focus` es:

```text
Cloudflare -> NPM -> focus-nginx:80 -> focus-app:3000
```

en vez de:

```text
Cloudflare -> NPM -> app:puerto
```

Por lo tanto el diagnostico debe comparar estas opciones especificas del proxy host de `focus.rocalian.cl` contra un host que si funciona con Let's Encrypt, por ejemplo `jenkins-pro`, `rocalian-wp` o `tea-rocalian-app`:

```text
Force SSL
HTTP/2 Support
HSTS Enabled
HSTS Subdomains
Cache Assets
Block Common Exploits
Custom Locations
Advanced config
Cloudflare DNS proxy status del subdominio
Cloudflare Redirect/Page Rules aplicadas al hostname
```

Si algun host Let's Encrypt funciona y `focus` no, copiar su misma configuracion SSL/redirect en NPM para `focus` y dejar solo diferente el destino (`focus-nginx:80`).

### Estado observado en NPM

El proxy host de NPM aparece como:

```text
Created: Apr 29, 2026, 10:00:29 AM
Destination: http://focus-nginx:80
SSL: HTTP Only
Access: Public
Status: Online
```

Esta configuracion calza con el `docker-compose.yml` del proyecto:

```text
focus-nginx -> puerto interno 80
focus-nginx -> proxy_pass http://focus-app:3000
focus-app   -> puerto interno 3000
```

Pero solo funciona si NPM puede resolver y alcanzar `focus-nginx` por la red Docker. Si NPM corre en otro compose/red, el nombre `focus-nginx` no existe desde el contenedor de NPM aunque aparezca "Online" en la UI.

Ademas, `HTTP Only` en NPM puede fallar con Cloudflare si el modo SSL/TLS de Cloudflare esta en `Full` o `Full (strict)`, porque Cloudflare intentara hablar HTTPS con el origen/NPM. Con `HTTP Only`, NPM no presenta un certificado para `focus.rocalian.cl` en 443.

Estado posterior observado:

```text
Destination: http://focus-nginx:80
SSL: Let's Encrypt
Access: Public
Status: Online
Sintoma: ERR_TOO_MANY_REDIRECTS
```

Este estado apunta a Cloudflare en `Flexible` o a una regla de redirect duplicada.

Opciones validas:

```text
Opcion A - Recomendada:
Cloudflare SSL/TLS: Full or Full (strict)
NPM SSL para focus.rocalian.cl: Let's Encrypt activo
NPM Destination: http://focus-nginx:80

Opcion B - Temporal:
Cloudflare SSL/TLS: Flexible
NPM SSL para focus.rocalian.cl: HTTP Only
NPM Destination: http://focus-nginx:80
```

Preferir Opcion A.

Para corregir el loop actual:

```text
Cloudflare Dashboard -> rocalian.cl -> SSL/TLS -> Overview
Encryption mode: Full (strict)
```

En NPM para `focus.rocalian.cl`:

```text
SSL Certificate: Let's Encrypt para focus.rocalian.cl
Force SSL: enabled
HTTP/2 Support: enabled
HSTS: disabled al principio, habilitar solo cuando este estable
```

Si no puedes cambiar Cloudflare todavia y esta en Flexible, desactivar temporalmente `Force SSL` en NPM para cortar el loop. Esto es un workaround; la solucion correcta es `Full (strict)`.

Si Cloudflare ya esta en `Full (strict)` y el loop continua, desactivar `Force SSL` en NPM para `focus.rocalian.cl` y probar de nuevo. Mantener el certificado Let's Encrypt, pero quitar el redirect interno. Cloudflare ya entrega HTTPS al cliente y puede mantener HTTPS hacia el origen; no es necesario que NPM fuerce otro redirect.

Prueba esperada despues de desactivar `Force SSL`:

```bash
curl -I https://focus.rocalian.cl/
```

Resultado esperado:

```text
HTTP/2 200
```

Si responde `200`, el problema era el redirect forzado en NPM. Luego revisar reglas de Cloudflare antes de volver a habilitarlo.

Revisar tambien en Cloudflare:

```text
Rules -> Redirect Rules / Page Rules: no duplicar http->https para focus.rocalian.cl mientras se corrige.
SSL/TLS -> Edge Certificates -> Always Use HTTPS: puede quedar activo si Cloudflare esta en Full/Strict.
```

Para aislar si el redirect lo emite NPM localmente, probar desde la Raspberry contra NPM directo:

```bash
# Cambiar 127.0.0.1 si NPM no esta publicado en el host local.
curl -kI --resolve focus.rocalian.cl:443:127.0.0.1 https://focus.rocalian.cl/
curl -I  --resolve focus.rocalian.cl:80:127.0.0.1  http://focus.rocalian.cl/
```

Si la primera prueba local (`https` directo a NPM) devuelve `301 location: https://focus.rocalian.cl/`, el loop nace en NPM, no en Cloudflare.

Otra prueba util es saltarse el `focus-nginx` intermedio temporalmente:

```text
NPM Destination temporal:
Scheme: http
Forward Hostname / IP: focus-app
Forward Port: 3000
SSL: Let's Encrypt
Force SSL: igual que un host Let's Encrypt que si funcione
```

Si con `focus-app:3000` funciona, el problema esta entre `focus-nginx` y `focus-app` o en `nginx.conf`.

Si NPM no puede resolver `focus-app`, entonces NPM no comparte red Docker con el compose de Focus. En ese caso probar:

```text
Forward Hostname / IP: <IP-LAN-RASPBERRY>
Forward Port: 3002
Scheme: http
```

porque `docker-compose.yml` publica `focus-app` como `3002:3000`.

### Configuracion generica esperada

Proxy Host para `focus.rocalian.cl`:

```text
Domain Names: focus.rocalian.cl
Scheme: http
Forward Hostname / IP: <backend accesible desde NPM>
Forward Port: 3000
Block Common Exploits: enabled
Websockets Support: optional
SSL: Let's Encrypt o certificado gestionado en NPM
Force SSL: enabled
HTTP/2 Support: enabled
```

Importante: el backend de Focus (`server.js`) sirve HTTP, no HTTPS. En NPM el `Scheme` hacia el backend debe ser `http`.

### Si NPM y Focus estan en el mismo host

Si Focus corre con systemd en el host:

```text
Forward Hostname / IP: IP LAN de la Raspberry, por ejemplo 192.168.x.x
Forward Port: 3000
```

Evitar `localhost` desde NPM si NPM corre en Docker: dentro del contenedor, `localhost` es el contenedor de NPM, no la Raspberry host.

Alternativas:

```text
Forward Hostname / IP: 172.17.0.1
Forward Port: 3000
```

o configurar `host.docker.internal` con host-gateway si se usa Docker moderno.

Si Focus corre en Docker Compose junto a NPM en la misma red Docker:

```text
Forward Hostname / IP: focus-app
Forward Port: 3000
```

No usar el puerto publicado `3002` entre contenedores si ambos comparten red Docker; usar el puerto interno `3000`.

Si se mantiene el contenedor intermedio `focus-nginx`, entonces en NPM es valido:

```text
Forward Hostname / IP: focus-nginx
Forward Port: 80
```

con la condicion de que el contenedor NPM este unido a la misma red Docker.

## Checklist dentro de la Raspberry

Ejecutar en `/home/coldtemplar/Focus`:

```bash
pwd
git status --short --branch
node -v
npm run build
```

Verificar que Focus esta escuchando:

```bash
sudo systemctl status focus --no-pager
sudo journalctl -u focus -n 80 --no-pager
ss -tulpn | grep -E ':3000|:3002'
curl -v http://127.0.0.1:3000/health
curl -v http://$(hostname -I | awk '{print $1}'):3000/health
```

Si el servicio no existe:

```bash
cd /home/coldtemplar/Focus
NODE_BIN="$(command -v node)"

sudo tee /etc/systemd/system/focus.service > /dev/null <<EOF
[Unit]
Description=Focus AI Studio
After=network.target

[Service]
Type=simple
User=coldtemplar
WorkingDirectory=/home/coldtemplar/Focus
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=${NODE_BIN} /home/coldtemplar/Focus/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now focus
sudo systemctl status focus --no-pager
```

Verificar desde el contenedor de NPM hacia Focus:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker exec -it <npm-container-name> sh
```

Dentro del contenedor NPM:

```bash
getent hosts focus-nginx
curl -v http://focus-nginx:80/health
curl -v http://<IP-LAN-RASPBERRY>:3000/health
curl -v http://172.17.0.1:3000/health
```

Si ambos fallan, NPM no puede alcanzar el backend. Revisar firewall, bind address, red Docker o puerto configurado.

Verificar redes Docker:

```bash
docker network ls
docker inspect focus-nginx --format '{{json .NetworkSettings.Networks}}' | jq .
docker inspect <npm-container-name> --format '{{json .NetworkSettings.Networks}}' | jq .
```

Si NPM no comparte red con `focus-nginx`, hay dos arreglos:

```bash
# Arreglo 1: conectar NPM a la red del compose de Focus
docker network connect <focus-compose-network> <npm-container-name>
docker restart <npm-container-name>
```

o cambiar NPM para apuntar al puerto publicado del host:

```text
Forward Hostname / IP: <IP-LAN-RASPBERRY>
Forward Port: 8888
Scheme: http
```

porque `docker-compose.yml` publica:

```text
focus-nginx 8888:80
```

## Puertos recomendados

En router/firewall hacia la Raspberry/NPM:

```text
WAN 80  -> NPM 80
WAN 443 -> NPM 443
```

No es necesario abrir `3000` ni `3002` al exterior si se usa NPM.

En la Raspberry:

```text
Focus app: 127.0.0.1/0.0.0.0:3000
NPM: 80/443 publicos
NPM admin: idealmente solo LAN/VPN, no publico
```

## Diagnostico probable actual

Estado observado:

```text
npm.rocalian.cl      -> OK, NPM responde
focus.rocalian.cl    -> antes Cloudflare 502; ahora ERR_TOO_MANY_REDIRECTS
focus.rocalian.cl:3000 -> timeout
```

Interpretacion:

1. DNS publico y certificado Cloudflare estan bien.
2. Cloudflare puede llegar al origen que sirve NPM.
3. El proxy host `focus.rocalian.cl` en NPM existe, pero puede fallar por una de estas dos causas:
   - Cloudflare esta en `Flexible` y NPM esta forzando HTTPS.
   - NPM no puede resolver o alcanzar `focus-nginx:80`.
4. Como NPM ahora muestra Let's Encrypt y el sintoma es redirect loop, priorizar cambiar Cloudflare a `Full (strict)` antes de tocar redes Docker.

## Accion recomendada

1. Confirmar modo SSL/TLS en Cloudflare para `rocalian.cl`.
2. Cambiar Cloudflare a `Full (strict)` si esta en `Flexible`.
3. Confirmar que `curl http://127.0.0.1:3000/health` responde en Raspberry.
4. Confirmar que el contenedor de NPM puede llegar a `http://focus-nginx:80/health`.
5. Si no puede, conectar NPM a la red Docker de Focus o cambiar destination a `<IP-LAN-RASPBERRY>:8888`.
4. Mantener Cloudflare proxied solo en 80/443 para `focus.rocalian.cl`.
5. Probar desde fuera:

```bash
curl -I https://focus.rocalian.cl/
curl https://focus.rocalian.cl/health
```
