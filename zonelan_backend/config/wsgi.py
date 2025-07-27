import os
from django.core.wsgi import get_wsgi_application

# Configurar el módulo de configuración
# En producción se debe usar config.production
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()