"""
Configuración para desarrollo local
"""
from .settings import *

# Configuración de desarrollo
DEBUG = True
SECRET_KEY = 'django-insecure-dev-key-change-in-production'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# Base de datos para desarrollo (SQLite por simplicidad)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# En desarrollo, permitir todos los orígenes CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Deshabilitar HTTPS en desarrollo
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Configuración de emails para desarrollo (enviar a consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Configuración de logging más detallada para desarrollo
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
