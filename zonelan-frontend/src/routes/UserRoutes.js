import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserList from '../components/users/UserList';

const UserRoutes = () => {
    return (
        <Routes>
            <Route index element={<UserList />} />
            {/* Si necesitas más rutas para usuarios en el futuro, puedes añadirlas aquí */}
        </Routes>
    );
};

export default UserRoutes;