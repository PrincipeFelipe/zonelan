import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, Card, CardContent, Grid,
  FormControlLabel, Switch
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
  Add, Edit, Delete, Visibility, 
  Apartment, LocationOn, Description 
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../services/storageService';

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    is_active: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getWarehouses();
      setWarehouses(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      toast.error('Error al cargar la lista de almacenes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location || '',
        description: warehouse.description || '',
        is_active: warehouse.is_active
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        location: '',
        description: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWarehouse(null);
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
    try {
      if (!formData.name) {
        toast.error('El nombre del almacén es obligatorio');
        return;
      }

      if (editingWarehouse) {
        // Actualizar almacén
        await updateWarehouse(editingWarehouse.id, formData);
        toast.success('Almacén actualizado correctamente');
      } else {
        // Crear nuevo almacén
        await createWarehouse(formData);
        toast.success('Almacén creado correctamente');
      }

      handleCloseDialog();
      fetchWarehouses();
    } catch (error) {
      console.error('Error:', error);
      toast.error(editingWarehouse ? 'Error al actualizar el almacén' : 'Error al crear el almacén');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar el almacén "${name}"? Esta acción no se puede deshacer y podría afectar a todas las dependencias, estanterías y baldas asociadas.`,
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
        fetchWarehouses();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar el almacén');
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/dashboard/storage/warehouses/${id}`);
  };

  const columns = [
    {
      field: 'code',
      headerName: 'Código',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" fontWeight="500">
            {params.value || 'Sin código'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'location',
      headerName: 'Ubicación',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'is_active',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {params.value ? (
            <Typography
              variant="body2"
              sx={{
                backgroundColor: 'success.light',
                color: 'success.dark',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Activo
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{
                backgroundColor: 'error.light',
                color: 'error.dark',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Inactivo
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%', width: '100%' }}>
          <Tooltip title="Ver detalles">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleViewDetails(params.row.id)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDialog(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id, params.row.name)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Almacenes</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Almacén
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={warehouses}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: 'name', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              border: '1px solid #E0E0E0',
              borderRadius: 1,
              minWidth: 0,
              '& .MuiDataGrid-row': {
                borderBottom: '1px solid #F5F5F5',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#F5F5F5',
                borderRight: '1px solid #E0E0E0',
                '&:last-child': {
                  borderRight: 'none',
                },
              },
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #F5F5F5',
                '&:last-child': {
                  borderRight: 'none',
                },
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                '& .MuiBox-root': {
                  width: '100%'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #E0E0E0',
                fontSize: '0.875rem',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-toolbarContainer': {
                borderBottom: '1px solid #E0E0E0',
                padding: '8px 16px',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #E0E0E0',
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: '#FFFFFF',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none',
              },
            }}
          />
        </Box>
      </Paper>

      {/* Diálogo para crear o editar un almacén */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'}
        </DialogTitle>
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
            onClick={handleSubmit}
          >
            {editingWarehouse ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseList;