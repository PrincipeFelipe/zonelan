import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Importar componentes
import WarehouseList from '../components/storage/warehouses/WarehouseList';
import WarehouseDetail from '../components/storage/warehouses/WarehouseDetail';
import WarehouseForm from '../components/storage/warehouses/WarehouseForm';
import DepartmentList from '../components/storage/departments/DepartmentList';
import DepartmentForm from '../components/storage/departments/DepartmentForm';
import DepartmentDetail from '../components/storage/departments/DepartmentDetail';
import ShelfDetail from '../components/storage/shelves/ShelfDetail';
import TrayDetail from '../components/storage/trays/TrayDetail';
import StorageOverview from '../components/storage/StorageOverview';
import MaterialLocationList from '../components/storage/locations/MaterialLocationList';
import MaterialMovementList from '../components/storage/movements/MaterialMovementList';

const StorageRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<StorageOverview />} />
      
      {/* Rutas de almacenes */}
      <Route path="/warehouses" element={<WarehouseList />} />
      <Route path="/warehouses/new" element={<WarehouseForm />} />
      <Route path="/warehouses/:id" element={<WarehouseDetail />} />
      <Route path="/warehouses/edit/:id" element={<WarehouseForm />} />
      
      {/* Rutas de dependencias */}
      <Route path="/departments" element={<DepartmentList />} />
      <Route path="/departments/new" element={<DepartmentForm />} />
      <Route path="/departments/:id" element={<DepartmentDetail />} />
      <Route path="/departments/edit/:id" element={<DepartmentForm />} />
      
      {/* Rutas de estanterías */}
      <Route path="/shelves/:id" element={<ShelfDetail />} />
      
      {/* Rutas de baldas */}
      <Route path="/trays/:id" element={<TrayDetail />} />
      
      {/* Rutas de ubicaciones de materiales */}
      <Route path="/locations" element={<MaterialLocationList />} />
      <Route path="/locations/low-stock" element={<MaterialLocationList initialLowStockFilter={true} />} />
      
      {/* Rutas de movimientos de materiales */}
      <Route path="/movements" element={<MaterialMovementList />} />
    </Routes>
  );
};

export default StorageRoutes;