import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getMediaUrl = (imageUrl) => {
    if (!imageUrl) return '';
    
    // Si la URL ya empieza con http o https, devolverla tal cual
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Construir la URL completa, asegurando que usamos 'mediafiles'
    if (imageUrl.startsWith('/')) {
        // Si comienza con /, eliminar la barra inicial
        imageUrl = imageUrl.substring(1);
    }
    
    // Si la URL contiene /media/, reemplazarlo por /mediafiles/
    if (imageUrl.includes('/media/')) {
        imageUrl = imageUrl.replace('/media/', '/mediafiles/');
    }
    
    // Si no incluye mediafiles, añadirlo
    if (!imageUrl.includes('/mediafiles/')) {
        return `${BASE_URL}/mediafiles/${imageUrl}`;
    }
    
    return `${BASE_URL}/${imageUrl}`;
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