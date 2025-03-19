import axios from './axiosConfig';

// Función para comprobar si una ruta está disponible
export const checkApiRoute = async (route) => {
  try {
    await axios.get(route);
    console.log(`✅ Ruta disponible: ${route}`);
    return true;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) {
      console.log(`⚠️ Ruta requiere autenticación: ${route}`);
      return true; // La ruta existe pero requiere autenticación
    } else if (status === 404) {
      console.error(`❌ Ruta no encontrada: ${route}`);
      return false;
    } else {
      console.error(`❌ Error en ruta ${route}:`, error);
      return false;
    }
  }
};

// Función para comprobar una lista de rutas comunes y diagnosticar problemas
export const checkCommonRoutes = async () => {
  console.log('📊 Verificando rutas de API...');
  
  const routes = [
    '/users/',
    '/customers/',
    '/incidents/',
    '/tickets/',
    '/contracts/',
    '/api/users/',
    '/api/customers/',
    '/api/incidents/',
    '/api/tickets/',
    '/api/contracts/',
  ];
  
  for (const route of routes) {
    await checkApiRoute(route);
  }
  
  console.log('📊 Verificación de rutas completada');
};