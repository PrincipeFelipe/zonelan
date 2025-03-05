from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    email = models.EmailField(unique=True)
    cod_worker = models.CharField(max_length=3, unique=True, editable=False)
    TYPE_CHOICES = [
        ('SuperAdmin', 'SuperAdmin'),
        ('Admin', 'Admin'),
        ('Gestor', 'Gestor'),
        ('User', 'User'),
    ]
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    def save(self, *args, **kwargs):
        if not self.cod_worker:
            last_user = User.objects.order_by('-cod_worker').first()
            if last_user and last_user.cod_worker:
                next_number = int(last_user.cod_worker) + 1
            else:
                next_number = 1
            self.cod_worker = f"{next_number:03d}"
        super().save(*args, **kwargs)

    def update(self, **kwargs):
        """
        Método para actualizar el usuario sin requerir la contraseña
        """
        for key, value in kwargs.items():
            if key == 'password' and value:
                self.set_password(value)
            elif hasattr(self, key):
                setattr(self, key, value)
        self.save()

    def __str__(self):
        return self.username