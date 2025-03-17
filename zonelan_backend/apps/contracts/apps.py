from django.apps import AppConfig


class ContractsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.contracts'  # Cambiado desde 'contracts' para incluir el prefijo 'apps.'
    verbose_name = 'Gestión de Contratos'
