import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Grid, Divider,
  Card, CardContent, CardActions, IconButton,
  Breadcrumbs, Link, Chip, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel,
  Switch, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ViewStream as TrayIcon, ArrowBack, Edit, Delete, Add,
  Inventory as MaterialIcon, SwapHoriz as MovementIcon
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getTrayById,
  updateTray,
  deleteTray,
  getMaterialLocations,
  createMaterialLocation,
  updateMaterialLocation,
  deleteMaterialLocation,
  createMaterialMovement
} from '../../../services/storageService';

import axios from '../../../utils/axiosConfig';

const TrayDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tray, setTray] = useState(null);
  const [locations, setLocations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openMovementDialog, setOpenMovementDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  
  const [trayForm, setTrayForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  const [locationForm, setLocationForm] = useState({
    material: '',
    quantity: 0,
    minimum_quantity: 0
  });

  const [movementForm, setMovementForm] = useState({
    material: '',
    quantity: 0,
    operation: 'ADD',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de la balda
      const trayData = await getTrayById(id);
      setTray(trayData);
      setTrayForm({
        name: trayData.name || '',
        description: trayData.description || '',
        is_active: trayData.is_active
      });

      // Cargar ubicaciones de materiales de esta balda
      const locationsData = await getMaterialLocations({ tray: id });
      setLocations(Array.isArray(locationsData) ? locationsData : locationsData.results || []);
      
      // Cargar lista de materiales para el selector
      const materialsResponse = await axios.get('/materials/materials/');
      const materials = materialsResponse.data;
      setMaterials(Array.isArray(materials) ? materials : materials.results || []);
      
    } catch (error) {
      console.error('Error al cargar los detalles de la balda:', error);
      toast.error('Error al cargar los detalles de la balda');
      navigate('/dashboard/storage/shelves');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setTrayForm({
      ...trayForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleLocationInputChange = (e) => {
    const { name, value } = e.target;
    setLocationForm({
      ...locationForm,
      [name]: name === 'material' || name === 'quantity' || name === 'minimum_quantity' 
        ? Number(value) : value
    });
  };

  const handleMovementInputChange = (e) => {
    const { name, value } = e.target;
    setMovementForm({
      ...movementForm,
      [name]: name === 'quantity' ? Number(value) : value
    });
  };

  const handleUpdateTray = async (e) => {
    e.preventDefault();
    try {
      await updateTray(id, trayForm);
      toast.success('Balda actualizada correctamente');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error al actualizar la balda:', error);
      toast.error('Error al actualizar la balda');
    }
  };

  const handleDeleteTray = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la balda "${tray.name}"? Esta acción no se puede deshacer y eliminará todas las ubicaciones de materiales asociadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteTray(id);
        toast.success('Balda eliminada correctamente');
        navigate(`/dashboard/storage/shelves/${tray.shelf}`);
      }
    } catch (error) {
      console.error('Error al eliminar la balda:', error);
      toast.error('Error al eliminar la balda');
    }
  };

  const handleOpenLocationDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        material: location.material,
        quantity: location.quantity,
        minimum_quantity: location.minimum_quantity
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        material: '',
        quantity: 0,
        minimum_quantity: 0
      });
    }
    setOpenLocationDialog(true);
  };

  const handleCloseLocationDialog = () => {
    setOpenLocationDialog(false);
    setEditingLocation(null);
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    try {
      if (!locationForm.material) {
        toast.error('Debe seleccionar un material');
        return;
      }

      if (locationForm.quantity < 0) {
        toast.error('La cantidad no puede ser negativa');
        return;
      }

      if (editingLocation) {
        await updateMaterialLocation(editingLocation.id, locationForm);
        toast.success('Ubicación actualizada correctamente');
      } else {
        await createMaterialLocation({
          ...locationForm,
          tray: id
        });
        toast.success('Ubicación creada correctamente');
      }

      handleCloseLocationDialog();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(editingLocation ? 'Error al actualizar la ubicación' : 'Error al crear la ubicación');
    }
  };

  const handleDeleteLocation = async (locationId, materialName) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la ubicación de "${materialName}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteMaterialLocation(locationId);
        toast.success('Ubicación eliminada correctamente');
        fetchData();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la ubicación');
    }
  };

  const handleOpenMovementDialog = (materialId = null) => {
    setMovementForm({
      material: materialId || '',
      quantity: 1,
      operation: 'ADD',
      notes: ''
    });
    setOpenMovementDialog(true);
  };

  const handleCloseMovementDialog = () => {
    setOpenMovementDialog(false);
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    try {
      if (!movementForm.material) {
        toast.error('Debe seleccionar un material');
        return;
      }

      if (movementForm.quantity <= 0) {
        toast.error('La cantidad debe ser mayor que cero');
        return;
      }

      // Encontrar la ubicación existente para este material, si existe
      const existingLocation = locations.find(loc => loc.material === movementForm.material);
      
      // Construir el objeto de movimiento
      const movementData = {
        material: movementForm.material,
        quantity: movementForm.quantity,
        operation: movementForm.operation,
        notes: movementForm.notes
      };

      if (movementForm.operation === 'ADD') {
        if (existingLocation) {
          movementData.target_location = existingLocation.id;
        } else {
          movementData.target_tray = id;
        }
      } else if (movementForm.operation === 'REMOVE') {
        if (!existingLocation) {
          toast.error('No hay stock de este material en esta ubicación');
          return;
        }
        
        if (existingLocation.quantity < movementForm.quantity) {
          toast.error(`Stock insuficiente. Disponible: ${existingLocation.quantity}`);
          return;
        }
        
        movementData.source_location = existingLocation.id;
      }

      await createMaterialMovement(movementData);
      toast.success('Movimiento registrado correctamente');
      handleCloseMovementDialog();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar el movimiento');
    }
  };

  const formatMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Material desconocido';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!tray) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Balda no encontrada</Typography>
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
          to={`/dashboard/storage/warehouses/${tray.shelf_department_warehouse_id}`}
          underline="hover"
          color="inherit"
        >
          {tray.shelf_department_warehouse_name}
        </Link>
        <Link
          component={RouterLink}
          to={`/dashboard/storage/departments/${tray.shelf_department}`}
          underline="hover"
          color="inherit"
        >
          {tray.shelf_department_name}
        </Link>
        <Link
          component={RouterLink}
          to={`/dashboard/storage/shelves/${tray.shelf}`}
          underline="hover"
          color="inherit"
        >
          {tray.shelf_name}
        </Link>
        <Typography color="text.primary">{tray.name}</Typography>
      </Breadcrumbs>
      
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrayIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{tray.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {tray.code || 'Sin código'}
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
            onClick={handleDeleteTray}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
      
      {/* Información de la balda */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Estantería
            </Typography>
            <Typography variant="body1">
              {tray.shelf_name || 'No especificada'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Estado
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
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Descripción
            </Typography>
            <Typography variant="body1">
              {tray.description || 'Sin descripción'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Ubicaciones de materiales */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Materiales en esta balda
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<MovementIcon />}
            onClick={() => handleOpenMovementDialog()}
            sx={{ mr: 1 }}
          >
            Movimiento
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenLocationDialog()}
          >
            Añadir Material
          </Button>
        </Box>
      </Box>
      
      {locations.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Mínimo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.material_name || formatMaterialName(location.material)}</TableCell>
                  <TableCell align="right">{location.quantity}</TableCell>
                  <TableCell align="right">{location.minimum_quantity}</TableCell>
                  <TableCell>
                    {location.quantity <= location.minimum_quantity ? (
                      <Chip 
                        label="Stock Bajo" 
                        color="error" 
                        variant="outlined" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        label="OK" 
                        color="success" 
                        variant="outlined" 
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Editar ubicación">
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={() => handleOpenLocationDialog(location)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Añadir stock">
                        <IconButton 
                          size="small"
                          color="success"
                          onClick={() => handleOpenMovementDialog(location.material)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar ubicación">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLocation(location.id, location.material_name || formatMaterialName(location.material))}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay materiales en esta balda
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleOpenLocationDialog()}
            sx={{ mt: 2 }}
          >
            Añadir Material
          </Button>
        </Paper>
      )}
      
      {/* Diálogo de edición de la balda */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Balda</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la balda"
                  fullWidth
                  value={trayForm.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={tray.code || ''}
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
                  rows={3}
                  value={trayForm.description || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={trayForm.is_active}
                      onChange={handleInputChange}
                    />
                  }
                  label="Balda activa"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateTray}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para añadir/editar ubicación de material */}
      <Dialog open={openLocationDialog} onClose={handleCloseLocationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Editar Ubicación de Material' : 'Añadir Material a la Balda'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  name="material"
                  label="Material"
                  fullWidth
                  value={locationForm.material}
                  onChange={handleLocationInputChange}
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Seleccione un material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={locationForm.quantity}
                  onChange={handleLocationInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="minimum_quantity"
                  label="Cantidad mínima"
                  type="number"
                  fullWidth
                  value={locationForm.minimum_quantity}
                  onChange={handleLocationInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Nivel mínimo para alertas de stock"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitLocation}
          >
            {editingLocation ? 'Actualizar' : 'Añadir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para registrar movimiento de material */}
      <Dialog open={openMovementDialog} onClose={handleCloseMovementDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Movimiento de Material</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  name="material"
                  label="Material"
                  fullWidth
                  value={movementForm.material}
                  onChange={handleMovementInputChange}
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Seleccione un material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={movementForm.quantity}
                  onChange={handleMovementInputChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  name="operation"
                  label="Operación"
                  fullWidth
                  value={movementForm.operation}
                  onChange={handleMovementInputChange}
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="ADD">Entrada</option>
                  <option value="REMOVE">Salida</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Observaciones"
                  fullWidth
                  multiline
                  rows={3}
                  value={movementForm.notes || ''}
                  onChange={handleMovementInputChange}
                  placeholder="Descripción del movimiento (opcional)"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMovementDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitMovement}
          >
            Registrar Movimiento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrayDetail;