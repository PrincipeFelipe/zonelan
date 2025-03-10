import React from 'react';
import { Routes, Route } from 'react-router-dom';
import IncidentList from '../components/incidents/IncidentList';
import IncidentForm from '../components/incidents/IncidentForm';

const IncidentRoutes = () => {
    return (
        <Routes>
            <Route index element={<IncidentList />} />
            <Route path="create" element={<IncidentForm />} />
            <Route path="edit/:id" element={<IncidentForm />} />
            <Route path=":id" element={<IncidentForm view />} />
        </Routes>
    );
};

export default IncidentRoutes;