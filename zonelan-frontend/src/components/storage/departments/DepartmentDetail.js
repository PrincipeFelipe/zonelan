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
  BusinessOutlined, Dashboard as ShelfIcon
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getDepartmentDetails,
  updateDepartment,
  deleteDepartment,
  createShelf,
  updateShelf,
  deleteShelf
} from '../../../services/storageService';

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openShelfDialog, setOpenShelfDialog] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  const [shelfForm, setShelfForm] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchDepartmentDetails();
  }, [id]);

  const fetchDepartmentDetails = async () => {
    try {
      setLoading(true);
      const data = await getDepartmentDetails(id);
      setDepartment(data);
      setDepartmentForm({
        name: data.name || '',
        description: data.description || '',
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error al cargar los detalles de la dependencia:', error);
      toast.error('Error al cargar los detalles de la dependencia');
      navigate('/dashboard/storage/warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setDepartmentForm({
      ...departmentForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleShelfInputChange = (e) => {
    const { name, value, checked } = e.target;
    setShelfForm({
      ...shelfForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      await updateDepartment(id, departmentForm);
      toast.success('Dependencia actualizada correctamente');
      setOpenDialog(false);
      fetchDepartmentDetails();
    } catch (error) {
      console.error('Error al actualizar la dependencia:', error);
      toast.error('Error al actualizar la dependencia');
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la dependencia "${department.name}"? Esta acción no se puede deshacer y eliminará todas las estanterías y baldas asociadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteDepartment(id);
        toast.success('Dependencia eliminada correctamente');
        navigate(`/dashboard/storage/warehouses/${department.warehouse}`);
      }
    } catch (error) {
      console.error('Error al eliminar la dependencia:', error);
      toast.error('Error al eliminar la dependencia');
    }
  };

  const handleOpenShelfDialog = (shelf = null) => {
    if (shelf) {
      setEditingShelf(shelf);
      setShelfForm({
        name: shelf.name,
        description: shelf.description || '',
        is_active: shelf.is_active
      });
    } else {
      setEditingShelf(null);
      setShelfForm({
        name: '',
        description: '',
        is_active: true
      });
    }
    setOpenShelfDialog(true);
  };

  const handleCloseShelfDialog = () => {
    setOpenShelfDialog(false);
    setEditingShelf(null);
  };

  const handleSubmitShelf = async (e) => {
    e.preventDefault();
    try {
      if (!shelfForm.name) {
        toast.error('El nombre de la estantería es obligatorio');
        return;
      }

      if (editingShelf) {
        await updateShelf(editingShelf.id, shelfForm);
        toast.success('Estantería actualizada correctamente');
      } else {
        await createShelf({
          ...shelfForm,
          department: id
        });
        toast.success('Estantería creada correctamente');
      }
      
      handleCloseShelfDialog();
      fetchDepartmentDetails();
    } catch (error) {
      console.error('Error al guardar la estantería:', error);
      toast.error('Error al guardar la estantería');
    }
  };

  const handleDeleteShelf = async (shelfId, shelfName) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la estantería "${shelfName}"? Esta acción no se puede deshacer y eliminará todas las baldas asociadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteShelf(shelfId);
        toast.success('Estantería eliminada correctamente');
        fetchDepartmentDetails();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la estantería');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!department) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Dependencia no encontrada</Typography>
        <Button
          component={RouterLink}
          to="/dashboard/storage/warehouses"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Volver a la lista
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
        <Link
          component={RouterLink}
          to={`/dashboard/storage/warehouses/${department.warehouse}`}
          underline="hover"
          color="inherit"
        >
          {department.warehouse_name}
        </Link>
        <Typography color="text.primary">{department.name}</Typography>
      </Breadcrumbs>
      
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessOutlined sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{department.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {department.code || 'Sin código'}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setOpenDialog(true)}
            sx={{ mr: 1 }}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteDepartment}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
      
      {/* Información de la dependencia */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Almacén
            </Typography>
            <Typography variant="body1">
              {department.warehouse_name || 'No especificado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Estado
            </Typography>
            {department.is_active ? (
              <Chip 
                label="Activo" 
                color="success" 
                variant="outlined" 
                size="small"
              />
            ) : (
              <Chip 
                label="Inactivo" 
                color="error" 
                variant="outlined" 
                size="small"
              />
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Descripción
            </Typography>
            <Typography variant="body1">
              {department.description || 'Sin descripción'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Estanterías */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Estanterías
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenShelfDialog()}
        >
          Nueva Estantería
        </Button>
      </Box>
      
      {department.shelves?.length > 0 ? (
        <Grid container spacing={2}>
          {department.shelves.map((shelf) => (
            <Grid item xs={12} sm={6} md={4} key={shelf.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShelfIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {shelf.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Código: {shelf.code || 'Sin código'}
                    </Typography>
                    {shelf.is_active ? (
                      <Chip 
                        label="Activo" 
                        color="success" 
                        variant="outlined" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        label="Inactivo" 
                        color="error" 
                        variant="outlined" 
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {shelf.description || 'Sin descripción'}
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Baldas: {shelf.trays?.length || 0}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => navigate(`/dashboard/storage/shelves/${shelf.id}`)}
                  >
                    Ver Detalles
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => handleOpenShelfDialog(shelf)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteShelf(shelf.id, shelf.name)}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Esta dependencia no tiene estanterías
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleOpenShelfDialog()}
            sx={{ mt: 2 }}
          >
            Añadir Estantería
          </Button>
        </Paper>
      )}

      {/* Diálogo de edición de la dependencia */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Dependencia</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la dependencia"
                  fullWidth
                  value={departmentForm.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={department.code || ''}
                  disabled
                  helperText="El código se genera automáticamente y no puede ser modificado"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={4}
                  value={departmentForm.description || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={departmentForm.is_active}
                      onChange={handleInputChange}
                    />
                  }
                  label="Dependencia activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateDepartment}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de estantería */}
      <Dialog open={openShelfDialog} onClose={handleCloseShelfDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingShelf ? 'Editar Estantería' : 'Nueva Estantería'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la estantería"
                  fullWidth
                  value={shelfForm.name}
                  onChange={handleShelfInputChange}
                  required
                />
              </Grid>
              {editingShelf && (
                <Grid item xs={12}>
                  <TextField
                    name="code"
                    label="Código"
                    fullWidth
                    value={editingShelf.code || ''}
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
                  rows={3}
                  value={shelfForm.description || ''}
                  onChange={handleShelfInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={shelfForm.is_active}
                      onChange={handleShelfInputChange}
                    />
                  }
                  label="Estantería activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShelfDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitShelf}
          >
            {editingShelf ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentDetail;