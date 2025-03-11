import axios from '../utils/axiosConfig';
import Swal from 'sweetalert2';
import incidentService from './incidentService';

const authService = {
    login: async (credentials) => {
        try {
            // Primero obtenemos el token
            const response = await axios.post('/users/token/', credentials);
            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                
                // Si hay un token de refresh, guardarlo también
                if (response.data.refresh) {
                    localStorage.setItem('refresh', response.data.refresh);
                }
                
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
                
                // Obtener el conteo de incidencias y mostrar notificación
                try {
                    const counts = await incidentService.getPendingIncidentsCount();
                    if (counts.total > 0) {
                        // Usar setTimeout para dar tiempo al DOM a estabilizarse
                        setTimeout(async () => {
                            await Swal.fire({
                                icon: 'info',
                                title: 'Incidencias activas',
                                html: `
                                    <div>
                                        <p>Tienes <b>${counts.total}</b> incidencias pendientes de resolver:</p>
                                        <ul>
                                            <li><b>${counts.pending}</b> incidencias en estado pendiente</li>
                                            <li><b>${counts.in_progress}</b> incidencias en progreso</li>
                                        </ul>
                                    </div>
                                `,
                                confirmButtonText: 'Entendido'
                            });
                        }, 10000); // Retraso de 300ms
                    }
                } catch (countError) {
                    console.error('Error al obtener conteo de incidencias:', countError);
                }
                
                return true; // Asegurar que devolvemos true para indicar éxito
            }
            return false; // No hay token de acceso en la respuesta
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