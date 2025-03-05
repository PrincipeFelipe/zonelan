from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nombre')
    address = models.TextField(verbose_name='Dirección')
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(max_length=15, verbose_name='Teléfono')
    contact_person = models.CharField(max_length=255, blank=True, null=True, verbose_name='Persona de contacto')

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.name
