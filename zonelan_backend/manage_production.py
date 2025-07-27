#!/usr/bin/env python
"""
Script de gestión de Django configurado para producción
"""
import os
import sys

if __name__ == '__main__':
    # Configurar el módulo de configuración por defecto
    # En producción, usar config.production
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.production')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
