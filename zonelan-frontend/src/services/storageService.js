import axios from '../utils/axiosConfig';

// Servicios para almacenes
export const getWarehouses = async (params = {}) => {
  const response = await axios.get('/storage/warehouses/', { params });
  return response.data;
};

export const getWarehouseById = async (id) => {
  const response = await axios.get(`/storage/warehouses/${id}/`);
  return response.data;
};

export const getWarehouseDetails = async (id) => {
  const response = await axios.get(`/storage/warehouses/${id}/details/`);
  return response.data;
};

export const createWarehouse = async (data) => {
  const response = await axios.post('/storage/warehouses/', data);
  return response.data;
};

export const updateWarehouse = async (id, data) => {
  const response = await axios.put(`/storage/warehouses/${id}/`, data);
  return response.data;
};

export const deleteWarehouse = async (id) => {
  await axios.delete(`/storage/warehouses/${id}/`);
  return true;
};

// Servicios para dependencias
export const getDepartments = async (params = {}) => {
  const response = await axios.get('/storage/departments/', { params });
  return response.data;
};

export const getDepartmentById = async (id) => {
  const response = await axios.get(`/storage/departments/${id}/`);
  return response.data;
};

export const getDepartmentDetails = async (id) => {
  const response = await axios.get(`/storage/departments/${id}/details/`);
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await axios.post('/storage/departments/', data);
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await axios.put(`/storage/departments/${id}/`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  await axios.delete(`/storage/departments/${id}/`);
  return true;
};

// Servicios para estanterías
export const getShelves = async (params = {}) => {
  const response = await axios.get('/storage/shelves/', { params });
  return response.data;
};

export const getShelfById = async (id) => {
  const response = await axios.get(`/storage/shelves/${id}/`);
  return response.data;
};

export const getShelfDetails = async (id) => {
  const response = await axios.get(`/storage/shelves/${id}/details/`);
  return response.data;
};

export const createShelf = async (data) => {
  const response = await axios.post('/storage/shelves/', data);
  return response.data;
};

export const updateShelf = async (id, data) => {
  const response = await axios.put(`/storage/shelves/${id}/`, data);
  return response.data;
};

export const deleteShelf = async (id) => {
  await axios.delete(`/storage/shelves/${id}/`);
  return true;
};

// Servicios para baldas
export const getTrays = async (params = {}) => {
  const response = await axios.get('/storage/trays/', { params });
  return response.data;
};

export const getTrayById = async (id) => {
  const response = await axios.get(`/storage/trays/${id}/`);
  return response.data;
};

export const getTrayMaterials = async (id) => {
  const response = await axios.get(`/storage/trays/${id}/materials/`);
  return response.data;
};

export const createTray = async (data) => {
  const response = await axios.post('/storage/trays/', data);
  return response.data;
};

export const updateTray = async (id, data) => {
  const response = await axios.put(`/storage/trays/${id}/`, data);
  return response.data;
};

export const deleteTray = async (id) => {
  await axios.delete(`/storage/trays/${id}/`);
  return true;
};

// Servicios para ubicaciones de materiales
export const getMaterialLocations = async (params = {}) => {
  const response = await axios.get('/storage/locations/', { params });
  return response.data;
};

export const getMaterialLocationById = async (id) => {
  const response = await axios.get(`/storage/locations/${id}/`);
  return response.data;
};

export const getMaterialLocationMovements = async (id) => {
  const response = await axios.get(`/storage/locations/${id}/movements/`);
  return response.data;
};

export const getLowStockLocations = async () => {
  const response = await axios.get('/storage/locations/low_stock/');
  return response.data;
};

export const createMaterialLocation = async (data) => {
  const response = await axios.post('/storage/locations/', data);
  return response.data;
};

export const updateMaterialLocation = async (id, data) => {
  const response = await axios.put(`/storage/locations/${id}/`, data);
  return response.data;
};

export const deleteMaterialLocation = async (id) => {
  await axios.delete(`/storage/locations/${id}/`);
  return true;
};

// Servicios para movimientos de materiales
export const getMaterialMovements = async (params = {}) => {
  const response = await axios.get('/storage/movements/', { params });
  return response.data;
};

export const getMaterialMovementById = async (id) => {
  const response = await axios.get(`/storage/movements/${id}/`);
  return response.data;
};

export const createMaterialMovement = async (data) => {
  const response = await axios.post('/storage/movements/', data);
  return response.data;
};