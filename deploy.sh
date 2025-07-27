#!/bin/bash

# Script de despliegue para Zonelan
# Ejecutar como: ./deploy.sh

echo "🚀 Iniciando despliegue de Zonelan..."

# Variables
PROJECT_DIR="/var/www/zonelan"
BACKEND_DIR="$PROJECT_DIR/zonelan_backend"
FRONTEND_DIR="$PROJECT_DIR/zonelan-frontend"
VENV_DIR="$PROJECT_DIR/venv"

# Crear directorios si no existen
sudo mkdir -p $PROJECT_DIR

# Clonar o actualizar repositorio
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "📦 Actualizando repositorio..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "📦 Clonando repositorio..."
    sudo git clone https://github.com/PrincipeFelipe/zonelan.git $PROJECT_DIR
fi

cd $PROJECT_DIR

# Configurar backend
echo "⚙️ Configurando backend..."
cd $BACKEND_DIR

# Crear entorno virtual si no existe
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv $VENV_DIR
fi

# Activar entorno virtual
source $VENV_DIR/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
if [ ! -f ".env" ]; then
    echo "⚠️ Creando archivo .env - ¡CONFIGURA LAS VARIABLES!"
    cp .env.example .env
fi

# Migraciones de base de datos
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic --noinput

# Configurar frontend
echo "⚙️ Configurando frontend..."
cd $FRONTEND_DIR

# Instalar dependencias de Node.js
npm install

# Construir para producción
npm run build

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl restart nginx
sudo systemctl restart gunicorn

echo "✅ Despliegue completado!"
echo "🌐 La aplicación debería estar disponible en: https://gestor.zonelan.cloud"
