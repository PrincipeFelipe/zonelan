from django.db import models
from apps.users.models import User

class Material(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nombre')
    quantity = models.IntegerField(verbose_name='Cantidad')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio')

    class Meta:
        verbose_name = 'Material'
        verbose_name_plural = 'Materiales'

    def __str__(self):
        return self.name

class MaterialControl(models.Model):
    OPERATION_CHOICES = [
        ('ADD', 'Añadir'),
        ('REMOVE', 'Quitar'),
    ]
    
    REASON_CHOICES = [
        ('COMPRA', 'Compra'),
        ('VENTA', 'Venta'),
        ('RETIRADA', 'Retirada'),
        ('USO', 'Uso en reporte'),
        ('DEVOLUCION', 'Devolución')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Usuario')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='Material')
    quantity = models.IntegerField(verbose_name='Cantidad')
    operation = models.CharField(
        max_length=6, 
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
    invoice_image = models.ImageField(
        upload_to='material_invoices/',
        null=True,
        blank=True,
        verbose_name='Imagen de albarán'
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha')

    class Meta:
        verbose_name = 'Control de Material'
        verbose_name_plural = 'Control de Materiales'

    def __str__(self):
        operation_text = 'Entrada' if self.operation == 'ADD' else 'Salida'
        reason_text = dict(self.REASON_CHOICES).get(self.reason, self.reason)
        report_text = f" - Reporte #{self.report.id}" if self.report else ""
        has_invoice = " [Con albarán]" if self.invoice_image else ""
        return f"{self.material.name} - {operation_text} ({reason_text}){report_text}{has_invoice} - {self.date.strftime('%d/%m/%Y %H:%M')}"
