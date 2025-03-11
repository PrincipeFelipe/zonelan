import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Grid, Divider,
  Card, CardContent, CardActions, IconButton,
  Breadcrumbs, Link, Chip, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel,
  Switch, LinearProgress
} from '@mui/material';
import {
  Apartment, ArrowBack, Edit, Delete, Add,
  BusinessOutlined, WarehouseOutlined
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getWarehouseDetails,
  updateWarehouse,
  deleteWarehouse,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../../../services/storageService';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    is_active: true
  });
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    warehouse: ''
  });

  useEffect(() => {
    fetchWarehouseDetails();
  }, [id]);

  const fetchWarehouseDetails = async () => {
    try {
      setLoading(true);
      const data = await getWarehouseDetails(id);
      setWarehouse(data);
      setFormData({
        name: data.name || '',
        location: data.location || '',
        description: data.description || '',
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error al cargar los detalles del almacén:', error);
      toast.error('Error al cargar los detalles del almacén');
      navigate('/dashboard/storage/warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      name: warehouse?.name || '',
      location: warehouse?.location || '',
      description: warehouse?.description || '',
      is_active: warehouse?.is_active
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDepartmentDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setDepartmentFormData({
        name: department.name || '',
        description: department.description || '',
        is_active: department.is_active,
        warehouse: id
      });
    } else {
      setEditingDepartment(null);
      setDepartmentFormData({
        name: '',
        description: '',
        is_active: true,
        warehouse: id
      });
    }
    setOpenDepartmentDialog(true);
  };

  const handleCloseDepartmentDialog = () => {
    setOpenDepartmentDialog(false);
    setEditingDepartment(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleDepartmentInputChange = (e) => {
    const { name, value, checked } = e.target;
    setDepartmentFormData({
      ...departmentFormData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleUpdateWarehouse = async () => {
    if (!formData.name) {
      toast.error('El nombre del almacén es obligatorio');
      return;
    }

    try {
      await updateWarehouse(id, formData);
      toast.success('Almacén actualizado correctamente');
      fetchWarehouseDetails();
      handleCloseDialog();
    } catch (error) {
      console.error('Error al actualizar el almacén:', error);
      toast.error('Error al actualizar el almacén');
    }
  };

  const handleDeleteWarehouse = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar el almacén "${warehouse.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteWarehouse(id);
        toast.success('Almacén eliminado correctamente');
        navigate('/dashboard/storage/warehouses');
      }
    } catch (error) {
      console.error('Error al eliminar el almacén:', error);
      toast.error('Error al eliminar el almacén');
    }
  };

  const handleSaveDepartment = async () => {
    if (!departmentFormData.name) {
      toast.error('El nombre de la dependencia es obligatorio');
      return;
    }

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, departmentFormData);
        toast.success('Dependencia actualizada correctamente');
      } else {
        await createDepartment(departmentFormData);
        toast.success('Dependencia creada correctamente');
      }
      handleCloseDepartmentDialog();
      fetchWarehouseDetails();
    } catch (error) {
      console.error('Error al guardar la dependencia:', error);
      toast.error('Error al guardar la dependencia');
    }
  };

  const handleDeleteDepartment = async (department) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar la dependencia "${department.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteDepartment(department.id);
        toast.success('Dependencia eliminada correctamente');
        fetchWarehouseDetails();
      }
    } catch (error) {
      console.error('Error al eliminar la dependencia:', error);
      toast.error('Error al eliminar la dependencia');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando detalles del almacén...</Typography>
      </Box>
    );
  }

  if (!warehouse) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="error">
          No se pudo cargar la información del almacén
        </Typography>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/dashboard/storage/warehouses')}
          sx={{ mt: 2 }}
        >
          Volver a la lista de almacenes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
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
          to="/dashboard/storage/warehouses"
          underline="hover"
          color="inherit"
        >
          Almacenes
        </Link>
        <Typography color="text.primary">{warehouse.name}</Typography>
      </Breadcrumbs>
      
      {/* Información del almacén */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarehouseOutlined fontSize="large" color="primary" />
            <Typography variant="h5">
              {warehouse.name}
            </Typography>
            {warehouse.is_active ? (
              <Chip 
                label="Activo" 
                color="success" 
                size="small" 
                variant="outlined"
              />
            ) : (
              <Chip 
                label="Inactivo" 
                color="error" 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Box>
            <Tooltip title="Editar almacén">
              <IconButton onClick={handleOpenDialog} color="primary">
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar almacén">
              <IconButton onClick={handleDeleteWarehouse} color="error">
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Código</Typography>
            <Typography variant="body1">{warehouse.code || 'No asignado'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Ubicación</Typography>
            <Typography variant="body1">{warehouse.location || 'No especificada'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">Descripción</Typography>
            <Typography variant="body1">{warehouse.description || 'Sin descripción'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Dependencias del almacén */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Dependencias
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpenDepartmentDialog()}
        >
          Nueva Dependencia
        </Button>
      </Box>

      <Grid container spacing={2}>
        {warehouse.departments && warehouse.departments.length > 0 ? (
          warehouse.departments.map((department) => (
            <Grid item xs={12} md={6} lg={4} key={department.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Apartment color="primary" />
                    <Typography variant="h6">
                      {department.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Código: {department.code || 'No asignado'}
                  </Typography>
                  {department.is_active ? (
                    <Chip 
                      label="Activo" 
                      color="success" 
                      size="small" 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      label="Inactivo" 
                      color="error" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => navigate(`/dashboard/storage/departments/${department.id}`)}
                  >
                    Ver Detalles
                  </Button>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenDepartmentDialog(department)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteDepartment(department)}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay dependencias registradas para este almacén
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<Add />} 
                sx={{ mt: 2 }}
                onClick={() => handleOpenDepartmentDialog()}
              >
                Añadir Dependencia
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Diálogo para editar el almacén */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Almacén</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre del almacén"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              {warehouse.code && (
                <Grid item xs={12}>
                  <TextField
                    name="code"
                    label="Código"
                    fullWidth
                    value={warehouse.code}
                    disabled
                    helperText="El código se genera automáticamente y no puede ser modificado"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  name="location"
                  label="Ubicación"
                  fullWidth
                  value={formData.location}
                  onChange={handleInputChange}
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
                  label="Almacén activo"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateWarehouse}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear/editar dependencia */}
      <Dialog open={openDepartmentDialog} onClose={handleCloseDepartmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDepartment ? 'Editar Dependencia' : 'Nueva Dependencia'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la dependencia"
                  fullWidth
                  value={departmentFormData.name}
                  onChange={handleDepartmentInputChange}
                  required
                />
              </Grid>
              {editingDepartment && editingDepartment.code && (
                <Grid item xs={12}>
                  <TextField
                    name="code"
                    label="Código"
                    fullWidth
                    value={editingDepartment.code}
                    disabled
                    helperText="El código se genera automáticamente y no puede ser modificado"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={4}
                  value={departmentFormData.description}
                  onChange={handleDepartmentInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={departmentFormData.is_active}
                      onChange={handleDepartmentInputChange}
                    />
                  }
                  label="Dependencia activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDepartmentDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveDepartment}
          >
            {editingDepartment ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseDetail;