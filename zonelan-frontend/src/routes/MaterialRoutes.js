import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MaterialList from '../components/materials/MaterialList';
import MaterialControlList from '../components/materials/MaterialControlList';

const MaterialRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<MaterialList />} />
            <Route path="/control" element={<MaterialControlList />} />
            {/* Si tienes un componente MaterialDetail, descomentar:
            <Route path="/:id" element={<MaterialDetail />} /> 
            */}
        </Routes>
    );
};

export default MaterialRoutes;