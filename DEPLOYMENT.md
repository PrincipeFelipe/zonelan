# 🚀 Guía de Despliegue - Zonelan

Sistema de gestión empresarial para control de personal, material y facturación.

## 📋 Requisitos del Servidor

### Sistema Operativo
- **Debian 12** (recomendado)
- **Ubuntu 20.04+** (alternativo)

### Software Necesario
- **Python 3.9+**
- **Node.js 16+** y **npm**
- **MariaDB 10.6+**
- **Nginx**
- **Git**

## 🔧 Configuración del Servidor

### 1. Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar dependencias
```bash
sudo apt install -y python3 python3-pip python3-venv nodejs npm mariadb-server nginx git curl
```

### 3. Configurar MariaDB
```bash
sudo mysql_secure_installation

# Crear base de datos y usuario
sudo mysql -u root -p
```

```sql
CREATE DATABASE db_zonelan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zonelan_user'@'localhost' IDENTIFIED BY 'tu_password_segura_aqui';
GRANT ALL PRIVILEGES ON db_zonelan.* TO 'zonelan_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🚀 Despliegue Automático

### 1. Clonar el repositorio
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/PrincipeFelipe/zonelan.git
sudo chown -R $USER:$USER /var/www/zonelan
cd zonelan
```

### 2. Configurar variables de entorno
```bash
cd zonelan_backend
cp .env.example .env
nano .env
```

**Configurar las siguientes variables en `.env`:**
```bash
# Base de datos
DB_NAME=db_zonelan
DB_USER=zonelan_user
DB_PASSWORD=tu_password_segura_aqui
DB_HOST=localhost
DB_PORT=3306

# Django - GENERAR UNA NUEVA SECRET_KEY
SECRET_KEY=tu-clave-super-secreta-generada-aleatoriamente
DEBUG=False
```

### 3. Ejecutar script de despliegue
```bash
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuración Manual (si el script automático falla)

### Backend (Django)

```bash
cd /var/www/zonelan/zonelan_backend

# Crear entorno virtual
python3 -m venv /var/www/zonelan/venv
source /var/www/zonelan/venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage.py migrate
python manage.py collectstatic --noinput

# Crear superusuario
python manage.py createsuperuser
```

### Frontend (React)

```bash
cd /var/www/zonelan/zonelan-frontend

# Instalar dependencias
npm install

# Construir para producción
npm run build
```

### Configurar Nginx

```bash
sudo cp /var/www/zonelan/nginx.conf /etc/nginx/sites-available/zonelan
sudo ln -s /etc/nginx/sites-available/zonelan /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Configurar Gunicorn

```bash
sudo cp /var/www/zonelan/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn
```

## 🔧 Configuración de Cloudflare Tunnel

### 1. Instalar cloudflared
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 2. Configurar tunnel
```bash
cloudflared tunnel login
cloudflared tunnel create zonelan
cloudflared tunnel route dns zonelan gestor.zonelan.cloud
```

### 3. Crear archivo de configuración
```bash
mkdir ~/.cloudflared
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: tu-tunnel-id
credentials-file: /home/tu-usuario/.cloudflared/tu-tunnel-id.json

ingress:
  - hostname: gestor.zonelan.cloud
    service: http://localhost:80
  - service: http_status:404
```

### 4. Iniciar tunnel como servicio
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 🔐 Configuraciones de Seguridad

### 1. Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

### 2. Permisos de archivos
```bash
sudo chown -R www-data:www-data /var/www/zonelan
sudo chmod -R 755 /var/www/zonelan
sudo chmod -R 775 /var/www/zonelan/zonelan_backend/mediafiles
```

### 3. SSL (manejado por Cloudflare)
El SSL es manejado automáticamente por Cloudflare Tunnel.

## 📝 Comandos de Mantenimiento

### Ver logs
```bash
# Logs de Django
sudo journalctl -u gunicorn -f

# Logs de Nginx
sudo tail -f /var/log/nginx/zonelan_access.log
sudo tail -f /var/log/nginx/zonelan_error.log

# Logs de Cloudflare
sudo journalctl -u cloudflared -f
```

### Actualizar aplicación
```bash
cd /var/www/zonelan
git pull origin main
cd zonelan_backend
source /var/www/zonelan/venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
cd ../zonelan-frontend
npm install
npm run build
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### Backup de base de datos
```bash
mysqldump -u zonelan_user -p db_zonelan > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 Solución de Problemas

### Error de permisos de logging Django
```bash
# 1. Agregar usuario al grupo www-data
sudo usermod -a -G www-data $USER

# 2. Ajustar permisos del directorio de logs
sudo chmod 775 /var/log/gunicorn
sudo chmod 664 /var/log/gunicorn/django_errors.log

# 3. Cerrar sesión SSH y volver a conectar para que los cambios de grupo tengan efecto
exit
# Reconectar por SSH

# 4. Verificar que ahora puedes ejecutar comandos Django
cd /var/www/zonelan/zonelan_backend
source /var/www/zonelan/venv/bin/activate
python manage.py check --deploy
```

### Error frontend no construido
```bash
cd /var/www/zonelan/zonelan-frontend
npm install
npm run build

# Verificar que se creó el directorio build
ls -la build/
```

### Error 502 Bad Gateway
```bash
sudo systemctl status gunicorn
sudo systemctl restart gunicorn
```

### Error de permisos
```bash
sudo chown -R www-data:www-data /var/www/zonelan
sudo chmod -R 755 /var/www/zonelan
```

### Error de base de datos
```bash
cd /var/www/zonelan/zonelan_backend
source /var/www/zonelan/venv/bin/activate
python manage.py migrate
```

## 📞 Soporte

Para problemas técnicos o dudas sobre el despliegue, revisar los logs y verificar que todos los servicios estén ejecutándose correctamente.

### Verificar servicios
```bash
sudo systemctl status nginx
sudo systemctl status gunicorn
sudo systemctl status cloudflared
sudo systemctl status mariadb
```

## 🎯 Pasos Finales de Despliegue en el Servidor

### Ejecutar estos comandos en el servidor:

1. **Actualizar el código desde GitHub:**
```bash
cd /var/www/zonelan
git pull origin main
```

2. **Construir el frontend actualizado:**
```bash
cd /var/www/zonelan/zonelan-frontend
npm install
npm run build
```

3. **Generar y configurar SECRET_KEY segura:**
```bash
cd /var/www/zonelan/zonelan_backend
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# Copiar la clave generada y agregarla al archivo .env
nano .env
# Agregar: SECRET_KEY=la-clave-generada-aqui
```

4. **Ejecutar migraciones y collectstatic:**
```bash
source /var/www/zonelan/venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

5. **Reiniciar servicios:**
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

6. **Verificar que todo funciona:**
```bash
python manage.py check --deploy
curl -I https://gestor.zonelan.cloud
```

## 🎯 URL de Acceso

Una vez completado el despliegue, la aplicación estará disponible en:
**https://gestor.zonelan.cloud**

### Credenciales por defecto
- **Usuario:** admin
- **Contraseña:** La que configures durante `createsuperuser`
