from django.db import models
from apps.materials.models import Material
from django.db.models import Max


class Warehouse(models.Model):
    """
    Representa un almacén físico donde se guardan los materiales.
    Es el nivel más alto de la jerarquía de almacenamiento.
    """
    name = models.CharField(max_length=100, verbose_name='Nombre')
    code = models.CharField(max_length=20, unique=True, verbose_name='Código', blank=True, null=True)
    location = models.CharField(max_length=255, verbose_name='Ubicación', blank=True, null=True)
    description = models.TextField(verbose_name='Descripción', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name
    
    def save(self, *args, **kwargs):
        # Si no hay código asignado, generarlo automáticamente
        if not self.code:
            # Buscar el último código alfanumérico (ALM-XXX)
            last_warehouse = Warehouse.objects.all().order_by('-code').first()
            if last_warehouse and last_warehouse.code and last_warehouse.code.startswith('ALM-'):
                try:
                    # Extraer el número del formato ALM-XXX
                    last_number = int(last_warehouse.code.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            # Asignar el nuevo código
            self.code = f"ALM-{new_number:03d}"
            
        super().save(*args, **kwargs)


class Department(models.Model):
    """
    Representa una dependencia dentro del almacén.
    Es el segundo nivel de la jerarquía de almacenamiento.
    """
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='departments', verbose_name='Almacén')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    code = models.CharField(max_length=20, verbose_name='Código', blank=True, null=True)
    description = models.TextField(verbose_name='Descripción', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Dependencia'
        verbose_name_plural = 'Dependencias'
        ordering = ['warehouse__name', 'name']
        unique_together = ['warehouse', 'code']

    def __str__(self):
        if self.code and self.warehouse.code:
            return f"{self.warehouse.code}-{self.code} - {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        # Si no hay código asignado, generarlo automáticamente
        if not self.code:
            # Buscar el último código para este almacén (DEP-XXX)
            last_department = Department.objects.filter(
                warehouse=self.warehouse
            ).order_by('-code').first()
            
            if last_department and last_department.code and last_department.code.startswith('DEP-'):
                try:
                    # Extraer el número del formato DEP-XXX
                    last_number = int(last_department.code.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            # Asignar el nuevo código
            self.code = f"DEP-{new_number:03d}"
            
        super().save(*args, **kwargs)


class Shelf(models.Model):
    """
    Representa una estantería dentro de una dependencia.
    Es el tercer nivel de la jerarquía de almacenamiento.
    """
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='shelves', verbose_name='Dependencia')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    code = models.CharField(max_length=20, verbose_name='Código', blank=True, null=True)
    description = models.TextField(verbose_name='Descripción', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Estantería'
        verbose_name_plural = 'Estanterías'
        ordering = ['department__warehouse__name', 'department__name', 'name']
        unique_together = ['department', 'code']

    def __str__(self):
        if self.code and self.department.code and self.department.warehouse.code:
            return f"{self.department.warehouse.code}-{self.department.code}-{self.code} - {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        # Si no hay código asignado, generarlo automáticamente
        if not self.code:
            # Buscar el último código para esta dependencia (EST-XXX)
            last_shelf = Shelf.objects.filter(
                department=self.department
            ).order_by('-code').first()
            
            if last_shelf and last_shelf.code and last_shelf.code.startswith('EST-'):
                try:
                    # Extraer el número del formato EST-XXX
                    last_number = int(last_shelf.code.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            # Asignar el nuevo código
            self.code = f"EST-{new_number:03d}"
            
        super().save(*args, **kwargs)


class Tray(models.Model):
    """
    Representa una balda dentro de una estantería.
    Es el cuarto nivel de la jerarquía de almacenamiento.
    """
    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE, related_name='trays', verbose_name='Estantería')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    code = models.CharField(max_length=20, verbose_name='Código', blank=True, null=True)
    description = models.TextField(verbose_name='Descripción', blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        verbose_name = 'Balda'
        verbose_name_plural = 'Baldas'
        ordering = ['shelf__department__warehouse__name', 'shelf__department__name', 'shelf__name', 'name']
        unique_together = ['shelf', 'code']

    def __str__(self):
        if (self.code and self.shelf.code and 
            self.shelf.department.code and self.shelf.department.warehouse.code):
            return f"{self.shelf.department.warehouse.code}-{self.shelf.department.code}-{self.shelf.code}-{self.code} - {self.name}"
        return self.name

    def get_full_code(self):
        """Devuelve el código completo de la balda incluyendo todos los niveles"""
        if (self.code and self.shelf.code and 
            self.shelf.department.code and self.shelf.department.warehouse.code):
            return f"{self.shelf.department.warehouse.code}-{self.shelf.department.code}-{self.shelf.code}-{self.code}"
        return ""
    
    def save(self, *args, **kwargs):
        # Comprobar si hay código asignado antes de intentar generar uno
        if self.code is None or self.code == "":
            # Buscar el último código para esta estantería (BAL-XXX)
            last_tray = Tray.objects.filter(
                shelf=self.shelf
            ).order_by('-code').first()
            
            if last_tray and last_tray.code and last_tray.code.startswith('BAL-'):
                try:
                    # Extraer el número del formato BAL-XXX
                    last_number = int(last_tray.code.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            # Asignar el nuevo código
            self.code = f"BAL-{new_number:03d}"
            
        super().save(*args, **kwargs)


class MaterialLocation(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='locations')
    tray = models.ForeignKey(Tray, on_delete=models.CASCADE, related_name='material_locations')
    quantity = models.PositiveIntegerField(default=0)
    minimum_quantity = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ubicación de Material'
        verbose_name_plural = 'Ubicaciones de Materiales'
        ordering = ('-updated_at',)
        constraints = [
            models.UniqueConstraint(
                fields=['material', 'tray'],
                name='unique_material_tray'
            )
        ]

    def __str__(self):
        return f"{self.material.name} en {self.tray.name}"
    
    def get_full_path(self):
        """Devuelve la ruta completa de la ubicación"""
        try:
            tray = self.tray
            shelf = tray.shelf
            department = shelf.department
            warehouse = department.warehouse
            
            return f"{warehouse.name} > {department.name} > {shelf.name} > {tray.name}"
        except Exception as e:
            # En caso de error, devolver una ruta parcial
            return f"Ubicación {self.id}"


class MaterialMovement(models.Model):
    """
    Registra los movimientos de materiales entre ubicaciones.
    """
    OPERATION_CHOICES = [
        ('ADD', 'Entrada'),
        ('REMOVE', 'Salida'),
        ('TRANSFER', 'Traslado'),
    ]

    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='movements', verbose_name='Material')
    source_location = models.ForeignKey(
        MaterialLocation, 
        on_delete=models.CASCADE, 
        related_name='source_movements', 
        verbose_name='Ubicación origen',
        null=True, 
        blank=True
    )
    target_location = models.ForeignKey(
        MaterialLocation, 
        on_delete=models.CASCADE, 
        related_name='target_movements', 
        verbose_name='Ubicación destino',
        null=True, 
        blank=True
    )
    quantity = models.PositiveIntegerField(verbose_name='Cantidad')
    operation = models.CharField(max_length=10, choices=OPERATION_CHOICES, verbose_name='Operación')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Fecha y hora')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name='Usuario')
    notes = models.TextField(verbose_name='Notas', blank=True, null=True)
    material_control = models.ForeignKey(
        'materials.MaterialControl', 
        on_delete=models.SET_NULL, 
        related_name='movements',
        verbose_name='Control de material',
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name = 'Movimiento de material'
        verbose_name_plural = 'Movimientos de materiales'
        ordering = ['-timestamp']

    def __str__(self):
        operation_text = dict(self.OPERATION_CHOICES).get(self.operation, self.operation)
        if self.operation == 'TRANSFER':
            return f"{operation_text} de {self.material.name}: {self.quantity} unidades desde {self.source_location} hacia {self.target_location}"
        elif self.operation == 'ADD':
            return f"{operation_text} de {self.material.name}: {self.quantity} unidades en {self.target_location}"
        else:  # REMOVE
            return f"{operation_text} de {self.material.name}: {self.quantity} unidades desde {self.source_location}"
