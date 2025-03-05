from django.db import models
from apps.users.models import User
from apps.customers.models import Customer

class Incident(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('IN_PROGRESS', 'En Progreso'),
        ('RESOLVED', 'Resuelta'),
        ('CLOSED', 'Cerrada')
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica')
    ]

    title = models.CharField(max_length=255, verbose_name='Título')
    description = models.TextField(verbose_name='Descripción')
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE,
        related_name='incidents',
        verbose_name='Cliente'
    )
    reported_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reported_incidents',
        verbose_name='Reportado por'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        verbose_name='Estado'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        verbose_name='Prioridad'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    resolution_notes = models.TextField(blank=True, null=True, verbose_name='Notas de resolución')

    class Meta:
        verbose_name = 'Incidencia'
        verbose_name_plural = 'Incidencias'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.customer.name}"
