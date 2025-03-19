from django.db import models
from apps.customers.models import Customer
from apps.users.models import User
from django.utils import timezone

class Contract(models.Model):
    """
    Modelo para gestionar contratos con clientes, tanto entidades públicas como privadas.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('INACTIVE', 'Inactivo'),
        ('EXPIRED', 'Vencido'),
    ]
    
    MAINTENANCE_FREQUENCY_CHOICES = [
        ('WEEKLY', 'Semanal'),
        ('BIWEEKLY', 'Quincenal'),
        ('MONTHLY', 'Mensual'),
        ('QUARTERLY', 'Trimestral'),
        ('SEMIANNUAL', 'Semestral'),
        ('ANNUAL', 'Anual'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='contracts',
        verbose_name='Cliente'
    )
    title = models.CharField(max_length=255, verbose_name='Título del contrato')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        verbose_name='Estado'
    )
    start_date = models.DateField(verbose_name='Fecha de inicio')
    end_date = models.DateField(blank=True, null=True, verbose_name='Fecha de finalización')
    requires_maintenance = models.BooleanField(default=False, verbose_name='Requiere mantenimiento')
    maintenance_frequency = models.CharField(
        max_length=20,
        choices=MAINTENANCE_FREQUENCY_CHOICES,
        blank=True,
        null=True,
        verbose_name='Frecuencia de mantenimiento'
    )
    next_maintenance_date = models.DateField(
        blank=True, 
        null=True, 
        verbose_name='Próxima fecha de mantenimiento'
    )
    observations = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de última actualización')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_contracts',
        verbose_name='Creado por'
    )
    is_deleted = models.BooleanField(default=False, verbose_name='Eliminado')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de eliminación')

    class Meta:
        verbose_name = 'Contrato'
        verbose_name_plural = 'Contratos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.customer.name}"

    def save(self, *args, **kwargs):
        # Al guardar, verificar si el contrato ha vencido
        if self.end_date and self.end_date < timezone.now().date():
            self.status = 'EXPIRED'
        
        # Si se cambia la frecuencia de mantenimiento, actualizar la próxima fecha
        if self.requires_maintenance and self.maintenance_frequency and not self.next_maintenance_date:
            self.calculate_next_maintenance_date()
            
        super().save(*args, **kwargs)
    
    def calculate_next_maintenance_date(self):
        """Calcula la próxima fecha de mantenimiento basada en la frecuencia"""
        if not self.requires_maintenance or not self.maintenance_frequency:
            return
            
        today = timezone.now().date()
        
        if self.maintenance_frequency == 'WEEKLY':
            self.next_maintenance_date = today + timezone.timedelta(days=7)
        elif self.maintenance_frequency == 'BIWEEKLY':
            self.next_maintenance_date = today + timezone.timedelta(days=15)
        elif self.maintenance_frequency == 'MONTHLY':
            # Aproximación simple: un mes son 30 días
            self.next_maintenance_date = today + timezone.timedelta(days=30)
        elif self.maintenance_frequency == 'QUARTERLY':
            # Trimestre: 3 meses (90 días)
            self.next_maintenance_date = today + timezone.timedelta(days=90)
        elif self.maintenance_frequency == 'SEMIANNUAL':
            # Semestral: 6 meses (180 días)
            self.next_maintenance_date = today + timezone.timedelta(days=180)
        elif self.maintenance_frequency == 'ANNUAL':
            # Anual: 365 días
            self.next_maintenance_date = today + timezone.timedelta(days=365)

    @property
    def is_maintenance_pending(self):
        """Devuelve True si hay un mantenimiento pendiente"""
        if not self.requires_maintenance:
            return False
        
        if not self.next_maintenance_date:
            return False
        
        return self.next_maintenance_date <= timezone.now().date()
        
    @property
    def days_to_next_maintenance(self):
        """Devuelve el número de días hasta el próximo mantenimiento"""
        if not self.next_maintenance_date:
            return None
        
        delta = self.next_maintenance_date - timezone.now().date()
        return delta.days


class MaintenanceRecord(models.Model):
    """
    Registro de los mantenimientos realizados a los contratos.
    """
    # Añadir opciones para el tipo de mantenimiento
    MAINTENANCE_TYPE_CHOICES = [
        ('PREVENTIVE', 'Preventivo'),
        ('CORRECTIVE', 'Correctivo'),
        ('EMERGENCY', 'Emergencia'),
        ('INSPECTION', 'Inspección'),
    ]
    
    # Ampliar opciones de estado para incluir IN_PROGRESS y CANCELLED
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('IN_PROGRESS', 'En Progreso'),
        ('COMPLETED', 'Completado'),
        ('CANCELLED', 'Cancelado'),
    ]
    
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name='maintenance_records',
        verbose_name='Contrato'
    )
    date = models.DateField(verbose_name='Fecha de mantenimiento')
    
    # Añadir campo para tipo de mantenimiento
    maintenance_type = models.CharField(
        max_length=20,
        choices=MAINTENANCE_TYPE_CHOICES,
        default='PREVENTIVE',
        verbose_name='Tipo de mantenimiento'
    )
    
    # Campo para técnico (string en lugar de FK)
    technician = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name='Técnico'
    )
    
    # Mantener el performed_by como FK hacia User
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='performed_maintenances',
        verbose_name='Realizado por'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',  # Cambiar default a PENDING para coincidir con frontend
        verbose_name='Estado'
    )
    
    # Renombrar notes a observations para coincidir con el frontend
    observations = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Añadir campo de fecha de actualización

    class Meta:
        verbose_name = 'Registro de mantenimiento'
        verbose_name_plural = 'Registros de mantenimiento'
        ordering = ['-date']

    def __str__(self):
        return f"Mantenimiento {self.contract.title} - {self.date}"
    
    @property
    def performed_by_name(self):
        """Devuelve el nombre de usuario de quien realizó el mantenimiento"""
        return self.performed_by.username if self.performed_by else None
    
    @property
    def maintenance_type_display(self):
        """Devuelve el texto descriptivo del tipo de mantenimiento"""
        return dict(self.MAINTENANCE_TYPE_CHOICES).get(self.maintenance_type, '')
    
    @property
    def status_display(self):
        """Devuelve el texto descriptivo del estado"""
        return dict(self.STATUS_CHOICES).get(self.status, '')
    
    def save(self, *args, **kwargs):
        # Guardar el registro de mantenimiento
        super().save(*args, **kwargs)
        
        # Actualizar la próxima fecha de mantenimiento en el contrato
        if self.status == 'COMPLETED':
            self.contract.calculate_next_maintenance_date()
            self.contract.save(update_fields=['next_maintenance_date'])


class ContractDocument(models.Model):
    """
    Documentos asociados a los contratos.
    """
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Contrato'
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    file = models.FileField(upload_to='contract_documents/', verbose_name='Archivo')
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_contract_documents',
        verbose_name='Subido por'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de subida')

    class Meta:
        verbose_name = 'Documento del contrato'
        verbose_name_plural = 'Documentos del contrato'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} - {self.contract.title}"
        
    def delete(self, *args, **kwargs):
        """Eliminar el archivo cuando se elimina el objeto"""
        self.file.delete()
        super().delete(*args, **kwargs)


class ContractReport(models.Model):
    """
    Reportes de trabajo asociados a los contratos, similar a los reportes de incidencias.
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Borrador'),
        ('COMPLETED', 'Completado'),
    ]
    
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name='reports',
        verbose_name='Contrato'
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    description = models.TextField(verbose_name='Descripción del trabajo')
    date = models.DateField(verbose_name='Fecha')
    hours_worked = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Horas trabajadas',
        null=True,
        blank=True
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='contract_reports',
        verbose_name='Realizado por'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name='Estado'
    )
    is_completed = models.BooleanField(default=False, verbose_name='Completado')
    observations = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Manejo igual que en los reportes de incidencias
    is_deleted = models.BooleanField(default=False, verbose_name='Eliminado')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de eliminación')

    class Meta:
        verbose_name = 'Reporte de contrato'
        verbose_name_plural = 'Reportes de contrato'
        ordering = ['-date']

    def __str__(self):
        return f"Reporte {self.title} - {self.contract.title}"
