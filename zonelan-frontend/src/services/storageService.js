import axios from '../utils/axiosConfig';

// Modificar el helper addCodeIfMissing para que no añada code a las ubicaciones
const addCodeIfMissing = (data) => {
  // Si es una petición para MaterialLocation, no añadir campo code
  if (data.material && data.tray && 'quantity' in data) {
    return { ...data };
  }
  
  // Para otras entidades que sí requieren code
  return {
    ...data,
    code: data.code === undefined ? "" : data.code
  };
};

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

export const createWarehouse = async (warehouseData) => {
  const response = await axios.post('/storage/warehouses/', addCodeIfMissing(warehouseData));
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

export const createDepartment = async (departmentData) => {
  const response = await axios.post('/storage/departments/', addCodeIfMissing(departmentData));
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

export const createShelf = async (shelfData) => {
  const response = await axios.post('/storage/shelves/', addCodeIfMissing(shelfData));
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
  // Asegurarnos de solicitar datos expandidos
  const queryParams = {
    ...params,
    expand: 'shelf,shelf__department,shelf__department__warehouse'
  };
  
  const response = await axios.get('/storage/trays/', { params: queryParams });
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

export const createTray = async (trayData) => {
  const response = await axios.post('/storage/trays/', addCodeIfMissing(trayData));
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
export const getMaterialLocations = async (materialId, params = {}) => {
  try {
    // Si materialId se pasa como número, usarlo en la URL
    if (materialId && typeof materialId !== 'object') {
      const response = await axios.get(`/storage/materials/${materialId}/locations/`, { params });
      return response.data;
    } 
    // Si se pasa un objeto de parámetros o materialId es un objeto, usarlo como params
    else {
      const queryParams = typeof materialId === 'object' ? materialId : params;
      const response = await axios.get('/storage/locations/', { params: queryParams });
      return response.data;
    }
  } catch (error) {
    console.error('Error al obtener ubicaciones del material:', error);
    throw error;
  }
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

export const createMaterialLocation = async (locationData) => {
  try {
    // Eliminar explícitamente el campo code si existe
    const dataToSend = { ...locationData };
    if ('code' in dataToSend) {
      delete dataToSend.code;
    }
    
    console.log("Enviando datos de ubicación:", dataToSend);
    const response = await axios.post('/storage/locations/', dataToSend);
    return response.data;
  } catch (error) {
    console.error("Error al crear ubicación de material:", error);
    throw error;
  }
};

export const updateMaterialLocation = async (id, data) => {
  try {
    console.log('Actualizando ubicación con datos:', data); // Añadir log
    const response = await axios.put(`/storage/locations/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error en updateMaterialLocation:', error);
    
    // Proveer información más detallada sobre el error
    if (error.response && error.response.data) {
      console.error('Respuesta de error del servidor:', error.response.data);
    }
    throw error;
  }
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