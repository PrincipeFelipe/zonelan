import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import Dashboard from '../components/dashboard/Dashboard';
import RequireAuth from '../components/auth/RequireAuth';
import DashboardHome from '../components/dashboard/DashboardHome';
import IncidentRoutes from './IncidentRoutes';
import MaterialRoutes from './MaterialRoutes';
import ReportRoutes from './ReportRoutes';
import TicketRoutes from './TicketRoutes';
import CustomerRoutes from './CustomerRoutes';
import UserRoutes from './UserRoutes'; // Importar las rutas de usuarios

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rutas protegidas */}
                <Route path="/dashboard" element={
                    <RequireAuth>
                        <Dashboard />
                    </RequireAuth>
                }>
                    {/* Página principal del dashboard */}
                    <Route path="" element={<DashboardHome />} />
                    
                    {/* Rutas anidadas */}
                    <Route path="incidents/*" element={<IncidentRoutes />} />
                    <Route path="materials/*" element={<MaterialRoutes />} />
                    <Route path="reports/*" element={<ReportRoutes />} />
                    <Route path="tickets/*" element={<TicketRoutes />} />
                    <Route path="customers/*" element={<CustomerRoutes />} />
                    <Route path="users/*" element={<UserRoutes />} /> {/* Añadir esta línea */}
                </Route>
                
                {/* Redirección por defecto */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;