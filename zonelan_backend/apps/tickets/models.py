from django.db import models
from django.conf import settings  # Importa settings
from django.utils import timezone
from apps.customers.models import Customer
from apps.materials.models import Material
from apps.materials.models import MaterialControl
from django.db import models, transaction
import uuid

class Ticket(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pendiente'),
        ('PAID', 'Pagado'),
        ('CANCELED', 'Cancelado'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Efectivo'),
        ('CARD', 'Tarjeta'),
        ('TRANSFER', 'Transferencia'),
        ('OTHER', 'Otro'),
    )
    
    id = models.AutoField(primary_key=True)
    ticket_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.PROTECT, 
        related_name='tickets',
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # Uso de settings.AUTH_USER_MODEL en lugar de User
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Cambiado de User a settings.AUTH_USER_MODEL
        on_delete=models.PROTECT,
        related_name='created_tickets'
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        default='CASH'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    notes = models.TextField(blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    pdf_file = models.FileField(
        upload_to='tickets/',
        null=True,
        blank=True
    )
    is_deleted = models.BooleanField(default=False, verbose_name="Eliminado")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de eliminación")
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            # Generar número de ticket: TK-YYYYMMDD-XXXX
            today = timezone.now()
            date_part = today.strftime('%Y%m%d')
            
            # Buscar el último ticket del día
            last_ticket = Ticket.objects.filter(
                ticket_number__startswith=f'TK-{date_part}'
            ).order_by('-ticket_number').first()
            
            if last_ticket:
                # Extraer el número secuencial del último ticket
                try:
                    seq = int(last_ticket.ticket_number.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
                
            self.ticket_number = f'TK-{date_part}-{seq:04d}'
        
        # Actualizar campos de estado
        if self.status == 'PAID' and not self.paid_at:
            self.paid_at = timezone.now()
        elif self.status == 'CANCELED' and not self.canceled_at:
            self.canceled_at = timezone.now()
            
        super().save(*args, **kwargs)
    
    def update_total(self):
        """Actualiza el total del ticket basado en los items"""
        total = sum(item.total_price for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=['total_amount'])
    
    def __str__(self):
        if self.customer:
            return f"{self.ticket_number} - {self.customer.name}"
        return self.ticket_number
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'


class TicketItem(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='items'
    )
    material = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        related_name='ticket_items'
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    notes = models.CharField(max_length=255, blank=True, null=True)
    
    # Añadir campo para la referencia a la ubicación
    location_source = models.CharField(max_length=255, blank=True, null=True,
                             verbose_name="Ubicación de origen", help_text="Ruta completa de la ubicación de origen")
    
    @property
    def total_price(self):
        """Calcula el precio total con descuento"""
        price = self.quantity * self.unit_price
        if self.discount_percentage:
            discount = price * (self.discount_percentage / 100)
            price = price - discount
        return price
    
    # Simplificar el método save para evitar el problema de duplicidad
    def save(self, *args, **kwargs):
        # Si es una creación nueva, verificamos el precio actual del material
        if not self.pk and not self.unit_price:
            self.unit_price = self.material.price
        
        # Guardar el item    
        super().save(*args, **kwargs)
        
        # Actualizar total del ticket
        if self.ticket:
            self.ticket.update_total()
    
    # Mantener el método delete para devolver material al inventario
    @transaction.atomic
    def delete(self, *args, **kwargs):
        # Solo devolver el material si el ticket no está cancelado
        if self.ticket and self.ticket.status != 'CANCELED':
            if self.material and self.quantity:
                self.material.quantity += self.quantity
                self.material.save(update_fields=['quantity'])
        
        # Eliminar el item
        super().delete(*args, **kwargs)
        
        # Actualizar total del ticket si aún existe
        if self.ticket and Ticket.objects.filter(id=self.ticket.id).exists():
            self.ticket.update_total()
    
    def __str__(self):
        return f"{self.material.name} ({self.quantity})"
    
    class Meta:
        verbose_name = 'Item de ticket'
        verbose_name_plural = 'Items de ticket'
