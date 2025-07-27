#!/usr/bin/env python3
"""
Generador de SECRET_KEY para Django
"""
import secrets
import string

def generate_secret_key(length=50):
    """Genera una SECRET_KEY segura para Django"""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == '__main__':
    secret_key = generate_secret_key()
    print("Generated SECRET_KEY:")
    print(f"SECRET_KEY={secret_key}")
    print("\nCopia esta línea en tu archivo .env")
