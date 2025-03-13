import authService from '../../../services/authService';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Breadcrumbs, Link, Alert,
  FormHelperText, Divider
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../../utils/axiosConfig';

import {
  getMaterialMovementById,
  createMaterialMovement,
  getWarehouses,
  getDepartments,
  getShelves,
  getTrays,
  getMaterialLocations
} from '../../../services/storageService';

const MaterialMovementForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para los datos
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [sourceTrays, setSourceTrays] = useState([]);
  const [targetTrays, setTargetTrays] = useState([]);
  const [sourceLocations, setSourceLocations] = useState([]);
  const [targetLocations, setTargetLocations] = useState([]);

  // Estados separados para origen y destino
  const [sourceDepartments, setSourceDepartments] = useState([]);
  const [targetDepartments, setTargetDepartments] = useState([]);
  const [sourceShelves, setSourceShelves] = useState([]);
  const [targetShelves, setTargetShelves] = useState([]);

  // Estados para los elementos seleccionados (origen)
  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState('');
  const [selectedSourceDepartment, setSelectedSourceDepartment] = useState('');
  const [selectedSourceShelf, setSelectedSourceShelf] = useState('');
  const [selectedSourceTray, setSelectedSourceTray] = useState('');
  const [selectedSourceLocation, setSelectedSourceLocation] = useState('');

  // Estados para los elementos seleccionados (destino)
  const [selectedTargetWarehouse, setSelectedTargetWarehouse] = useState('');
  const [selectedTargetDepartment, setSelectedTargetDepartment] = useState('');
  const [selectedTargetShelf, setSelectedTargetShelf] = useState('');
  const [selectedTargetTray, setSelectedTargetTray] = useState('');
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    material: '',
    quantity: 1,
    operation: 'TRANSFER',
    source_location: '',
    target_location: '',
    target_tray: '',
    notes: ''
  });

  // Añadir un nuevo estado para almacenar todas las ubicaciones del material seleccionado
  const [materialLocations, setMaterialLocations] = useState([]);
  const [showMaterialLocations, setShowMaterialLocations] = useState(false);

  // Añadir estos estados
  const [loadingSourceHierarchy, setLoadingSourceHierarchy] = useState(false);
  const [loadingTargetHierarchy, setLoadingTargetHierarchy] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchMovementData();
    }
  }, [id]);

  // Cascada para ubicación de origen
  useEffect(() => {
    if (selectedSourceWarehouse) {
      fetchDepartments(selectedSourceWarehouse, 'source');
    } else {
      setSelectedSourceDepartment('');
      setSourceDepartments([]);
    }
  }, [selectedSourceWarehouse]);

  useEffect(() => {
    if (selectedSourceDepartment) {
      fetchShelves(selectedSourceDepartment, 'source');
    } else {
      setSelectedSourceShelf('');
      setSourceShelves([]); // Cambiado de setShelves a setSourceShelves
    }
  }, [selectedSourceDepartment]);

  useEffect(() => {
    if (selectedSourceShelf) {
      fetchTrays(selectedSourceShelf, 'source');
    } else {
      setSelectedSourceTray('');
      setSourceTrays([]);
    }
  }, [selectedSourceShelf]);

  useEffect(() => {
    if (selectedSourceTray) {
      fetchLocations(selectedSourceTray, 'source');
    } else {
      setSelectedSourceLocation('');
      setSourceLocations([]);
    }
  }, [selectedSourceTray]);

  // Cascada para ubicación de destino
  useEffect(() => {
    if (selectedTargetWarehouse) {
      fetchDepartments(selectedTargetWarehouse, 'target');
    } else {
      setSelectedTargetDepartment('');
      setTargetDepartments([]);
    }
  }, [selectedTargetWarehouse]);

  useEffect(() => {
    if (selectedTargetDepartment) {
      fetchShelves(selectedTargetDepartment, 'target');
    } else {
      setSelectedTargetShelf('');
      setTargetShelves([]); // Cambiado de setShelves a setTargetShelves
    }
  }, [selectedTargetDepartment]);

  useEffect(() => {
    if (selectedTargetShelf) {
      fetchTrays(selectedTargetShelf, 'target');
    } else {
      setSelectedTargetTray('');
      setTargetTrays([]);
    }
  }, [selectedTargetShelf]);

  useEffect(() => {
    if (selectedTargetTray) {
      fetchLocations(selectedTargetTray, 'target');
    } else {
      setTargetLocations([]);
    }
  }, [selectedTargetTray]);

  // Actualizar formulario cuando cambia la ubicación de origen
  useEffect(() => {
    if (selectedSourceLocation) {
      const location = sourceLocations.find(loc => loc.id === parseInt(selectedSourceLocation));
      if (location) {
        setFormData(prev => ({
          ...prev,
          material: location.material,
          source_location: location.id
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        source_location: ''
      }));
    }
  }, [selectedSourceLocation]);

  // Actualizar formulario cuando cambia la selección de material
  useEffect(() => {
    if (formData.material && selectedSourceTray) {
      // Buscar si el material ya existe en la ubicación
      const existingLocation = sourceLocations.find(loc => loc.material === parseInt(formData.material));
      if (existingLocation) {
        setSelectedSourceLocation(existingLocation.id.toString());
        setFormData(prev => ({
          ...prev,
          source_location: existingLocation.id
        }));
      }
    }
  }, [formData.material, sourceLocations]);

  // Actualizar formulario cuando cambia la ubicación de destino
  useEffect(() => {
    if (formData.material && selectedTargetTray) {
      // Buscar si el material ya existe en la ubicación de destino
      const existingLocation = targetLocations.find(loc => loc.material === parseInt(formData.material));
      if (existingLocation) {
        setFormData(prev => ({
          ...prev,
          target_location: existingLocation.id,
          target_tray: '' // Si hay ubicación existente, no necesitamos target_tray
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          target_location: '',
          target_tray: selectedTargetTray
        }));
      }
    }
  }, [formData.material, selectedTargetTray, targetLocations]);

  // Añadir este efecto para cargar las ubicaciones cuando cambie el material seleccionado
  useEffect(() => {
    if (formData.material) {
      fetchMaterialLocationsForMaterial(formData.material);
    } else {
      setMaterialLocations([]);
      setShowMaterialLocations(false);
    }
  }, [formData.material]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [warehousesData, materialsData] = await Promise.all([
        getWarehouses(),
        axios.get('/materials/materials/')
      ]);
      
      setWarehouses(warehousesData);
      setMaterials(materialsData.data);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovementData = async () => {
    setLoading(true);
    try {
      const data = await getMaterialMovementById(id);
      
      setFormData({
        material: data.material,
        quantity: data.quantity,
        operation: data.operation,
        source_location: data.source_location || '',
        target_location: data.target_location || '',
        target_tray: data.target_tray || '',
        notes: data.notes || ''
      });

      // Cargar las jerarquías de origen y destino si existen
      if (data.source_location) {
        try {
          const sourceLocationData = await axios.get(`/storage/locations/${data.source_location}/`);
          const sourceTrayData = await axios.get(`/storage/trays/${sourceLocationData.data.tray}/`);
          
          // Primero establecer los niveles superiores de la jerarquía
          const sourceShelfData = await axios.get(`/storage/shelves/${sourceTrayData.data.shelf}/`);
          const sourceDepartmentData = await axios.get(`/storage/departments/${sourceShelfData.data.department}/`);
          
          // Establecer los valores en orden desde el más alto al más bajo
          setSelectedSourceWarehouse(sourceDepartmentData.data.warehouse);
          
          // Esperar a que se carguen los datos en cascada antes de establecer los siguientes valores
          await fetchDepartments(sourceDepartmentData.data.warehouse, 'source');
          setSelectedSourceDepartment(sourceShelfData.data.department);
          
          await fetchShelves(sourceShelfData.data.department, 'source');
          setSelectedSourceShelf(sourceTrayData.data.shelf);
          
          await fetchTrays(sourceTrayData.data.shelf, 'source');
          setSelectedSourceTray(sourceLocationData.data.tray);
          
          // Finalmente cargar las ubicaciones
          await fetchLocations(sourceLocationData.data.tray, 'source');
          setSelectedSourceLocation(data.source_location);
        } catch (error) {
          console.error('Error al cargar la ubicación de origen:', error);
        }
      }

      if (data.target_location) {
        const targetLocationData = await axios.get(`/storage/locations/${data.target_location}/`);
        const targetTrayData = await axios.get(`/storage/trays/${targetLocationData.data.tray}/`);
        
        setSelectedTargetTray(targetTrayData.data.id);
        
        const targetShelfData = await axios.get(`/storage/shelves/${targetTrayData.data.shelf}/`);
        setSelectedTargetShelf(targetShelfData.data.id);
        
        const targetDepartmentData = await axios.get(`/storage/departments/${targetShelfData.data.department}/`);
        setSelectedTargetDepartment(targetDepartmentData.data.id);
        
        setSelectedTargetWarehouse(targetDepartmentData.data.warehouse);
      } else if (data.target_tray) {
        const targetTrayData = await axios.get(`/storage/trays/${data.target_tray}/`);
        
        setSelectedTargetTray(targetTrayData.data.id);
        
        const targetShelfData = await axios.get(`/storage/shelves/${targetTrayData.data.shelf}/`);
        setSelectedTargetShelf(targetShelfData.data.id);
        
        const targetDepartmentData = await axios.get(`/storage/departments/${targetShelfData.data.department}/`);
        setSelectedTargetDepartment(targetDepartmentData.data.id);
        
        setSelectedTargetWarehouse(targetDepartmentData.data.warehouse);
      }
      
    } catch (error) {
      console.error('Error al cargar datos del movimiento:', error);
      setError('Error al cargar los datos del movimiento');
      navigate('/dashboard/storage/movements');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (warehouseId, type) => {
    try {
      const data = await getDepartments({ warehouse: warehouseId });
      // No sobrescribir departments directamente, guardar en arrays separados
      if (type === 'source') {
        setSourceDepartments(data);
      } else {
        setTargetDepartments(data);
      }
    } catch (error) {
      console.error(`Error al cargar dependencias (${type}):`, error);
    }
  };

  const fetchShelves = async (departmentId, type) => {
    try {
      const data = await getShelves({ department: departmentId });
      if (type === 'source') {
        setSourceShelves(data);
      } else {
        setTargetShelves(data);
      }
    } catch (error) {
      console.error(`Error al cargar estanterías (${type}):`, error);
    }
  };

  const fetchTrays = async (shelfId, type) => {
    try {
      const data = await getTrays({ shelf: shelfId });
      if (type === 'source') {
        setSourceTrays(data);
      } else {
        setTargetTrays(data);
      }
    } catch (error) {
      console.error(`Error al cargar baldas (${type}):`, error);
    }
  };

  const fetchLocations = async (trayId, type) => {
    try {
      const data = await getMaterialLocations({ tray: trayId });
      if (type === 'source') {
        setSourceLocations(data);
      } else {
        setTargetLocations(data);
      }
    } catch (error) {
      console.error(`Error al cargar ubicaciones (${type}):`, error);
    }
  };

  // Añadir esta función para obtener todas las ubicaciones de un material
  const fetchMaterialLocationsForMaterial = async (materialId) => {
    try {
      const locationsData = await getMaterialLocations({ material: materialId });
      const locationsWithStock = locationsData.filter(loc => loc.quantity > 0);
      setMaterialLocations(locationsWithStock);
      setShowMaterialLocations(locationsWithStock.length > 0);
    } catch (error) {
      console.error('Error al cargar ubicaciones del material:', error);
      toast.error('Error al cargar ubicaciones del material');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar los selectores de jerarquía
    if (name === 'sourceWarehouse') {
      setSelectedSourceWarehouse(value);
    } else if (name === 'sourceDepartment') {
      setSelectedSourceDepartment(value);
    } else if (name === 'sourceShelf') {
      setSelectedSourceShelf(value);
    } else if (name === 'sourceTray') {
      setSelectedSourceTray(value);
    } else if (name === 'sourceLocation') {
      setSelectedSourceLocation(value);
    } else if (name === 'targetWarehouse') {
      setSelectedTargetWarehouse(value);
    } else if (name === 'targetDepartment') {
      setSelectedTargetDepartment(value);
    } else if (name === 'targetShelf') {
      setSelectedTargetShelf(value);
    } else if (name === 'targetTray') {
      setSelectedTargetTray(value);
    } else if (name === 'operation') {
      // Si cambia la operación, actualizar los campos requeridos
      if (value === 'ADD') {
        // Para entrada, solo necesitamos destino
        setFormData({
          ...formData,
          operation: value,
          source_location: ''
        });
      } else if (value === 'REMOVE') {
        // Para salida, solo necesitamos origen
        setFormData({
          ...formData,
          operation: value,
          target_location: '',
          target_tray: ''
        });
      } else {
        // Para traslado, necesitamos ambos
        setFormData({
          ...formData,
          operation: value
        });
      }
    } else {
      // Para el resto de campos del formulario
      setFormData({
        ...formData,
        [name]: name === 'quantity' ? (value && !isNaN(value) ? Number(value) : 0) : value
      });
    }
  };

  // Modificar la función handleSelectLocationAsSource
const handleSelectLocationAsSource = async (location) => {
  try {
    setLoadingSourceHierarchy(true);
    
    // Obtener los datos completos en paralelo
    const trayResponse = axios.get(`/storage/trays/${location.tray}/`);
    
    // Mientras se obtiene la respuesta, actualizar el ID del material y la ubicación de origen
    setFormData(prev => ({
      ...prev,
      source_location: location.id,
      material: location.material
    }));
    
    // Esperar a que llegue la respuesta del tray
    const trayData = (await trayResponse).data;
    
    // Obtener los datos de shelf y department en paralelo
    const shelfResponse = axios.get(`/storage/shelves/${trayData.shelf}/`);
    const shelfData = (await shelfResponse).data;
    
    const departmentResponse = axios.get(`/storage/departments/${shelfData.department}/`);
    const departmentData = (await departmentResponse).data;
    
    // Ahora configurar la cascada de selecciones
    setSelectedSourceWarehouse(departmentData.warehouse);
    await fetchDepartments(departmentData.warehouse, 'source');
    
    setSelectedSourceDepartment(shelfData.department);
    await fetchShelves(shelfData.department, 'source');
    
    setSelectedSourceShelf(trayData.shelf);
    await fetchTrays(trayData.shelf, 'source');
    
    setSelectedSourceTray(location.tray);
    await fetchLocations(location.tray, 'source');
    
    setSelectedSourceLocation(location.id);
    
    toast.success('Ubicación de origen seleccionada correctamente');
  } catch (error) {
    console.error('Error al seleccionar ubicación de origen:', error);
    toast.error('Error al seleccionar la ubicación de origen');
  } finally {
    setLoadingSourceHierarchy(false);
  }
};

// Modificar la función handleSelectLocationAsTarget
const handleSelectLocationAsTarget = async (location) => {
  try {
    setLoadingTargetHierarchy(true);
    
    // Primero obtener los datos completos de cada nivel jerárquico
    const trayData = await axios.get(`/storage/trays/${location.tray}/`);
    const shelfData = await axios.get(`/storage/shelves/${trayData.data.shelf}/`);
    const departmentData = await axios.get(`/storage/departments/${shelfData.data.department}/`);
    
    // Establecer el nivel superior primero
    setSelectedTargetWarehouse(departmentData.data.warehouse);
    
    // Esperar a que se carguen los departamentos
    await fetchDepartments(departmentData.data.warehouse, 'target');
    setSelectedTargetDepartment(shelfData.data.department);
    
    // Esperar a que se carguen las estanterías
    await fetchShelves(shelfData.data.department, 'target');
    setSelectedTargetShelf(trayData.data.shelf);
    
    // Esperar a que se carguen las baldas
    await fetchTrays(trayData.data.shelf, 'target');
    setSelectedTargetTray(location.tray);
    
    // Actualizar el formulario
    setFormData(prev => ({
      ...prev,
      target_location: location.id
    }));
    
    toast.success('Ubicación de destino seleccionada correctamente');
  } finally {
    setLoadingTargetHierarchy(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones comunes
    if (!formData.material) {
      toast.error('Debe seleccionar un material');
      return;
    }
    
    if (formData.quantity <= 0) {
      toast.error('La cantidad debe ser mayor que cero');
      return;
    }

    // Validaciones específicas por tipo de operación
    if (formData.operation === 'TRANSFER') {
      if (!formData.source_location) {
        toast.error('Debe seleccionar una ubicación de origen');
        return;
      }
      if (!formData.target_location && !formData.target_tray) {
        toast.error('Debe seleccionar una ubicación de destino');
        return;
      }
      
      // Validar que no sea la misma ubicación
      if (formData.source_location && formData.source_location === formData.target_location) {
        toast.error('Las ubicaciones de origen y destino no pueden ser la misma');
        return;
      }
    } else if (formData.operation === 'ADD') {
      if (!formData.target_location && !formData.target_tray) {
        toast.error('Debe seleccionar una ubicación de destino');
        return;
      }
    } else if (formData.operation === 'REMOVE') {
      if (!formData.source_location) {
        toast.error('Debe seleccionar una ubicación de origen');
        return;
      }
    }
    
    // Verificar stock disponible en la ubicación de origen
    if (formData.source_location) {
      const sourceLocation = sourceLocations.find(loc => loc.id === parseInt(formData.source_location)) || 
                            materialLocations.find(loc => loc.id === parseInt(formData.source_location));
      
      if (sourceLocation && sourceLocation.quantity < formData.quantity) {
        toast.error(`Stock insuficiente en la ubicación de origen. Disponible: ${sourceLocation.quantity}`);
        return;
      }
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Obtener el usuario actual
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        setError('No hay usuario autenticado');
        return;
      }
      
      // Añadir el usuario a los datos del formulario
      const movementDataWithUser = {
        ...formData,
        user: currentUser.id
      };
      
      await createMaterialMovement(movementDataWithUser);
      toast.success('Movimiento registrado correctamente');
      navigate('/dashboard/storage/movements');
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al registrar el movimiento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getMaterialName = (id) => {
    const material = materials.find(m => m.id === parseInt(id));
    return material ? material.name : 'Desconocido';
  };

  const sourceLocationHasStock = () => {
    if (!formData.source_location) return true; // No validar si no hay ubicación de origen
    const location = sourceLocations.find(loc => loc.id === parseInt(formData.source_location));
    return location && location.quantity >= formData.quantity;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component={RouterLink} 
          to="/dashboard/storage"
          underline="hover"
          color="inherit"
        >
          Almacenamiento
        </Link>
        <Link 
          component={RouterLink} 
          to="/dashboard/storage/movements"
          underline="hover"
          color="inherit"
        >
          Movimientos
        </Link>
        <Typography color="text.primary">
          {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Editar Movimiento de Material' : 'Nuevo Movimiento de Material'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/storage/movements')}
        >
          Volver
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Operación</InputLabel>
                <Select
                  name="operation"
                  value={formData.operation}
                  label="Operación *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="TRANSFER">Traslado</MenuItem>
                  <MenuItem value="ADD">Entrada</MenuItem>
                  <MenuItem value="REMOVE">Salida</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.operation === 'TRANSFER' ? 'Mover material entre ubicaciones' : 
                   formData.operation === 'ADD' ? 'Añadir material a una ubicación' : 
                   'Retirar material de una ubicación'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Material</InputLabel>
                <Select
                  name="material"
                  value={formData.material}
                  label="Material *"
                  onChange={handleInputChange}
                  disabled={Boolean(formData.source_location)}
                >
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {formData.source_location ? 'Material seleccionado desde la ubicación de origen' : ''}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {showMaterialLocations && (
  <Grid item xs={12}>
    <Box sx={{ 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: 2,
      mt: 2,
      bgcolor: 'background.paper'
    }}>
      <Typography variant="subtitle1" gutterBottom>
        Ubicaciones existentes del material
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Seleccione una ubicación como origen o destino para su movimiento:
      </Typography>
      
      <Grid container spacing={2}>
        {materialLocations.map((location) => (
          <Grid item xs={12} key={location.id}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Typography variant="body2" fontWeight="medium">
                    {location.warehouse_name} &gt; {location.department_name} &gt; {location.shelf_name} &gt; {location.tray_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Código: {location.tray_full_code || 'No disponible'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2} textAlign="center">
                  <Typography variant="body2">
                    Stock disponible:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {location.quantity}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={5} textAlign="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleSelectLocationAsSource(location)}
                    disabled={formData.operation === 'ADD'}
                    sx={{ mr: 1 }}
                  >
                    Usar como origen
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={() => handleSelectLocationAsTarget(location)}
                    disabled={formData.operation === 'REMOVE'}
                  >
                    Usar como destino
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
        
        {materialLocations.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              Este material no tiene ubicaciones con stock disponible.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  </Grid>
)}
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                {formData.operation === 'REMOVE' ? 'Ubicación de origen' : 
                 formData.operation === 'ADD' ? 'Ubicación de destino' : 
                 'Ubicación de origen'}
              </Typography>
              <Divider />
            </Grid>
            
            {(formData.operation === 'TRANSFER' || formData.operation === 'REMOVE') && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Almacén (origen)</InputLabel>
                    <Select
                      name="sourceWarehouse"
                      value={selectedSourceWarehouse}
                      label="Almacén (origen) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione un almacén</MenuItem>
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedSourceWarehouse}>
                    <InputLabel>Dependencia (origen)</InputLabel>
                    <Select
                      name="sourceDepartment"
                      value={selectedSourceDepartment}
                      label="Dependencia (origen) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una dependencia</MenuItem>
                      {sourceDepartments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedSourceDepartment}>
                    <InputLabel>Estantería (origen)</InputLabel>
                    <Select
                      name="sourceShelf"
                      value={selectedSourceShelf}
                      label="Estantería (origen) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una estantería</MenuItem>
                      {sourceShelves.map((shelf) => (
                        <MenuItem key={shelf.id} value={shelf.id}>
                          {shelf.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedSourceShelf}>
                    <InputLabel>Balda (origen)</InputLabel>
                    <Select
                      name="sourceTray"
                      value={selectedSourceTray}
                      label="Balda (origen) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una balda</MenuItem>
                      {sourceTrays.map((tray) => (
                        <MenuItem key={tray.id} value={tray.id}>
                          {tray.name} {tray.full_code ? `(${tray.full_code})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required disabled={!selectedSourceTray}>
                    <InputLabel>Material en ubicación (origen)</InputLabel>
                    <Select
                      name="sourceLocation"
                      value={selectedSourceLocation}
                      label="Material en ubicación (origen) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione un material</MenuItem>
                      {sourceLocations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {getMaterialName(location.material)} - Cantidad: {location.quantity}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText error={formData.source_location && !sourceLocationHasStock()}>
                      {formData.source_location && !sourceLocationHasStock() && 
                        'Advertencia: Stock insuficiente para la cantidad seleccionada. No se puede realizar el movimiento.'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}
            
            {(formData.operation === 'TRANSFER' || formData.operation === 'ADD') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Ubicación de destino
                  </Typography>
                  <Divider />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Almacén (destino)</InputLabel>
                    <Select
                      name="targetWarehouse"
                      value={selectedTargetWarehouse}
                      label="Almacén (destino) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione un almacén</MenuItem>
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedTargetWarehouse}>
                    <InputLabel>Dependencia (destino)</InputLabel>
                    <Select
                      name="targetDepartment"
                      value={selectedTargetDepartment}
                      label="Dependencia (destino) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una dependencia</MenuItem>
                      {targetDepartments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedTargetDepartment}>
                    <InputLabel>Estantería (destino)</InputLabel>
                    <Select
                      name="targetShelf"
                      value={selectedTargetShelf}
                      label="Estantería (destino) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una estantería</MenuItem>
                      {targetShelves.map((shelf) => (
                        <MenuItem key={shelf.id} value={shelf.id}>
                          {shelf.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required disabled={!selectedTargetShelf}>
                    <InputLabel>Balda (destino)</InputLabel>
                    <Select
                      name="targetTray"
                      value={selectedTargetTray}
                      label="Balda (destino) *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una balda</MenuItem>
                      {targetTrays.map((tray) => (
                        <MenuItem key={tray.id} value={tray.id}>
                          {tray.name} {tray.full_code ? `(${tray.full_code})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                name="quantity"
                label="Cantidad"
                type="number"
                fullWidth
                value={formData.quantity}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1 } }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Observaciones"
                fullWidth
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Detalles adicionales sobre el movimiento"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/dashboard/storage/movements')}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={saving || (formData.source_location && !sourceLocationHasStock())}
              >
                {saving ? 'Guardando...' : 'Registrar Movimiento'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default MaterialMovementForm;