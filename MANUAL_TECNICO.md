# Manual Técnico - Proyecto Zonelan

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Base de Datos](#base-de-datos)
8. [API Endpoints](#api-endpoints)
9. [Frontend - Componentes Principales](#frontend---componentes-principales)
10. [Sistema de Control de Materiales](#sistema-de-control-de-materiales)
11. [Diseño Responsivo](#diseño-responsivo)
12. [Despliegue en Producción](#despliegue-en-producción)
13. [Guía de Desarrollo](#guía-de-desarrollo)
14. [Resolución de Problemas](#resolución-de-problemas)
15. [Mantenimiento](#mantenimiento)

---

## Resumen Ejecutivo

**Zonelan** es una aplicación web completa para la gestión de infraestructuras, que incluye:

- **Control de materiales e inventarios**
- **Gestión de contratos y reportes**
- **Sistema de tickets e incidencias**
- **Gestión de clientes y usuarios**
- **Almacenamiento y reportes**

### Características Principales
- ✅ **API REST completa** con Django REST Framework
- ✅ **Autenticación JWT** con tokens de acceso y refresco
- ✅ **Interfaz responsive** compatible con móviles, tablets y escritorio
- ✅ **Sistema de control de materiales** con trazabilidad
- ✅ **Gestión de archivos** para documentos y imágenes
- ✅ **Arquitectura modular** por aplicaciones Django

---

## Arquitectura del Sistema

### Arquitectura General
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │◄──►│    Backend      │◄──►│    Database     │
│   (React)       │    │   (Django)      │    │    (MySQL)      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes del Sistema

#### Backend (Django)
- **Framework**: Django 4.2+ con Django REST Framework
- **Autenticación**: JWT con `djangorestframework-simplejwt`
- **Base de datos**: MySQL 8.0+
- **Archivos estáticos**: Manejo de media files para documentos e imágenes

#### Frontend (React)
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI)
- **Estado de autenticación**: Context API con AuthProvider
- **Comunicación HTTP**: Axios con configuración centralizada
- **Responsive Design**: Hooks useMediaQuery para adaptación móvil

---

## Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Django | 4.2+ | Framework web principal |
| Django REST Framework | 3.14+ | API REST |
| djangorestframework-simplejwt | 5.2+ | Autenticación JWT |
| MySQL | 8.0+ | Base de datos |
| django-cors-headers | 4.0+ | Manejo CORS |
| Pillow | 10.0+ | Procesamiento de imágenes |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18+ | Framework frontend |
| Material-UI | 5+ | Componentes UI |
| Axios | 1.4+ | Cliente HTTP |
| React Router | 6+ | Enrutamiento |
| date-fns | 2.29+ | Manipulación de fechas |
| react-hot-toast | 2.4+ | Notificaciones |

### Herramientas de Desarrollo
- **Node.js** 18+
- **Python** 3.8+
- **npm** para gestión de dependencias frontend
- **pip** para gestión de dependencias backend

---

## Estructura del Proyecto

```
zonelan/
├── zonelan_backend/          # Backend Django
│   ├── manage.py            # Script de gestión Django
│   ├── requirements.txt     # Dependencias Python
│   ├── config/             # Configuración principal
│   │   ├── settings.py     # Configuración Django
│   │   ├── urls.py         # URLs principales
│   │   ├── wsgi.py         # WSGI para producción
│   │   └── asgi.py         # ASGI para async
│   ├── apps/               # Aplicaciones Django
│   │   ├── contracts/      # Gestión de contratos
│   │   ├── customers/      # Gestión de clientes
│   │   ├── incidents/      # Incidencias
│   │   ├── materials/      # Control de materiales
│   │   ├── reports/        # Reportes
│   │   ├── storage/        # Almacenamiento
│   │   ├── tickets/        # Sistema de tickets
│   │   └── users/          # Gestión de usuarios
│   ├── mediafiles/         # Archivos multimedia
│   └── templates/          # Plantillas HTML
└── zonelan-frontend/        # Frontend React
    ├── package.json        # Dependencias Node.js
    ├── public/             # Archivos públicos
    ├── src/                # Código fuente React
    │   ├── components/     # Componentes reutilizables
    │   ├── contexts/       # Contextos React
    │   ├── hooks/          # Hooks personalizados
    │   ├── routes/         # Componentes de rutas
    │   ├── services/       # Servicios API
    │   └── utils/          # Utilidades
    └── build/              # Archivos compilados
```

---

## Instalación y Configuración

### Requisitos Previos
- Python 3.8+
- Node.js 18+
- MySQL 8.0+
- Git

### Configuración del Backend

1. **Clonar el repositorio**
```bash
git clone https://github.com/PrincipeFelipe/zonelan.git
cd zonelan
```

2. **Crear entorno virtual**
```bash
cd zonelan_backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar base de datos**
```python
# config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'zonelan_db',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

5. **Ejecutar migraciones**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Crear superusuario**
```bash
python manage.py createsuperuser
```

7. **Iniciar servidor de desarrollo**
```bash
python manage.py runserver
```

### Configuración del Frontend

1. **Navegar al directorio frontend**
```bash
cd ../zonelan-frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```javascript
// src/services/api.js
const baseURL = 'http://localhost:8000/api/';
```

4. **Iniciar servidor de desarrollo**
```bash
npm start
```

---

## Sistema de Autenticación

### Configuración JWT

El sistema utiliza **JSON Web Tokens (JWT)** para la autenticación:

```python
# config/settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### Flujo de Autenticación

1. **Login**: Usuario envía credenciales → Recibe access_token y refresh_token
2. **Requests**: Cada petición incluye Authorization header con access_token
3. **Refresh**: Cuando access_token expira, se usa refresh_token para obtener uno nuevo
4. **Logout**: Se invalidan los tokens

### AuthContext Implementation

```javascript
// src/contexts/AuthContext.js
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const login = async (email, password) => {
    const response = await axios.post('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setToken(access);
    setUser(user);
  };
  
  // ...resto de la implementación
};
```

### Endpoints de Autenticación

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/auth/login/` | POST | Iniciar sesión |
| `/api/auth/logout/` | POST | Cerrar sesión |
| `/api/auth/refresh/` | POST | Renovar token |
| `/api/auth/user/` | GET | Obtener usuario actual |

---

## Base de Datos

### Modelos Principales

#### MaterialControl
```python
class MaterialControl(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    contract_report_id = models.IntegerField(null=True, blank=True)  # Nuevo campo
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    quantity = models.PositiveIntegerField()
    date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
```

#### Material
```python
class Material(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(MaterialCategory, on_delete=models.CASCADE)
    location = models.ForeignKey(MaterialLocation, on_delete=models.CASCADE)
    current_stock = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=0)
```

#### Contract
```python
class Contract(models.Model):
    name = models.CharField(max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
```

### Relaciones Importantes
- `MaterialControl` → `Material` (ForeignKey)
- `MaterialControl` → `User` (ForeignKey)
- `Material` → `MaterialLocation` (ForeignKey)
- `Contract` → `Customer` (ForeignKey)

---

## API Endpoints

### Autenticación
```
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/refresh/
GET  /api/auth/user/
```

### Materiales
```
GET    /api/materials/                    # Listar materiales
POST   /api/materials/                    # Crear material
GET    /api/materials/{id}/               # Detalle material
PUT    /api/materials/{id}/               # Actualizar material
DELETE /api/materials/{id}/               # Eliminar material
GET    /api/materials/{id}/history/       # Historial de material
```

### Control de Materiales
```
GET    /api/material-control/             # Listar controles
POST   /api/material-control/             # Crear control
GET    /api/material-control/{id}/        # Detalle control
PUT    /api/material-control/{id}/        # Actualizar control
DELETE /api/material-control/{id}/        # Eliminar control
```

### Contratos
```
GET    /api/contracts/                    # Listar contratos
POST   /api/contracts/                    # Crear contrato
GET    /api/contracts/{id}/               # Detalle contrato
GET    /api/contracts/{id}/reports/       # Reportes del contrato
```

### Clientes
```
GET    /api/customers/                    # Listar clientes
POST   /api/customers/                    # Crear cliente
GET    /api/customers/{id}/               # Detalle cliente
```

### Tickets
```
GET    /api/tickets/                      # Listar tickets
POST   /api/tickets/                      # Crear ticket
GET    /api/tickets/{id}/                 # Detalle ticket
PUT    /api/tickets/{id}/                 # Actualizar ticket
```

---

## Frontend - Componentes Principales

### MaterialControlList.js
**Propósito**: Mostrar lista de controles de material con diseño responsivo

```javascript
// Características principales:
- DataGrid con paginación
- Filtros por fecha y usuario
- Responsive design con useMediaQuery
- Navegación a detalles de material
- Integración con AuthContext
```

### MaterialHistory.js
**Propósito**: Mostrar historial de movimientos de un material específico

```javascript
// Características principales:
- Lista cronológica de movimientos
- Enlaces a reportes de contrato
- Información de usuario y fecha
- Navegación breadcrumb
```

### AuthContext.js
**Propósito**: Gestionar estado de autenticación global

```javascript
// Características principales:
- Persistencia de tokens en localStorage
- Refresh automático de tokens
- Interceptores Axios para autenticación
- Hooks useAuth para componentes
```

### Estructura de Componentes
```
src/
├── components/
│   ├── common/              # Componentes comunes
│   ├── materials/           # Componentes de materiales
│   ├── contracts/           # Componentes de contratos
│   ├── auth/               # Componentes de autenticación
│   └── layout/             # Componentes de layout
├── contexts/
│   └── AuthContext.js      # Contexto de autenticación
├── hooks/
│   └── useAuth.js          # Hook de autenticación
├── services/
│   └── api.js              # Configuración Axios
└── utils/
    └── helpers.js          # Funciones auxiliares
```

---

## Sistema de Control de Materiales

### Funcionalidades Principales

#### 1. Gestión de Inventario
- **Stock actual**: Control en tiempo real del stock disponible
- **Stock mínimo**: Alertas cuando el stock baja del mínimo
- **Ubicaciones**: Organización por dependencias, estanterías y baldas

#### 2. Trazabilidad de Materiales
- **Historial completo**: Todos los movimientos de entrada y salida
- **Vinculación a reportes**: Conexión con reportes de contrato mediante `contract_report_id`
- **Usuario responsable**: Registro del usuario que realiza cada movimiento

#### 3. Tipos de Movimientos
```python
REASON_CHOICES = [
    ('entry', 'Entrada'),
    ('exit', 'Salida'),
    ('adjustment', 'Ajuste'),
    ('transfer', 'Transferencia'),
    ('contract_report', 'Reporte de Contrato'),  # Nuevo
]
```

### Implementación del Campo contract_report_id

```python
# apps/materials/models.py
class MaterialControl(models.Model):
    # ...campos existentes...
    contract_report_id = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        if self.contract_report_id:
            return f"{self.material.name} - Reporte #{self.contract_report_id}"
        return f"{self.material.name} - {self.get_reason_display()}"
```

```python
# apps/materials/serializers.py
class MaterialControlSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = MaterialControl
        fields = '__all__'
```

---

## Diseño Responsivo

### Estrategia de Responsive Design

#### 1. Breakpoints Material-UI
```javascript
// Breakpoints utilizados
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,      // móviles pequeños
      sm: 600,    // móviles grandes
      md: 900,    // tablets
      lg: 1200,   // escritorio
      xl: 1536,   // escritorio grande
    },
  },
});
```

#### 2. Hook useMediaQuery
```javascript
import { useMediaQuery, useTheme } from '@mui/material';

const MaterialControlList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Configuración responsive del DataGrid
  const columns = [
    {
      field: 'material_name',
      headerName: 'Material',
      flex: 1,
      minWidth: isMobile ? 120 : 200,
    },
    // Columnas condicionales para móvil
    ...(isMobile ? [] : [
      {
        field: 'quantity',
        headerName: 'Cantidad',
        width: 100,
      }
    ]),
  ];
};
```

#### 3. Adaptaciones Móviles
- **DataGrid**: Columnas dinámicas según tamaño de pantalla
- **Navegación**: Menú hamburguesa en móviles
- **Formularios**: Campos apilados verticalmente
- **Botones**: Tamaño y espaciado adaptado

#### 4. Implementación Práctica
```javascript
// MaterialControlList.js - Responsive columns
const getColumns = () => {
  const baseColumns = [
    {
      field: 'material_name',
      headerName: 'Material',
      flex: 1,
      minWidth: isMobile ? 140 : 200,
    },
  ];

  if (!isMobile) {
    baseColumns.push(
      {
        field: 'reason',
        headerName: 'Motivo',
        width: 150,
        valueGetter: (params) => getReasonLabel(params.row.reason),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        width: 100,
      }
    );
  }

  if (isDesktop) {
    baseColumns.push(
      {
        field: 'date',
        headerName: 'Fecha',
        width: 180,
        valueGetter: (params) => format(new Date(params.row.date), 'dd/MM/yyyy HH:mm'),
      }
    );
  }

  return baseColumns;
};
```

---

## Despliegue en Producción

### Arquitectura de Producción

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│     Nginx       │◄──►│    Gunicorn     │◄──►│     MySQL       │
│  (Reverse Proxy)│    │   (WSGI Server) │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   Media Files   │
│   (CSS, JS)     │    │  (Uploads, Imgs)│
└─────────────────┘    └─────────────────┘
```

### 1. Configuración del Backend para Producción

#### settings.py para Producción
```python
# config/settings.py
import os
from decouple import config

DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
    }
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/zonelan/static/'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/zonelan/media/'

# Security
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

#### Archivo .env
```bash
DEBUG=False
SECRET_KEY=tu_clave_secreta_super_segura
DB_NAME=zonelan_production
DB_USER=zonelan_user
DB_PASSWORD=password_super_seguro
DB_HOST=localhost
DB_PORT=3306
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
```

### 2. Configuración de Gunicorn

#### gunicorn.conf.py
```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 5
user = "www-data"
group = "www-data"
tmp_upload_dir = None
secure_scheme_headers = {'X-FORWARDED-PROTO': 'https'}
```

#### Servicio systemd
```ini
# /etc/systemd/system/zonelan.service
[Unit]
Description=Zonelan Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/zonelan/zonelan_backend
Environment="PATH=/var/www/zonelan/venv/bin"
ExecStart=/var/www/zonelan/venv/bin/gunicorn config.wsgi:application -c gunicorn.conf.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. Configuración de Nginx

```nginx
# /etc/nginx/sites-available/zonelan
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend (React build)
    location / {
        root /var/www/zonelan/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/zonelan/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/zonelan/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### 4. Build del Frontend

```bash
cd zonelan-frontend

# Configurar variables de producción
# src/services/api.js
const baseURL = 'https://tu-dominio.com/api/';

# Build para producción
npm run build

# Copiar archivos al servidor
scp -r build/* usuario@servidor:/var/www/zonelan/frontend/build/
```

### 5. Comandos de Despliegue

```bash
# En el servidor
cd /var/www/zonelan/zonelan_backend

# Activar entorno virtual
source ../venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic --noinput

# Reiniciar servicios
sudo systemctl restart zonelan
sudo systemctl restart nginx
```

---

## Guía de Desarrollo

### Estándares de Código

#### Backend (Python/Django)
```python
# Convenciones de nomenclatura
class MaterialControl(models.Model):  # PascalCase para clases
    contract_report_id = models.IntegerField()  # snake_case para campos

def get_material_history(request, material_id):  # snake_case para funciones
    """Docstring descriptivo de la función."""
    pass
```

#### Frontend (JavaScript/React)
```javascript
// Convenciones de nomenclatura
const MaterialControlList = () => {  // PascalCase para componentes
  const [materialData, setMaterialData] = useState([]);  // camelCase para variables
  
  const handleMaterialClick = (id) => {  // camelCase para funciones
    // ...
  };
};
```

### Estructura de Commits
```bash
feat: añadir campo contract_report_id a MaterialControl
fix: corregir error en endpoint de historial de materiales
docs: actualizar documentación de API
style: formatear código en MaterialControlList
refactor: optimizar consultas de base de datos
test: añadir tests para autenticación JWT
```

### Branching Strategy
```
main                    # Rama principal (producción)
├── develop            # Rama de desarrollo
├── feature/material-tracking  # Nuevas características
├── hotfix/auth-bug    # Correcciones urgentes
└── release/v1.2.0     # Preparación de releases
```

### Testing

#### Backend Tests
```python
# apps/materials/tests.py
from django.test import TestCase
from rest_framework.test import APITestCase

class MaterialControlTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_material_control(self):
        url = '/api/material-control/'
        data = {
            'material': self.material.id,
            'reason': 'entry',
            'quantity': 10
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
```

#### Frontend Tests
```javascript
// src/components/__tests__/MaterialControlList.test.js
import { render, screen } from '@testing-library/react';
import MaterialControlList from '../MaterialControlList';

test('renders material control list', () => {
  render(<MaterialControlList />);
  const linkElement = screen.getByText(/control de materiales/i);
  expect(linkElement).toBeInTheDocument();
});
```

### Variables de Entorno

#### Backend (.env)
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=zonelan_db
DB_USER=zonelan_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development
```

---

## Resolución de Problemas

### Problemas Comunes del Backend

#### 1. Error de CORS
**Problema**: `Access to XMLHttpRequest blocked by CORS policy`

**Solución**:
```python
# config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
]

# Para desarrollo, puedes usar (NO recomendado para producción):
CORS_ALLOW_ALL_ORIGINS = True
```

#### 2. Error de Autenticación JWT
**Problema**: `Token is invalid or expired`

**Solución**:
```python
# Verificar configuración JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

#### 3. Error de Base de Datos
**Problema**: `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server")`

**Solución**:
```bash
# Verificar que MySQL está ejecutándose
sudo systemctl status mysql

# Verificar credenciales en settings.py
# Verificar que la base de datos existe
mysql -u root -p
CREATE DATABASE zonelan_db;
```

### Problemas Comunes del Frontend

#### 1. Error de Compilación - AuthContext
**Problema**: `AuthContext is not defined`

**Solución**:
```javascript
// App.js
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Resto de la aplicación */}
      </Router>
    </AuthProvider>
  );
}
```

#### 2. Error 404 en Rutas
**Problema**: Rutas del frontend devuelven 404 en producción

**Solución**:
```nginx
# Configuración Nginx
location / {
    try_files $uri $uri/ /index.html;  # Fallback a index.html
}
```

#### 3. Error de Axios - Network Error
**Problema**: `Network Error` en peticiones API

**Solución**:
```javascript
// src/services/api.js
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/',
  timeout: 10000,
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Manejar token expirado
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Logs y Debugging

#### Backend Logs
```python
# config/settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

#### Frontend Debugging
```javascript
// Activar logs detallados
if (process.env.NODE_ENV === 'development') {
  console.log('API Response:', response.data);
}

// React Developer Tools
// Instalar extensión del navegador para debugging
```

---

## Mantenimiento

### Backup de Base de Datos

```bash
# Backup completo
mysqldump -u usuario -p zonelan_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup con compresión
mysqldump -u usuario -p zonelan_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restaurar backup
mysql -u usuario -p zonelan_db < backup_file.sql
```

### Backup de Archivos Media
```bash
# Crear backup de archivos multimedia
tar -czf media_backup_$(date +%Y%m%d).tar.gz /var/www/zonelan/media/

# Sincronizar a servidor remoto
rsync -av /var/www/zonelan/media/ usuario@backup-server:/backups/zonelan/media/
```

### Actualizaciones del Sistema

#### Actualizar Dependencias Backend
```bash
cd zonelan_backend
source venv/bin/activate

# Verificar dependencias desactualizadas
pip list --outdated

# Actualizar requirements.txt
pip freeze > requirements.txt

# Ejecutar migraciones si es necesario
python manage.py migrate
```

#### Actualizar Dependencias Frontend
```bash
cd zonelan-frontend

# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias
npm update

# Rebuild para producción
npm run build
```

### Monitoreo y Métricas

#### Logs de Aplicación
```bash
# Ver logs de Django
tail -f /var/log/django/app.log

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Ver logs de Gunicorn
journalctl -u zonelan -f
```

#### Métricas de Performance
```python
# Django Debug Toolbar para desarrollo
INSTALLED_APPS = [
    # ...
    'debug_toolbar',
]

MIDDLEWARE = [
    # ...
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]
```

### Tareas de Mantenimiento Programadas

#### Crontab para Backups Automáticos
```bash
# crontab -e
# Backup diario a las 2:00 AM
0 2 * * * /path/to/backup_script.sh

# Limpieza de logs semanalmente
0 0 * * 0 find /var/log/django/ -name "*.log" -mtime +30 -delete
```

#### Script de Backup Automatizado
```bash
#!/bin/bash
# backup_script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/zonelan"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u zonelan_user -p$DB_PASSWORD zonelan_db | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup de archivos media
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/zonelan/media/

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

---

## Información de Contacto y Soporte

### Documentación Adicional
- **Django Documentation**: https://docs.djangoproject.com/
- **React Documentation**: https://reactjs.org/docs/
- **Material-UI Documentation**: https://mui.com/

### Estructura del Equipo de Desarrollo
- **Backend Developer**: Responsable de APIs y lógica de negocio
- **Frontend Developer**: Responsable de interfaz de usuario y UX
- **DevOps Engineer**: Responsable de despliegue y infraestructura
- **QA Tester**: Responsable de testing y calidad

### Convenciones de Documentación
- Actualizar este manual con cada cambio significativo
- Documentar nuevos endpoints en la sección de API
- Incluir ejemplos de código para nuevas funcionalidades
- Mantener changelog de versiones

---

**Última actualización**: 16 de julio de 2025  
**Versión del manual**: 1.0  
**Proyecto**: Zonelan - Sistema de Gestión de Infraestructuras
