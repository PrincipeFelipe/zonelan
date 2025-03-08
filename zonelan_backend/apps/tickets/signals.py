from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import TicketItem

# Señales para actualizar el total del ticket cuando se modifican sus items
@receiver(post_save, sender=TicketItem)
def update_ticket_total_on_item_save(sender, instance, created, **kwargs):
    """Actualiza el total del ticket cuando se guarda un ítem"""
    instance.ticket.update_total()

@receiver(post_delete, sender=TicketItem)
def update_ticket_total_on_item_delete(sender, instance, **kwargs):
    """Actualiza el total del ticket cuando se elimina un ítem"""
    # Verificar que el ticket aún existe antes de actualizar
    if hasattr(instance, 'ticket') and instance.ticket:
        instance.ticket.update_total()