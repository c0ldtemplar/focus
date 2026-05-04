#!/bin/bash

# Focus AI Studio - Script de inicio
# Este script inicia la aplicación en modo producción

echo "🔄 Construyendo la aplicación..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error en el build"
  exit 1
fi

echo "🚀 Iniciando servidor en puerto 3000..."
echo "   Aplicación disponible en: http://localhost:3000"
echo "   Landing page: http://localhost:3000/"
echo "   Login: http://localhost:3000/login"
echo "   Dashboard: http://localhost:3000/dashboard"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

npm start
