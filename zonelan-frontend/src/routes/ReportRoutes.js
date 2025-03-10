import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReportList from '../components/reports/ReportList';
import ReportForm from '../components/reports/ReportForm';

const ReportRoutes = () => {
    return (
        <Routes>
            <Route index element={<ReportList />} />
            <Route path="create" element={<ReportForm />} />
            <Route path=":id" element={<ReportForm />} />
        </Routes>
    );
};

export default ReportRoutes;