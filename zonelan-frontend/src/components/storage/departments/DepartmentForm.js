import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, 
  Paper, Grid, FormControlLabel, Switch,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Breadcrumbs, Link
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

import { 
  getDepartmentById, 
  createDepartment, 
  updateDepartment,
  getWarehouses
} from '../../../services/storageService';

const DepartmentForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    warehouse: '',
    is_active: true
  });

  useEffect(() => {
    fetchWarehouses();
    if (isEditing) {
      fetchDepartment(id);
    }
  }, [id]);

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      toast.error('Error al cargar la lista de almacenes');
    }
  };

  const fetchDepartment = async (departmentId) => {
    try {
      setLoading(true);
      const department = await getDepartmentById(departmentId);
      setFormData({
        name: department.name || '',
        description: department.description || '',
        warehouse: department.warehouse || '',
        is_active: department.is_active
      });
    } catch (error) {
      console.error('Error al cargar la dependencia:', error);
      toast.error('Error al cargar los datos de la dependencia');
      navigate('/dashboard/storage/departments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('El nombre de la dependencia es obligatorio');
      return;
    }
    
    if (!formData.warehouse) {
      toast.error('Debe seleccionar un almacén');
      return;
    }
    
    try {
      setSaving(true);
      if (isEditing) {
        await updateDepartment(id, formData);
        toast.success('Dependencia actualizada correctamente');
        navigate(`/dashboard/storage/departments/${id}`);
      } else {
        const newDepartment = await createDepartment(formData);
        toast.success('Dependencia creada correctamente');
        navigate(`/dashboard/storage/departments/${newDepartment.id}`);
      }
    } catch (error) {
      console.error('Error al guardar la dependencia:', error);
      toast.error('Error al guardar la dependencia');
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
    <Box>
      <Toaster position="top-right" />
      
      {/* Breadcrumbs */}
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
          to="/dashboard/storage/departments"
          underline="hover"
          color="inherit"
        >
          Dependencias
        </Link>
        <Typography color="text.primary">
          {isEditing ? 'Editar Dependencia' : 'Nueva Dependencia'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Editar Dependencia' : 'Nueva Dependencia'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Almacén</InputLabel>
                <Select
                  name="warehouse"
                  value={formData.warehouse}
                  label="Almacén *"
                  onChange={handleInputChange}
                  disabled={isEditing} // No permitir cambio de almacén en edición
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nombre de la dependencia"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Código"
                  value={id || ''}
                  fullWidth
                  disabled
                  helperText="El código se genera automáticamente y no puede ser modificado"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
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
                label="Dependencia activa"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate(-1)}
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

export default DepartmentForm;