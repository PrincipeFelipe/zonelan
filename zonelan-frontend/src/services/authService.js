import axios from '../utils/axiosConfig';

const authService = {
    login: async (credentials) => {
        try {
            // Primero obtenemos el token
            const response = await axios.post('/users/token/', credentials);
            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                
                // Decodificamos el token JWT para obtener el ID del usuario
                const tokenData = JSON.parse(atob(response.data.access.split('.')[1]));
                
                // Obtenemos la información del usuario usando su ID
                const userResponse = await axios.get(`/users/${tokenData.user_id}/`, {
                    headers: {
                        'Authorization': `Bearer ${response.data.access}`
                    }
                });

                // Guardamos la información del usuario
                localStorage.setItem('user', JSON.stringify(userResponse.data));
                return userResponse.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error en login:', error);
            throw new Error(error.response?.data?.detail || 'Error en el inicio de sesión');
        }
    },

    register: async (userData) => {
        try {
            const response = await axios.post('/users/', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Error en el registro');
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    changePassword: async (currentPassword, newPassword) => {
        try {
            const userId = authService.getCurrentUser().id;
            await axios.put(`/users/${userId}/change_password/`, {
                current_password: currentPassword,
                new_password: newPassword
            });
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Error al cambiar la contraseña');
        }
    }
};

export default authService;