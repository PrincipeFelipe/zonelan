#!/usr/bin/env python3
"""
Script de verificación pre-despliegue para Zonelan
"""
import os
import sys
import subprocess
import json

def check_python_version():
    """Verificar versión de Python"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        return False, f"Python {version.major}.{version.minor} (se requiere 3.8+)"
    return True, f"Python {version.major}.{version.minor}.{version.micro}"

def check_node_version():
    """Verificar versión de Node.js"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            major_version = int(version.replace('v', '').split('.')[0])
            if major_version >= 16:
                return True, version
            else:
                return False, f"{version} (se requiere v16+)"
        else:
            return False, "No instalado"
    except FileNotFoundError:
        return False, "No instalado"

def check_database_config():
    """Verificar configuración de base de datos"""
    env_file = os.path.join(os.path.dirname(__file__), 'zonelan_backend', '.env')
    if not os.path.exists(env_file):
        return False, "Archivo .env no encontrado"
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    required_vars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SECRET_KEY']
    missing_vars = []
    
    for var in required_vars:
        if f"{var}=" not in content:
            missing_vars.append(var)
    
    if missing_vars:
        return False, f"Variables faltantes: {', '.join(missing_vars)}"
    
    return True, "Configuración presente"

def check_npm_dependencies():
    """Verificar dependencias de npm"""
    frontend_dir = os.path.join(os.path.dirname(__file__), 'zonelan-frontend')
    package_json = os.path.join(frontend_dir, 'package.json')
    
    if not os.path.exists(package_json):
        return False, "package.json no encontrado"
    
    node_modules = os.path.join(frontend_dir, 'node_modules')
    if not os.path.exists(node_modules):
        return False, "Dependencias no instaladas (ejecuta: npm install)"
    
    return True, "Dependencias instaladas"

def check_python_dependencies():
    """Verificar dependencias de Python"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'zonelan_backend')
    requirements_file = os.path.join(backend_dir, 'requirements.txt')
    
    if not os.path.exists(requirements_file):
        return False, "requirements.txt no encontrado"
    
    try:
        import django
        import rest_framework
        import corsheaders
        return True, "Dependencias principales instaladas"
    except ImportError as e:
        return False, f"Dependencias faltantes: {str(e)}"

def check_file_permissions():
    """Verificar permisos de archivos"""
    project_dir = os.path.dirname(__file__)
    
    # Verificar que los directorios existen
    backend_dir = os.path.join(project_dir, 'zonelan_backend')
    frontend_dir = os.path.join(project_dir, 'zonelan-frontend')
    
    if not os.path.exists(backend_dir):
        return False, "Directorio backend no encontrado"
    
    if not os.path.exists(frontend_dir):
        return False, "Directorio frontend no encontrado"
    
    return True, "Estructura de directorios correcta"

def main():
    """Función principal"""
    print("🔍 Verificación Pre-Despliegue - Zonelan")
    print("=" * 50)
    
    checks = [
        ("Versión de Python", check_python_version),
        ("Versión de Node.js", check_node_version),
        ("Configuración de BD", check_database_config),
        ("Dependencias Python", check_python_dependencies),
        ("Dependencias NPM", check_npm_dependencies),
        ("Permisos de archivos", check_file_permissions),
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        try:
            passed, message = check_func()
            status = "✅" if passed else "❌"
            print(f"{status} {check_name}: {message}")
            
            if not passed:
                all_passed = False
                
        except Exception as e:
            print(f"❌ {check_name}: Error - {str(e)}")
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("🎉 ¡Todas las verificaciones pasaron!")
        print("✅ El proyecto está listo para el despliegue.")
        print("🚀 Ejecuta: ./deploy.sh para continuar")
    else:
        print("⚠️  Hay problemas que deben solucionarse antes del despliegue.")
        print("📋 Revisa los errores anteriores y corrígelos.")
        sys.exit(1)

if __name__ == "__main__":
    main()
