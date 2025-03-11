import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Grid, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Breadcrumbs, Link, Alert,
  CircularProgress
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

import {
  getShelfById,
  createShelf,
  updateShelf,
  getDepartments
} from '../../../services/storageService';

const ShelfForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos para el selector de departamentos
  const [departments, setDepartments] = useState([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    is_active: true
  });

  useEffect(() => {
    fetchDepartments();
    if (isEditing) {
      fetchShelf();
    }
  }, [id]);

  const fetchShelf = async () => {
    try {
      setLoading(true);
      const data = await getShelfById(id);
      setFormData({
        name: data.name,
        description: data.description || '',
        department: data.department,
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error al cargar la estantería:', error);
      setError('Error al cargar los datos de la estantería');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments({ is_active: true });
      setDepartments(data);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      setError('Error al cargar los departamentos');
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
      toast.error('El nombre de la estantería es obligatorio');
      return;
    }
    
    if (!formData.department) {
      toast.error('Debe seleccionar una dependencia');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing) {
        await updateShelf(id, formData);
        toast.success('Estantería actualizada correctamente');
      } else {
        await createShelf(formData);
        toast.success('Estantería creada correctamente');
      }
      navigate(`/dashboard/storage/departments/${formData.department}`);
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al guardar los datos');
      toast.error('Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !departments.length) {
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
          to="/dashboard/storage/departments"
          underline="hover"
          color="inherit"
        >
          Dependencias
        </Link>
        {isEditing && formData.department && (
          <Link 
            component={RouterLink} 
            to={`/dashboard/storage/departments/${formData.department}`}
            underline="hover"
            color="inherit"
          >
            {departments.find(d => d.id === parseInt(formData.department))?.name || 'Dependencia'}
          </Link>
        )}
        <Typography color="text.primary">
          {isEditing ? 'Editar Estantería' : 'Nueva Estantería'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Editar Estantería' : 'Nueva Estantería'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Dependencia</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  label="Dependencia *"
                  onChange={handleInputChange}
                  disabled={isEditing} // No permitir cambio de dependencia en edición
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name} {department.warehouse_name && `(${department.warehouse_name})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nombre de la estantería"
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
                label="Estantería activa"
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

export default ShelfForm;