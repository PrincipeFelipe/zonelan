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

import StorageDashboard from '../components/storage/dashboard/StorageDashboard';
import WarehouseList from '../components/storage/warehouses/WarehouseList';
import WarehouseForm from '../components/storage/warehouses/WarehouseForm';
import WarehouseDetail from '../components/storage/warehouses/WarehouseDetail';
import DepartmentList from '../components/storage/departments/DepartmentList';
import DepartmentForm from '../components/storage/departments/DepartmentForm';
import DepartmentDetail from '../components/storage/departments/DepartmentDetail';
import ShelfList from '../components/storage/shelves/ShelfList';
import ShelfForm from '../components/storage/shelves/ShelfForm';
import ShelfDetail from '../components/storage/shelves/ShelfDetail';
import TrayList from '../components/storage/trays/TrayList';
import TrayForm from '../components/storage/trays/TrayForm';
import TrayDetail from '../components/storage/trays/TrayDetail';
import MaterialLocationList from '../components/storage/locations/MaterialLocationList';
import MaterialLocationForm from '../components/storage/locations/MaterialLocationForm';
import MaterialMovementList from '../components/storage/movements/MaterialMovementList';
import MaterialMovementForm from '../components/storage/movements/MaterialMovementForm';

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

                    {/* Rutas de almacenamiento */}
                    <Route path="storage">
                        <Route index element={<StorageDashboard />} />
                        <Route path="warehouses">
                            <Route index element={<WarehouseList />} />
                            <Route path="new" element={<WarehouseForm />} />
                            <Route path=":warehouseId/edit" element={<WarehouseForm />} />
                            <Route path=":warehouseId/departments" element={<DepartmentList />} />
                            <Route path=":warehouseId/departments/new" element={<DepartmentForm />} />
                        </Route>
                        <Route path="departments">
                            <Route index element={<DepartmentList />} />
                            <Route path=":departmentId/edit" element={<DepartmentForm />} />
                            <Route path=":departmentId/shelves" element={<ShelfList />} />
                            <Route path=":departmentId/shelves/new" element={<ShelfForm />} />
                        </Route>
                        <Route path="shelves">
                            <Route index element={<ShelfList />} />
                            <Route path=":shelfId/edit" element={<ShelfForm />} />
                            <Route path=":shelfId/trays" element={<TrayList />} />
                            <Route path=":shelfId/trays/new" element={<TrayForm />} />
                        </Route>
                        <Route path="trays">
                            <Route index element={<TrayList />} />
                            <Route path=":trayId/edit" element={<TrayForm />} />
                        </Route>
                        <Route path="locations">
                            <Route index element={<MaterialLocationList />} />
                            <Route path="new" element={<MaterialLocationForm />} />
                            <Route path=":id" element={<MaterialLocationForm />} />
                        </Route>
                        <Route path="movements">
                            <Route index element={<MaterialMovementList />} />
                            <Route path="new" element={<MaterialMovementForm />} />
                            <Route path=":id" element={<MaterialMovementForm />} />
                        </Route>
                    </Route>
                </Route>
                
                {/* Redirección por defecto */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;