import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Dashboard from '../components/dashboard/Dashboard';
import UserList from '../components/users/UserList';
import PrivateRoute from '../components/auth/PrivateRoute';
import CustomerList from '../components/customers/CustomerList';
import MaterialList from '../components/materials/MaterialList';
import IncidentList from '../components/incidents/IncidentList';
import IncidentDetail from '../components/incidents/IncidentDetail';
import ReportRoutes from '../components/reports/ReportRoutes';
import MaterialRoutes from './MaterialRoutes';
import TicketRoutes from './TicketRoutes';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }>
                    <Route index element={<Navigate to="tickets" />} />
                    <Route path="users" element={<UserList />} />
                    <Route path="customers" element={<CustomerList />} />
                    <Route path="materials/*" element={<MaterialRoutes />} />
                    <Route path="incidents" element={<IncidentList />} />
                    <Route path="incidents/:id" element={<IncidentDetail />} />
                    <Route path="incidents/:id/edit" element={<IncidentList />} />
                    <Route path="reports/*" element={<ReportRoutes />} />
                    <Route path="tickets/*" element={<TicketRoutes />} />
                </Route>
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;