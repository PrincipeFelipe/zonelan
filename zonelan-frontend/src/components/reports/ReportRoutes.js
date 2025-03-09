import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReportList from './ReportList';
import ReportForm from './ReportForm';
import ReportDetail from './ReportDetail';

const ReportRoutes = () => {
    return (
        <Routes>
            <Route index element={<ReportList />} />
            <Route path="create" element={<ReportForm />} />
            <Route path="new" element={<ReportForm />} /> {/* Alias opcional */}
            <Route path=":id" element={<ReportDetail />} />
            <Route path=":id/edit" element={<ReportForm />} />
        </Routes>
    );
};

export default ReportRoutes;