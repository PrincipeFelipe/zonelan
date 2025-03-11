import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, 
  Tooltip, IconButton, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Switch, Grid, Chip,
  Breadcrumbs, Link
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add, Delete, Edit, Visibility,
  Search, FilterList, BusinessOutlined,
  Apartment
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getWarehouses
} from '../../../services/storageService';

const DepartmentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const warehouseId = queryParams.get('warehouse');

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    warehouse: warehouseId || ''
  });
  
  const [filters, setFilters] = useState({
    warehouse: warehouseId || '',
    is_active: '',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouseId) {
      setFilters(prev => ({ ...prev, warehouse: warehouseId }));
    }
  }, [warehouseId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.warehouse) {
        params.warehouse = filters.warehouse;
      }
      
      if (filters.is_active !== '') {
        params.is_active = filters.is_active;
      }
      
      const data = await getDepartments(params);
      setDepartments(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
      toast.error('Error al cargar la lista de dependencias');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
    }
  };

  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        is_active: department.is_active,
        warehouse: department.warehouse
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        warehouse: warehouseId || ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleFilterChange = (e) => {
    const { name, value, checked } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre de la dependencia es obligatorio');
      return;
    }
    
    if (!formData.warehouse) {
      toast.error('Debe seleccionar un almacén');
      return;
    }
  
    try {
      // Asegurar que enviamos un campo code vacío
      const dataToSubmit = {
        ...formData,
        code: formData.code || ""
      };
      
      console.log("Datos a enviar:", dataToSubmit);
      
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, dataToSubmit);
        toast.success('Dependencia actualizada correctamente');
      } else {
        await createDepartment(dataToSubmit);
        toast.success('Dependencia creada correctamente');
      }
      
      setOpenDialog(false);
      fetchDepartments(); // Función correcta que sí está definida
    } catch (error) {
      console.error('Error al guardar la dependencia:', error);
      
      // Mostrar mensaje detallado del error
      const errorDetail = error.response?.data;
      let errorMessage = '';
      
      if (errorDetail) {
        if (typeof errorDetail === 'object') {
          Object.entries(errorDetail).forEach(([key, value]) => {
            const valueText = Array.isArray(value) ? value.join(', ') : value;
            errorMessage += `${key}: ${valueText}\n`;
          });
        } else {
          errorMessage = errorDetail.toString();
        }
      }
      
      toast.error(errorMessage || 'Error al guardar la dependencia');
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
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error al eliminar la dependencia:', error);
      toast.error('Error al eliminar la dependencia');
    }
  };

  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  const applyFilters = () => {
    fetchDepartments();
  };

  const resetFilters = () => {
    setFilters({
      warehouse: '',
      is_active: '',
      search: ''
    });
  };

  const filteredDepartments = departments.filter(department => {
    // Aplicar filtro de búsqueda
    if (filters.search && !department.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Columnas para el DataGrid
  const columns = [
    {
      field: 'code',
      headerName: 'Código',
      width: 150,
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
      field: 'warehouse_name',
      headerName: 'Almacén',
      width: 200,
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
            <Chip 
              size="small"
              label="Activo"
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip 
              size="small"
              label="Inactivo"
              color="error"
              variant="outlined"
            />
          )}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%', width: '100%' }}>
          <Tooltip title="Ver detalles">
            <IconButton
              size="small"
              onClick={() => navigate(`/dashboard/storage/departments/${params.row.id}`)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => handleDeleteDepartment(params.row)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Traducciones para DataGrid
  const localeText = {
    toolbarDensity: 'Densidad',
    toolbarDensityLabel: 'Densidad',
    toolbarDensityCompact: 'Compacta',
    toolbarDensityStandard: 'Estándar',
    toolbarDensityComfortable: 'Cómoda',
    toolbarColumns: 'Columnas',
    toolbarFilters: 'Filtros',
    toolbarExport: 'Exportar',
    toolbarQuickFilterPlaceholder: 'Buscar...',
    toolbarQuickFilterLabel: 'Buscar',
    noRowsLabel: 'No hay dependencias',
  };

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
        <Typography color="text.primary">Dependencias</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Dependencias {warehouseId && warehouses.find(w => w.id === parseInt(warehouseId))?.name ? `- ${warehouses.find(w => w.id === parseInt(warehouseId)).name}` : ''}
        </Typography>
        <Box>
          <Button 
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Dependencia
          </Button>
        </Box>
      </Box>

      {/* Barra de filtros */}
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={handleSearch}
          sx={{ flexGrow: 1, minWidth: 120 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Tooltip title="Filtros avanzados">
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterList />
          </IconButton>
        </Tooltip>
        
        <Button 
          variant="outlined"
          onClick={applyFilters}
        >
          Filtrar
        </Button>
      </Box>

      {showFilters && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Almacén</InputLabel>
            <Select
              name="warehouse"
              value={filters.warehouse}
              label="Almacén"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {warehouses.map(warehouse => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              name="is_active"
              value={filters.is_active}
              label="Estado"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Activos</MenuItem>
              <MenuItem value="false">Inactivos</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="text"
            onClick={resetFilters}
          >
            Limpiar filtros
          </Button>
        </Box>
      )}
    </Paper>

    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={filteredDepartments}
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

    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{editingDepartment ? 'Editar Dependencia' : 'Nueva Dependencia'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {!warehouseId && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Almacén</InputLabel>
                  <Select
                    name="warehouse"
                    value={formData.warehouse}
                    label="Almacén *"
                    onChange={handleInputChange}
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nombre de la dependencia"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            {editingDepartment && (
              <Grid item xs={12}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={editingDepartment.code || ''}
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
                label="Dependencia activa"
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
          {editingDepartment ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
};

export default DepartmentList;