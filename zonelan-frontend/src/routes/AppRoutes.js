// Añadir estos imports junto a los demás
import TicketList from '../components/tickets/TicketList';
import TicketDetail from '../components/tickets/TicketDetail';
import { Routes, Route } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import Dashboard from '../components/dashboard/Dashboard';

// Dentro del componente de rutas
<Routes>
    {/* Otras rutas */}
    <Route path="/dashboard/tickets" element={
        <RequireAuth>
            <Dashboard>
                <TicketList />
            </Dashboard>
        </RequireAuth>
    } />
    <Route path="/dashboard/tickets/:id" element={
        <RequireAuth>
            <Dashboard>
                <TicketDetail />
            </Dashboard>
        </RequireAuth>
    } />
    {/* Más rutas */}
</Routes>