#!/bin/bash

# Focus AI Studio - Instalación en Raspberry Pi (o cualquier Linux)
# Este script instala Node.js, Docker (opcional) y despliega la aplicación

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Focus AI Studio - Instalador para Raspberry Pi${NC}\n"

# Check if running as root (needed for Docker)
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Se recomienda ejecutar como root (sudo) para instalar Docker${NC}"
  SUDO="sudo"
else
  SUDO=""
fi

# 1. Verify Node.js
echo -e "${YELLOW}1/5 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | sed 's/v//')" -lt 20 ]; then
  echo -e "${YELLOW}   Instalando Node.js 20 (usando nvm)...${NC}"
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  nvm install 20
  nvm use 20
  echo -e "${GREEN}   ✓ Node.js instalado${NC}"
else
  echo -e "${GREEN}   ✓ Node.js $(node -v) ya instalado${NC}"
fi

# 2. Install dependencies
echo -e "\n${YELLOW}2/5 Instalando dependencias...${NC}"
npm install
echo -e "${GREEN}   ✓ Dependencias instaladas${NC}"

# 3. Configure environment
echo -e "\n${YELLOW}3/5 Configurando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}   ✓ Archivo .env creado${NC}"
  echo -e "\n${YELLOW}   ⚠️  IMPORTANTE: Edita .env y agrega tu SEATGEEK_CLIENT_ID${NC}"
  echo -e "   Consigue tu API key gratis en: https://platform.seatgeek.com/\n"
else
  echo -e "${GREEN}   ✓ .env ya existe${NC}"
fi

# 4. Build the app
echo -e "\n${YELLOW}4/5 Construyendo la aplicación...${NC}"
npm run build
echo -e "${GREEN}   ✓ Build completado${NC}"

# 5. Offer Docker or direct start
echo -e "\n${YELLOW}5/5 Despliegue${NC}"
echo "Selecciona cómo desplegar:"
echo "  1) Usar Docker (recomendado para producción)"
echo "  2) Iniciar directamente con Node.js (desarrollo)"
read -p "Opción [1-2]: " choice

case $choice in
  1)
    echo -e "\n${YELLOW}Instalando Docker...${NC}"
    if ! command -v docker &> /dev/null; then
      $SUDO apt-get update
      $SUDO apt-get install -y docker.io
      $SUDO systemctl enable --now docker
      $SUDO usermod -aG docker $USER
      echo -e "${GREEN}   ✓ Docker instalado${NC}"
      echo -e "${YELLOW}   ⚠️  Necesitas reiniciar la sesión para usar docker sin sudo${NC}"
    else
      echo -e "${GREEN}   ✓ Docker ya instalado${NC}"
    fi
    
    echo -e "\n${YELLOW}Construyendo imagen Docker...${NC}"
    $SUDO docker-compose build
    echo -e "${GREEN}   ✓ Imagen construida${NC}"
    
    echo -e "\n${YELLOW}Iniciando contenedores...${NC}"
    $SUDO docker-compose up -d
    echo -e "${GREEN}   ✓ Contenedores ejecutándose${NC}"
    
    echo -e "\n${GREEN}✅ Despliegue completado!${NC}"
    echo -e "   Aplicación: http://$(hostname -I | awk '{print $1}'):3002"
    echo -e "   (O usa http://localhost:3002)\n"
    ;;
  2)
    echo -e "\n${YELLOW}Iniciando servidor en segundo plano...${NC}"
    nohup node server.js > /tmp/focus.log 2>&1 &
    echo $! > focus.pid
    echo -e "${GREEN}   ✓ Servidor iniciado (PID $(cat focus.pid))${NC}"
    echo -e "\n${GREEN}✅ Aplicación corriendo en http://localhost:3000${NC}\n"
    ;;
  *)
    echo -e "${RED}Opción inválida${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}🎉 ¡Listo! Focus AI Studio está funcionando${NC}\n"
echo "Comandos útiles:"
echo "  Ver logs:    tail -f /tmp/focus.log  (modo directo)"
echo "  Detener:    kill \$(cat focus.pid)  (modo directo)"
echo "  Docker:     sudo docker-compose logs -f"
echo "  Docker stop: sudo docker-compose down\n"
