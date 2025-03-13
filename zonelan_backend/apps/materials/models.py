from django.db import models
from apps.users.models import User
# Usar referencia de string para evitar importación circular
# No importar: from apps.tickets.models import Ticket

class Material(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nombre')
    quantity = models.IntegerField(verbose_name='Cantidad')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio')

    class Meta:
        verbose_name = 'Material'
        verbose_name_plural = 'Materiales'

    def __str__(self):
        return self.name

    # Añadir este método al modelo Material
    @property
    def stock_by_location(self):
        """Devuelve un diccionario con el stock por ubicación"""
        locations = self.locations.all().select_related('tray', 'tray__shelf', 'tray__shelf__department', 'tray__shelf__department__warehouse')
        return [
            {
                'location_id': loc.id,
                'warehouse': loc.tray.shelf.department.warehouse.name,
                'department': loc.tray.shelf.department.name,
                'shelf': loc.tray.shelf.name,
                'tray': loc.tray.name,
                'full_code': loc.tray.get_full_code(),
                'quantity': loc.quantity,
                'minimum_quantity': loc.minimum_quantity
            }
            for loc in locations
        ]

class MaterialControl(models.Model):
    OPERATION_CHOICES = [
        ('ADD', 'Entrada'),
        ('REMOVE', 'Salida'),
        ('TRANSFER', 'Traslado'),  # Añadir esta opción
    ]
    
    REASON_CHOICES = [
        ('COMPRA', 'Compra'),
        ('DEVOLUCION', 'Devolución'),
        ('RETIRADA', 'Retirada'),
        ('VENTA', 'Venta'),
        ('USO', 'Uso'),
        ('TRASLADO', 'Traslado'),  # Añadir esta opción para razones
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Usuario')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='Material')
    quantity = models.IntegerField(verbose_name='Cantidad')
    operation = models.CharField(
        max_length=10, 
        choices=OPERATION_CHOICES, 
        default='ADD',
        verbose_name='Operación'
    )
    reason = models.CharField(
        max_length=20,
        choices=REASON_CHOICES,
        default='COMPRA',
        verbose_name='Motivo'
    )
    report = models.ForeignKey(
        'reports.WorkReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='material_controls',
        verbose_name='Reporte asociado'
    )
    # Añadir campo para ticket usando string reference
    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='material_controls',
        verbose_name='Ticket asociado'
    )
    invoice_image = models.ImageField(
        upload_to='material_invoices/',
        null=True,
        blank=True,
        verbose_name='Imagen de albarán'
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha')
    
    # Añadir campo para referencia de ubicación
    location_reference = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name="Referencia de ubicación"
    )
    
    # Comentar o eliminar temporalmente esta FK
    # movement = models.ForeignKey(
    #     'storage.MaterialMovement',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='material_controls',
    #     verbose_name='Movimiento asociado'
    # )
    
    # Mantener este campo simple
    movement_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='ID del movimiento asociado'
    )

    class Meta:
        verbose_name = 'Control de Material'
        verbose_name_plural = 'Control de Materiales'

    def __str__(self):
        if self.operation == 'ADD':
            operation_text = 'Entrada'
        elif self.operation == 'REMOVE':
            operation_text = 'Salida'
        elif self.operation == 'TRANSFER':
            operation_text = 'Traslado'
        else:
            operation_text = self.operation
        
        reason_text = dict(self.REASON_CHOICES).get(self.reason, self.reason)
        
        # Referencias a reportes o tickets
        ref_text = ""
        if self.report:
            try:
                ref_text = f" - Reporte #{self.report.id}"
            except:
                ref_text = " - Reporte (eliminado)"
        
        if self.ticket:
            try:
                ref_text = f" - Ticket #{self.ticket.id}"
            except:
                ref_text = " - Ticket (eliminado)"
        
        has_invoice = " [Con albarán]" if self.invoice_image else ""
        
        # Añadir referencia de ubicación si existe
        location_text = f" - {self.location_reference}" if self.location_reference else ""
        
        return f"{self.material.name} - {operation_text} ({reason_text}){ref_text}{location_text}{has_invoice} - {self.date.strftime('%d/%m/%Y %H:%M')}"
    
    def get_movement(self):
        """
        Obtiene el objeto MaterialMovement relacionado si existe
        """
        if not self.movement_id:
            return None
            
        # Import inside the method to avoid circular imports
        from apps.storage.models import MaterialMovement
        
        try:
            return MaterialMovement.objects.get(id=self.movement_id)
        except MaterialMovement.DoesNotExist:
            return None
