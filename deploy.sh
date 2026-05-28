#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# IrrigAItion – Script de despliegue en Ubuntu Server
# Uso:
#   Primera vez:  bash deploy.sh
#   Actualizar:   bash deploy.sh --update
# ─────────────────────────────────────────────────────────────────
set -e

APP_DIR="/opt/agroflow"
REPO_URL="https://github.com/domoticasalve/IrrigAItion.git"

echo "━━━ 1/4  Verificando Docker ━━━"
if ! command -v docker &> /dev/null; then
  echo "Instalando Docker…"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "⚠  Cierra sesión y vuelve a entrar para aplicar el grupo docker, luego vuelve a ejecutar este script."
  exit 0
fi
docker --version
docker compose version

echo "━━━ 2/4  Preparando $APP_DIR ━━━"
if [ ! -d "$APP_DIR/.git" ]; then
  # Primera instalación: clonar directamente en /opt/agroflow
  sudo git clone "$REPO_URL" "$APP_DIR"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  echo "Repositorio clonado en $APP_DIR"
else
  # Actualización: pull
  echo "Actualizando repositorio…"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  git -C "$APP_DIR" pull origin main
fi

echo "━━━ 3/4  Configurando .env ━━━"
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "⚠  Rellena las variables en $APP_DIR/.env antes de continuar:"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Variables obligatorias:"
  echo "   • POSTGRES_PASSWORD   — contraseña de la base de datos"
  echo "   • JWT_SECRET          — string largo aleatorio"
  echo "   • HA_URL              — URL de Home Assistant  (ej: http://192.168.1.x:8123)"
  echo "   • HA_TOKEN            — Long-lived access token de HA"
  echo "   • VITE_API_URL        — URL pública del backend (ej: http://192.168.1.x:3001)"
  echo ""
  read -rp "¿Ya editaste el .env? (s/N): " ans
  [[ "$ans" != "s" && "$ans" != "S" ]] && { echo "Abortado. Edita el .env y vuelve a ejecutar."; exit 1; }
fi

echo "━━━ 4/4  Levantando contenedores ━━━"
cd "$APP_DIR"
docker compose pull db 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "✅  IrrigAItion desplegado en $APP_DIR"
echo "   Frontend  → http://$(hostname -I | awk '{print $1}'):3000"
echo "   Backend   → http://$(hostname -I | awk '{print $1}'):3001/api/health"
echo ""
echo "Comandos útiles:"
echo "   Logs:      docker compose -C $APP_DIR logs -f"
echo "   Parar:     docker compose -C $APP_DIR down"
echo "   Actualizar: bash $APP_DIR/deploy.sh --update"
