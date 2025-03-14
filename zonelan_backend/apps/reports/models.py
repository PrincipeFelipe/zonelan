from django.db import models
from apps.users.models import User
from apps.incidents.models import Incident
from apps.materials.models import Material
from django.core.exceptions import ValidationError
import os

class WorkReport(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Borrador'),
        ('COMPLETED', 'Completado'),
        ('DELETED', 'Eliminado')
    ]

    date = models.DateField(verbose_name='Fecha')
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='work_reports',
        verbose_name='Incidencia'
    )
    description = models.TextField(verbose_name='Descripción del trabajo')
    hours_worked = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Horas trabajadas',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name='Estado'
    )
    is_deleted = models.BooleanField(default=False, verbose_name='Eliminado')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de eliminación')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Parte de trabajo'
        verbose_name_plural = 'Partes de trabajo'
        ordering = ['-date']

    def __str__(self):
        return f"Parte {self.id} - {self.incident.title} ({self.date})"

    def clean(self):
        if self.status == 'COMPLETED' and not self.hours_worked:
            raise ValidationError({
                'hours_worked': 'Las horas trabajadas son obligatorias cuando el parte está completado.'
            })
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def before_images(self):
        return self.images.filter(image_type='BEFORE')

    @property
    def after_images(self):
        return self.images.filter(image_type='AFTER')

class ReportImage(models.Model):
    report = models.ForeignKey(
        WorkReport,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Parte de trabajo'
    )
    image = models.ImageField(upload_to='report_images/')
    image_type = models.CharField(
        max_length=10,
        choices=[('BEFORE', 'Antes'), ('AFTER', 'Después')],
        default='BEFORE'
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Imagen del parte'
        verbose_name_plural = 'Imágenes del parte'

    def __str__(self):
        return f"Imagen {self.id} - Parte {self.report.id} ({self.get_image_type_display()})"

    def delete(self, *args, **kwargs):
        """Sobrescribe el método delete para eliminar también el archivo físico"""
        # Guardar la ruta del archivo antes de eliminarlo de la base de datos
        if self.image:
            try:
                image_path = self.image.path
            except Exception:
                image_path = None
        else:
            image_path = None
            
        # Llamar al método delete original
        result = super().delete(*args, **kwargs)
        
        # Eliminar el archivo físico si existe
        if image_path and os.path.isfile(image_path):
            try:
                os.remove(image_path)
                # Intenta eliminar el directorio si está vacío
                directory = os.path.dirname(image_path)
                if os.path.exists(directory) and not os.listdir(directory):
                    os.rmdir(directory)
            except OSError as e:
                print(f"Error al eliminar el archivo físico: {e}")
                
        return result

class TechnicianAssignment(models.Model):
    report = models.ForeignKey(
        WorkReport,
        on_delete=models.CASCADE,
        related_name='technicians',
        verbose_name='Parte de trabajo'
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Técnico'
    )

    class Meta:
        verbose_name = 'Asignación de técnico'
        verbose_name_plural = 'Asignaciones de técnicos'
        unique_together = ['report', 'technician']

    def __str__(self):
        return f"{self.technician.username} - Parte {self.report.id}"

class MaterialUsed(models.Model):
    report = models.ForeignKey(
        WorkReport,
        on_delete=models.CASCADE,
        related_name='materials_used',
        verbose_name='Parte de trabajo'
    )
    material = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        verbose_name='Material'
    )
    quantity = models.IntegerField(verbose_name='Cantidad')
    
    class Meta:
        verbose_name = 'Material usado'
        verbose_name_plural = 'Materiales usados'

    def __str__(self):
        return f"{self.material.name} ({self.quantity}) - Parte {self.report.id}"

    def clean(self):
        # Verificar si hay suficiente stock
        if self.material.quantity < self.quantity:
            raise ValidationError({
                'quantity': f'No hay suficiente stock. Stock disponible: {self.material.quantity}'
            })
        super().clean()

    def save(self, *args, **kwargs):
        if self.pk:  # Si es una actualización
            old_instance = MaterialUsed.objects.get(pk=self.pk)
            # Devolver la cantidad anterior al stock
            old_instance.material.quantity += old_instance.quantity
            old_instance.material.save()
        
        # Validar y reducir el stock
        self.full_clean()
        self.material.quantity -= self.quantity
        self.material.save()
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Devolver la cantidad al stock cuando se elimina
        self.material.quantity += self.quantity
        self.material.save()
        super().delete(*args, **kwargs)
