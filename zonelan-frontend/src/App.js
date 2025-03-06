import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import UserList from './components/users/UserList';
import PrivateRoute from './components/auth/PrivateRoute';
import CustomerList from './components/customers/CustomerList';
import MaterialList from './components/materials/MaterialList';
import IncidentList from './components/incidents/IncidentList';
import ReportRoutes from './components/reports/ReportRoutes';
import MaterialRoutes from './routes/MaterialRoutes';

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
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }>
                        <Route path="users" element={<UserList />} />
                        <Route path="customers" element={<CustomerList />} />
                        <Route path="materials" element={<MaterialList />} />
                        <Route path="incidents" element={<IncidentList />} />
                        <Route path="reports/*" element={<ReportRoutes />} />
                        <Route path="materials/*" element={<MaterialRoutes />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
