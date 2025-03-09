import { useState, useEffect, useContext, createContext } from 'react';
import axios from '../utils/axiosConfig';

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
                    // Obtener información del usuario desde el token
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error al inicializar autenticación', error);
                // Si hay error, limpiar datos de sesión
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initAuth();
    }, []);

    // Función de login
    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await axios.post('/users/token/', { username, password });
            const { access, refresh, user } = response.data;
            
            // Guardar token y datos en localStorage
            localStorage.setItem('token', access);
            localStorage.setItem('refresh', refresh);
            localStorage.setItem('user', JSON.stringify(user));
            
            setUser(user);
            return true;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función de logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, initialized, login, logout }}>
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