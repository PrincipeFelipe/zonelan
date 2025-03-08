from django.apps import AppConfig

class TicketsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tickets'
    verbose_name = 'Tickets de venta'
    
    def ready(self):
        #import apps.tickets.signals  # Para cargar las señales si las tuvieras
        pass
