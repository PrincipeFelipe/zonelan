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
    
    // Si la URL ya incluye /media/, eliminar la duplicación
    if (imageUrl.includes('/media/')) {
        imageUrl = imageUrl.replace('/media/', '');
    }
    
    // Construir la URL completa
    return `${process.env.REACT_APP_API_URL}/media/${imageUrl}`;
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