#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# AgroFlow – Script de despliegue en Ubuntu Server
# Ejecutar en el servidor: bash deploy.sh
# ─────────────────────────────────────────────────────────────────
set -e

APP_DIR="/opt/agroflow"
REPO_DIR="$(pwd)"   # directorio desde donde se ejecuta el script

echo "━━━ 1/5  Verificando Docker ━━━"
if ! command -v docker &> /dev/null; then
  echo "Instalando Docker…"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "⚠  Cierra sesión y vuelve a entrar para que surta efecto el grupo docker"
fi
docker --version
docker compose version

echo "━━━ 2/5  Creando directorio /opt/agroflow ━━━"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

echo "━━━ 3/5  Copiando archivos ━━━"
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='app' \
  --exclude='screens' \
  --exclude='*.html' \
  "$REPO_DIR/" "$APP_DIR/"

echo "━━━ 4/5  Configurando .env ━━━"
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "⚠  EDITA $APP_DIR/.env antes de continuar:"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Variables a rellenar:"
  echo "   • POSTGRES_PASSWORD   — contraseña de la base de datos"
  echo "   • JWT_SECRET          — secreto para tokens (cualquier string largo)"
  echo "   • HA_URL              — URL de tu Home Assistant"
  echo "   • HA_TOKEN            — Long-lived access token de HA"
  echo "   • VITE_API_URL        — http://TU_IP_O_DOMINIO:3001"
  echo ""
  read -p "¿Ya editaste el .env? (s/N): " ans
  [[ "$ans" != "s" && "$ans" != "S" ]] && { echo "Abortado."; exit 1; }
fi

echo "━━━ 5/5  Levantando contenedores ━━━"
cd $APP_DIR
docker compose pull db 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "✅  AgroFlow desplegado:"
echo "   Frontend  → http://$(hostname -I | awk '{print $1}'):3000"
echo "   Backend   → http://$(hostname -I | awk '{print $1}'):3001/api/health"
echo ""
echo "Logs en tiempo real: docker compose -f $APP_DIR/docker-compose.yml logs -f"
