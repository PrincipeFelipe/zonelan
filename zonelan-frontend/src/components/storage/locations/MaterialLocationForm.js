import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Breadcrumbs, Link, Alert
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../../utils/axiosConfig';

import {
  getMaterialLocationById,
  createMaterialLocation,
  updateMaterialLocation,
  getWarehouses,
  getDepartments,
  getShelves,
  getTrays
} from '../../../services/storageService';

const MaterialLocationForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para los datos de filtrado
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [trays, setTrays] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    material: '',
    tray: '',
    quantity: 0,
    minimum_quantity: 0
  });

  // Estados para la navegación jerárquica
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedShelf, setSelectedShelf] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchLocationData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchDepartments(selectedWarehouse);
    } else {
      setDepartments([]);
      setSelectedDepartment('');
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchShelves(selectedDepartment);
    } else {
      setShelves([]);
      setSelectedShelf('');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedShelf) {
      fetchTrays(selectedShelf);
    } else {
      setTrays([]);
      setFormData(prev => ({ ...prev, tray: '' }));
    }
  }, [selectedShelf]);

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

  const fetchLocationData = async () => {
    setLoading(true);
    try {
      const data = await getMaterialLocationById(id);
      
      setFormData({
        material: data.material,
        tray: data.tray,
        quantity: data.quantity,
        minimum_quantity: data.minimum_quantity
      });

      // Obtener información de la balda para establecer la jerarquía
      const trayData = await axios.get(`/storage/trays/${data.tray}/`);
      
      setSelectedShelf(trayData.data.shelf);
      
      // Obtener información de la estantería
      const shelfData = await axios.get(`/storage/shelves/${trayData.data.shelf}/`);
      
      setSelectedDepartment(shelfData.data.department);
      
      // Obtener información del departamento
      const departmentData = await axios.get(`/storage/departments/${shelfData.data.department}/`);
      
      setSelectedWarehouse(departmentData.data.warehouse);
      
      // Cargar los datos dependientes en cascada
      await fetchDepartments(departmentData.data.warehouse);
      await fetchShelves(shelfData.data.department);
      await fetchTrays(trayData.data.shelf);
      
    } catch (error) {
      console.error('Error al cargar datos de la ubicación:', error);
      setError('Error al cargar los datos de la ubicación');
      navigate('/dashboard/storage/locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (warehouseId) => {
    try {
      const data = await getDepartments({ warehouse: warehouseId });
      setDepartments(data);
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
    }
  };

  const fetchShelves = async (departmentId) => {
    try {
      const data = await getShelves({ department: departmentId });
      setShelves(data);
    } catch (error) {
      console.error('Error al cargar estanterías:', error);
    }
  };

  const fetchTrays = async (shelfId) => {
    try {
      const data = await getTrays({ shelf: shelfId });
      setTrays(data);
    } catch (error) {
      console.error('Error al cargar baldas:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'warehouse') {
      setSelectedWarehouse(value);
    } else if (name === 'department') {
      setSelectedDepartment(value);
    } else if (name === 'shelf') {
      setSelectedShelf(value);
    } else {
      setFormData({
        ...formData,
        [name]: name === 'quantity' || name === 'minimum_quantity' ? Number(value) : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.material) {
      toast.error('Debe seleccionar un material');
      return;
    }
    
    if (!formData.tray) {
      toast.error('Debe seleccionar una balda');
      return;
    }
    
    if (formData.quantity < 0) {
      toast.error('La cantidad no puede ser negativa');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing) {
        await updateMaterialLocation(id, formData);
        toast.success('Ubicación de material actualizada correctamente');
      } else {
        await createMaterialLocation(formData);
        toast.success('Ubicación de material creada correctamente');
      }
      navigate('/dashboard/storage/locations');
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al guardar la ubicación');
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
          to="/dashboard/storage/locations"
          underline="hover"
          color="inherit"
        >
          Ubicaciones
        </Link>
        <Typography color="text.primary">
          {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Editar Ubicación de Material' : 'Nueva Ubicación de Material'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/storage/locations')}
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
                <InputLabel>Material</InputLabel>
                <Select
                  name="material"
                  value={formData.material}
                  label="Material *"
                  onChange={handleInputChange}
                >
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Almacén</InputLabel>
                <Select
                  name="warehouse"
                  value={selectedWarehouse}
                  label="Almacén *"
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
              <FormControl fullWidth required disabled={!selectedWarehouse}>
                <InputLabel>Dependencia</InputLabel>
                <Select
                  name="department"
                  value={selectedDepartment}
                  label="Dependencia *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Seleccione una dependencia</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!selectedDepartment}>
                <InputLabel>Estantería</InputLabel>
                <Select
                  name="shelf"
                  value={selectedShelf}
                  label="Estantería *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Seleccione una estantería</MenuItem>
                  {shelves.map((shelf) => (
                    <MenuItem key={shelf.id} value={shelf.id}>
                      {shelf.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!selectedShelf}>
                <InputLabel>Balda</InputLabel>
                <Select
                  name="tray"
                  value={formData.tray}
                  label="Balda *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Seleccione una balda</MenuItem>
                  {trays.map((tray) => (
                    <MenuItem key={tray.id} value={tray.id}>
                      {`${tray.name} ${tray.full_code ? `(${tray.full_code})` : ''}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="quantity"
                label="Cantidad"
                type="number"
                fullWidth
                value={formData.quantity}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="minimum_quantity"
                label="Cantidad mínima"
                type="number"
                fullWidth
                value={formData.minimum_quantity}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Nivel mínimo para alertas de stock"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/dashboard/storage/locations')}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={saving}
              >
                {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default MaterialLocationForm;