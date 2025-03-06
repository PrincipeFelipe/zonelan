import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getMediaUrl = (imageUrl) => {
    // Si no hay URL, retornar cadena vacía
    if (!imageUrl) return '';
    
    // Si la URL ya empieza con http o https, devolverla tal cual
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Asegurarse que BASE_URL está definido
    const baseUrl = BASE_URL || '';
    
    // Construir la URL completa
    if (imageUrl.startsWith('/')) {
        // Si comienza con /, mantener la URL tal como está
        return `${baseUrl}${imageUrl}`;
    } else {
        // Si no comienza con /, añadir /
        return `${baseUrl}/${imageUrl}`;
    }
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;