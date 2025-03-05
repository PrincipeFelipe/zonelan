# zonelan_backend/zonelan_backend/README.md

# Proyecto Zonelan Backend

Este proyecto es un backend para una aplicación web utilizando Django y Django REST Framework. La base de datos utilizada es MySQL, ubicada en el mismo servidor (localhost) y se llama `db_zonelan`.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```
zonelan_backend
├── apps
│   └── users
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── urls.py
│       └── views.py
├── config
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
└── README.md
```

## Aplicación de Usuarios

La primera aplicación del proyecto es `users`, que extiende el modelo de datos de usuario existente de Django. El modelo de datos `User` incluye los siguientes campos adicionales:

- `name`: Nombre del usuario.
- `phone`: Teléfono del usuario.
- `email`: Correo electrónico del usuario.
- `cod_worker`: Código del trabajador.
- `type`: Tipo de usuario, que puede ser `Admin`, `Gestor` o `User`.

## Instalación

Para instalar las dependencias del proyecto, asegúrate de tener `pip` instalado y ejecuta:

```
pip install -r requirements.txt
```

## Ejecución

Para ejecutar el servidor de desarrollo de Django, utiliza el siguiente comando:

```
python manage.py runserver
```

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.