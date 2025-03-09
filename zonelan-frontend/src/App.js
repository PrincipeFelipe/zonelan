import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalToaster from './components/common/GlobalToaster';
import { AuthProvider } from './hooks/useAuth';
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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AppRoutes />
                <GlobalToaster />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
