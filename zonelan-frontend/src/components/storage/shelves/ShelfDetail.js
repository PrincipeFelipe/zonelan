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
  Dashboard as ShelfIcon, ArrowBack, Edit, Delete, Add,
  ViewModule as TrayIcon
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getShelfDetails,
  updateShelf,
  deleteShelf,
  createTray,
  updateTray,
  deleteTray
} from '../../../services/storageService';

const ShelfDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shelf, setShelf] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTrayDialog, setOpenTrayDialog] = useState(false);
  const [editingTray, setEditingTray] = useState(null);
  
  const [shelfForm, setShelfForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  const [trayForm, setTrayForm] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchShelfDetails();
  }, [id]);

  const fetchShelfDetails = async () => {
    try {
      setLoading(true);
      const data = await getShelfDetails(id);
      setShelf(data);
      setShelfForm({
        name: data.name || '',
        description: data.description || '',
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error al cargar los detalles de la estantería:', error);
      toast.error('Error al cargar los detalles de la estantería');
      navigate('/dashboard/storage/departments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setShelfForm({
      ...shelfForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleTrayInputChange = (e) => {
    const { name, value, checked } = e.target;
    setTrayForm({
      ...trayForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleUpdateShelf = async (e) => {
    e.preventDefault();
    try {
      await updateShelf(id, shelfForm);
      toast.success('Estantería actualizada correctamente');
      setOpenDialog(false);
      fetchShelfDetails();
    } catch (error) {
      console.error('Error al actualizar la estantería:', error);
      toast.error('Error al actualizar la estantería');
    }
  };

  const handleDeleteShelf = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la estantería "${shelf.name}"? Esta acción no se puede deshacer y eliminará todas las baldas asociadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteShelf(id);
        toast.success('Estantería eliminada correctamente');
        navigate(`/dashboard/storage/departments/${shelf.department}`);
      }
    } catch (error) {
      console.error('Error al eliminar la estantería:', error);
      toast.error('Error al eliminar la estantería');
    }
  };

  const handleOpenTrayDialog = (tray = null) => {
    if (tray) {
      setEditingTray(tray);
      setTrayForm({
        name: tray.name,
        description: tray.description || '',
        is_active: tray.is_active
      });
    } else {
      setEditingTray(null);
      setTrayForm({
        name: '',
        description: '',
        is_active: true
      });
    }
    setOpenTrayDialog(true);
  };

  const handleCloseTrayDialog = () => {
    setOpenTrayDialog(false);
    setEditingTray(null);
  };

  const handleSubmitTray = async (e) => {
    e.preventDefault();
    try {
      if (!trayForm.name) {
        toast.error('El nombre de la balda es obligatorio');
        return;
      }

      if (editingTray) {
        await updateTray(editingTray.id, {
          ...trayForm,
          shelf: id
        });
        toast.success('Balda actualizada correctamente');
      } else {
        await createTray({
          ...trayForm,
          shelf: id
        });
        toast.success('Balda creada correctamente');
      }

      handleCloseTrayDialog();
      fetchShelfDetails();
    } catch (error) {
      console.error('Error:', error);
      toast.error(editingTray ? 'Error al actualizar la balda' : 'Error al crear la balda');
    }
  };

  const handleDeleteTray = async (trayId, trayName) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la balda "${trayName}"? Esta acción no se puede deshacer y podría afectar a los materiales asociados.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteTray(trayId);
        toast.success('Balda eliminada correctamente');
        fetchShelfDetails();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la balda');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!shelf) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Estantería no encontrada</Typography>
        <Button
          component={RouterLink}
          to="/dashboard/storage"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Volver al almacenamiento
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
          to={`/dashboard/storage/warehouses/${shelf.department_warehouse_id}`}
          underline="hover"
          color="inherit"
        >
          {shelf.department_warehouse_name}
        </Link>
        <Link
          component={RouterLink}
          to={`/dashboard/storage/departments/${shelf.department}`}
          underline="hover"
          color="inherit"
        >
          {shelf.department_name}
        </Link>
        <Typography color="text.primary">{shelf.name}</Typography>
      </Breadcrumbs>
      
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShelfIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{shelf.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {shelf.code || 'Sin código'}
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
            onClick={handleDeleteShelf}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
      
      {/* Información de la estantería */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Dependencia
            </Typography>
            <Typography variant="body1">
              {shelf.department_name || 'No especificado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Estado
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
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Descripción
            </Typography>
            <Typography variant="body1">
              {shelf.description || 'Sin descripción'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Baldas */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Baldas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenTrayDialog()}
        >
          Nueva Balda
        </Button>
      </Box>
      
      {shelf.trays?.length > 0 ? (
        <Grid container spacing={2}>
          {shelf.trays.map((tray) => (
            <Grid item xs={12} sm={6} md={4} key={tray.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrayIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {tray.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Código: {tray.code || 'Sin código'}
                    </Typography>
                    {tray.is_active ? (
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
                    {tray.description || 'Sin descripción'}
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Materiales: {tray.materials?.length || 0}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => navigate(`/dashboard/storage/trays/${tray.id}`)}
                  >
                    Ver Detalles
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => handleOpenTrayDialog(tray)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteTray(tray.id, tray.name)}
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
            Esta estantería no tiene baldas
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleOpenTrayDialog()}
            sx={{ mt: 2 }}
          >
            Añadir Balda
          </Button>
        </Paper>
      )}
      
      {/* Diálogo de edición de la estantería */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Estantería</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la estantería"
                  fullWidth
                  value={shelfForm.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={shelf.code || ''}
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
                  value={shelfForm.description || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={shelfForm.is_active}
                      onChange={handleInputChange}
                    />
                  }
                  label="Estantería activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateShelf}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de creación/edición de balda */}
      <Dialog open={openTrayDialog} onClose={handleCloseTrayDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTray ? 'Editar Balda' : 'Nueva Balda'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la balda"
                  fullWidth
                  value={trayForm.name}
                  onChange={handleTrayInputChange}
                  required
                />
              </Grid>
              {editingTray && (
                <Grid item xs={12}>
                  <TextField
                    name="code"
                    label="Código"
                    fullWidth
                    value={editingTray.code || ''}
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
                  value={trayForm.description || ''}
                  onChange={handleTrayInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={trayForm.is_active}
                      onChange={handleTrayInputChange}
                    />
                  }
                  label="Balda activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTrayDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitTray}
          >
            {editingTray ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShelfDetail;