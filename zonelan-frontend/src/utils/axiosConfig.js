import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir el token a las peticiones
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Asegurarnos que el interceptor no redireccione de forma agresiva

// Interceptor para manejar respuestas de error
instance.interceptors.response.use(
    response => response,
    error => {
        // Si el error es 401 (No autorizado), redirigir al login solo si:
        // 1. No estamos ya en la página de login
        // 2. No estamos intentando iniciar sesión
        if (error.response && error.response.status === 401) {
            // Limpiar datos de sesión
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refresh');
            
            // Redirigir a login solo si no estamos en login o intentando hacer login
            const isLoginPath = window.location.pathname.includes('/login');
            const isLoginRequest = error.config.url.includes('/token/');
            
            if (!isLoginPath && !isLoginRequest) {
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
    
    // Asegurarse que BASE_URL está definido
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