import React from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth'; // Importar desde hooks/useAuth
import GlobalToaster from './components/common/GlobalToaster';
import AppRoutes from './routes/AppRoutes';
import './App.css';

// Aplicar tema personalizado
let theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    margin: '16px',
                },
            },
        },
    },
});

// Hacer las fuentes responsivas automáticamente
theme = responsiveFontSizes(theme);

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider> {/* Envolver la aplicación con AuthProvider */}
                <Router>
                    <GlobalToaster />
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
