from django.apps import AppConfig


class IncidentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.incidents'  # Modificar esta línea para incluir el prefijo 'apps.'
