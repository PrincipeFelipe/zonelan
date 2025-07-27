import axios from 'axios';

// URL base para todas las llamadas API
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Configuración básica
const instance = axios.create({
  baseURL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para gestionar headers de autenticación y rutas API
instance.interceptors.request.use(config => {
  // Agregar token de autenticación a todas las solicitudes
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  let url = config.url || '';
  
  // Si no comienza con http/https (URL completa)
  if (!url.match(/^(http|https):\/\//)) {
    // Asegurar que todas las llamadas API tengan el prefijo correcto
    // y eliminar dobles barras
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }
    
    // IMPORTANTE: ELIMINAR SIEMPRE el prefijo /api/ porque el backend no lo usa
    if (url.startsWith('/api/')) {
      url = url.substring(4); // Eliminar el '/api'
    }
    
    // NO añadir el prefijo /api/ porque el backend no lo utiliza
    
    config.url = url;
  }
  
  return config;
});

// Interceptor para normalizar parámetros
instance.interceptors.request.use(config => {
    // Si hay parámetros de consulta, normalizarlos
    if (config.params) {
        const normalizedParams = {};
        
        Object.entries(config.params).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            
            if (typeof value === 'object' && value !== null && 'id' in value) {
                normalizedParams[key] = value.id;
            } else {
                normalizedParams[key] = value;
            }
        });
        
        config.params = normalizedParams;
    }
    
    return config;
});

// Interceptor para manejar errores comunes
instance.interceptors.response.use(
  response => response,
  error => {
    // Centralizar manejo de errores
    console.error('Error en petición API:', error);
    
    // Si el error es 401 (No autorizado), redirigir al login
    if (error.response && error.response.status === 401) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh');
      
      // Redirigir a login (si no estamos ya en la página de login)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const getMediaUrl = (imageUrl) => {
    // Si no hay URL, retornar cadena vacía
    if (!imageUrl) return '';
    
    // Si la URL ya empieza con http o https, devolverla tal cual
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Asegurar que baseURL está definido
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    // Construir la URL completa
    if (imageUrl.startsWith('/')) {
        // Si comienza con /, mantener la URL tal como está
        return `${baseUrl}${imageUrl}`;
    } else {
        // Si no comienza con /, añadir /
        return `${baseUrl}/${imageUrl}`;
    }
};

export default instance;