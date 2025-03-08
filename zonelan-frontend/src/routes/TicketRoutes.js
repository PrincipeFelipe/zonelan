import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TicketList from '../components/tickets/TicketList';
import TicketDetail from '../components/tickets/TicketDetail';

const TicketRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<TicketList />} />
            <Route path="/:id" element={<TicketDetail />} />
        </Routes>
    );
};

export default TicketRoutes;