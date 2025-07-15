import { useState, useEffect, useContext, createContext } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error al inicializar autenticación', error);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await axios.post('/users/token/', { username, password });
            
            if (!response.data || !response.data.access) {
                toast.error('Respuesta de autenticación inválida');
                return false;
            }
            
            const { access, refresh } = response.data;
            
            localStorage.setItem('token', access);
            if (refresh) localStorage.setItem('refresh', refresh);
            
            try {
                const tokenParts = access.split('.');
                const tokenPayload = JSON.parse(atob(tokenParts[1]));
                const userId = tokenPayload.user_id;
                
                const userResponse = await axios.get(`/users/${userId}/`, {
                    headers: { 'Authorization': `Bearer ${access}` }
                });
                
                localStorage.setItem('user', JSON.stringify(userResponse.data));
                setUser(userResponse.data);
            } catch (userError) {
                console.error('Error al obtener datos del usuario:', userError);
                const basicUser = { username };
                localStorage.setItem('user', JSON.stringify(basicUser));
                setUser(basicUser);
            }
            
            return true;
        } catch (error) {
            console.error('Error en login:', error);
            toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Sesión cerrada correctamente');
    };

    const value = {
        user,
        loading,
        initialized,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};