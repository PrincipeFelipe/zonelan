import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper,
  Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Breadcrumbs, Link, Alert,
  FormControlLabel, Switch
} from '@mui/material';
import { Save, ArrowBack, ViewStream as TrayIcon } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';

import {
  getTrayById,
  createTray,
  updateTray,
  getShelves,
  getDepartments,
  getWarehouses
} from '../../../services/storageService';

const TrayForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shelf: '',
    is_active: true
  });

  useEffect(() => {
    fetchInitialData();
    if (isEditing) {
      fetchTrayData();
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
      setFormData(prev => ({
        ...prev,
        shelf: ''
      }));
    }
  }, [selectedDepartment]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const warehousesData = await getWarehouses();
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrayData = async () => {
    setLoading(true);
    try {
      const data = await getTrayById(id);
      
      setFormData({
        name: data.name || '',
        description: data.description || '',
        shelf: data.shelf.toString(),
        is_active: data.is_active
      });
      
      // Obtener los datos de la jerarquía completa
      try {
        const shelfData = await getShelves({ id: data.shelf });
        if (shelfData.length > 0) {
          const departmentId = shelfData[0].department;
          setSelectedDepartment(departmentId);
          
          const departmentData = await getDepartments({ id: departmentId });
          if (departmentData.length > 0 && departmentData[0].warehouse) {
            setSelectedWarehouse(departmentData[0].warehouse);
            await fetchDepartments(departmentData[0].warehouse);
            await fetchShelves(departmentId);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos jerárquicos:', error);
      }
    } catch (error) {
      console.error('Error al cargar datos de la balda:', error);
      setError('Error al cargar los datos de la balda');
      navigate('/dashboard/storage/trays');
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

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'warehouse') {
      setSelectedWarehouse(value);
    } else if (name === 'department') {
      setSelectedDepartment(value);
    } else {
      setFormData({
        ...formData,
        [name]: name === 'is_active' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('El nombre de la balda es obligatorio');
      return;
    }
    
    if (!formData.shelf) {
      toast.error('Debe seleccionar una estantería');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing) {
        await updateTray(id, formData);
        toast.success('Balda actualizada correctamente');
      } else {
        await createTray(formData);
        toast.success('Balda creada correctamente');
      }
      navigate('/dashboard/storage/trays');
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al guardar la balda');
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
          to="/dashboard/storage/trays"
          underline="hover"
          color="inherit"
        >
          Baldas
        </Link>
        <Typography color="text.primary">
          {isEditing ? 'Editar Balda' : 'Nueva Balda'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrayIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            {isEditing ? 'Editar Balda' : 'Nueva Balda'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/storage/trays')}
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
            {!isEditing && (
              <>
                <Grid item xs={12} md={4}>
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
                
                <Grid item xs={12} md={4}>
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
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required disabled={!selectedDepartment}>
                    <InputLabel>Estantería</InputLabel>
                    <Select
                      name="shelf"
                      value={formData.shelf}
                      label="Estantería *"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Seleccione una estantería</MenuItem>
                      {shelves.map((shelf) => (
                        <MenuItem key={shelf.id} value={shelf.id.toString()}>
                          {shelf.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nombre de la balda"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción opcional de la balda"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                }
                label="Balda activa"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/dashboard/storage/trays')}
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

export default TrayForm;