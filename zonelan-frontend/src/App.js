import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalToaster from './components/common/GlobalToaster';
import { AuthProvider } from './hooks/useAuth';
import { checkCommonRoutes } from './utils/debugApiRoutes';
import AppRoutes from './routes/AppRoutes';
import './App.css';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

const App = () => {
    useEffect(() => {
        // Solo ejecutar en entornos de desarrollo
        if (process.env.NODE_ENV === 'development') {
            checkCommonRoutes();
        }
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AppRoutes />
                <GlobalToaster />
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
