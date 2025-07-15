import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState('');
    
    // Verificar si hay un usuario en localStorage al cargar
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
        setLoading(false);
    }, []);
    
    // Función de login
    const login = async (username, password) => {
        setAuthError('');
        setLoading(true);
        try {
            const response = await axios.post('/auth/token/', { username, password });
            const user = {
                username,
                access: response.data.access,
                refresh: response.data.refresh,
            };
            
            // Guardar usuario en localStorage
            localStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);
            
            // Obtener detalles del usuario
            await getUserDetails(user);
            
            return true;
        } catch (error) {
            console.error('Error de login:', error);
            setAuthError(
                error.response?.data?.detail || 
                'No se pudo iniciar sesión. Comprueba tus credenciales.'
            );
            toast.error('Error de inicio de sesión');
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Obtener detalles del usuario
    const getUserDetails = async (user) => {
        try {
            const response = await axios.get('/auth/user/');
            const updatedUser = { 
                ...user, 
                id: response.data.id,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                email: response.data.email,
                is_staff: response.data.is_staff,
                is_superuser: response.data.is_superuser,
                roles: response.data.roles || []
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error('Error al obtener detalles del usuario:', error);
        }
    };
    
    // Función de logout
    const logout = () => {
        localStorage.removeItem('user');
        setCurrentUser(null);
    };
    
    // Verificar si el token ha expirado
    const checkTokenExpiration = async () => {
        if (!currentUser) return;
        
        try {
            await axios.post('/auth/token/verify/', { token: currentUser.access });
        } catch (error) {
            // Si el token ha expirado, intentar refrescarlo
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post('/auth/token/refresh/', { 
                        refresh: currentUser.refresh 
                    });
                    
                    // Actualizar el token de acceso
                    const updatedUser = { 
                        ...currentUser, 
                        access: response.data.access 
                    };
                    
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setCurrentUser(updatedUser);
                } catch (refreshError) {
                    // Si el token de refresco también ha expirado, cerrar sesión
                    console.error('Error al refrescar token:', refreshError);
                    logout();
                    toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
                }
            }
        }
    };
    
    // Verificar el token periódicamente
    useEffect(() => {
        if (currentUser) {
            // Verificar al cargar y cada 5 minutos
            checkTokenExpiration();
            const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);
    
    const value = {
        currentUser,
        loading,
        authError,
        login,
        logout,
        getUserDetails
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};