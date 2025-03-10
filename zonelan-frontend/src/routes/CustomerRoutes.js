import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerList from '../components/customers/CustomerList';
import CustomerForm from '../components/customers/CustomerForm';

const CustomerRoutes = () => {
    return (
        <Routes>
            <Route index element={<CustomerList />} />
            <Route path="create" element={<CustomerForm />} />
            <Route path="edit/:id" element={<CustomerForm />} />
            <Route path=":id" element={<CustomerForm view />} />
        </Routes>
    );
};

export default CustomerRoutes;