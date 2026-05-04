#!/bin/bash

# Focus AI Studio - Script de inicio
# Este script inicia la aplicación en modo producción

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Construyendo la aplicación...${NC}"

# Limpiar puerto 3000 si está en uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Puerto 3000 en uso, liberando...${NC}"
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  sleep 1
fi

# Build de producción
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error en el build${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build completado${NC}"
echo -e "${YELLOW}🚀 Iniciando servidor en puerto 3000...${NC}"
echo -e "   📱 Aplicación disponible en: ${GREEN}http://localhost:3000${NC}"
echo -e "   🏠 Landing page: ${GREEN}http://localhost:3000/${NC}"
echo -e "   🔐 Login: ${GREEN}http://localhost:3000/login${NC}"
echo -e "   📊 Dashboard: ${GREEN}http://localhost:3000/dashboard${NC}"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
echo ""

npm start
