import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip,
  TextField, InputAdornment, IconButton, Tooltip,
  Breadcrumbs, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControl, InputLabel, MenuItem,
  Select, Switch, FormControlLabel
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
  Add, Search, FilterList, Visibility, Delete, Edit,
  Dashboard as ShelfIcon, Clear
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getShelves, createShelf, updateShelf, deleteShelf,
  getWarehouses, getDepartments
} from '../../../services/storageService';

const ShelfList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const departmentId = queryParams.get('department');
  const warehouseId = queryParams.get('warehouse');

  const [loading, setLoading] = useState(true);
  const [shelves, setShelves] = useState([]);
  const [filteredShelves, setFilteredShelves] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    warehouse: warehouseId || '',
    department: departmentId || '',
    is_active: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: departmentId || '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [departmentId, warehouseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const shelvesParams = {};
      if (departmentId) {
        shelvesParams.department = departmentId;
      }
      
      const [shelvesData, warehousesData] = await Promise.all([
        getShelves(shelvesParams),
        getWarehouses()
      ]);
      
      setShelves(shelvesData);
      setFilteredShelves(shelvesData);
      setWarehouses(warehousesData);
      
      // Si tenemos un warehouse_id, cargar los departamentos para ese almacén
      if (warehouseId) {
        const departmentsData = await getDepartments({ warehouse: warehouseId });
        setDepartments(departmentsData);
      } else if (!departmentId) {
        const allDepartments = await getDepartments();
        setDepartments(allDepartments);
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (warehouseId) => {
    if (!warehouseId) {
      setDepartments([]);
      setFilters(prev => ({ ...prev, department: '' }));
      return;
    }
    
    try {
      const data = await getDepartments({ warehouse: warehouseId });
      setDepartments(data);
      // Si el departamento actual no pertenece al almacén seleccionado, limpiarlo
      if (filters.department) {
        const dept = data.find(d => d.id === parseInt(filters.department));
        if (!dept) {
          setFilters(prev => ({ ...prev, department: '' }));
        }
      }
    } catch (error) {
      console.error('Error al cargar las dependencias:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
    
    if (!e.target.value) {
      applyFilters({ ...filters, search: '' });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'warehouse') {
      fetchDepartments(value);
    }
    
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = (currentFilters = filters) => {
    let filtered = [...shelves];
    
    // Filtro de búsqueda general
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(shelf => 
        shelf.name.toLowerCase().includes(searchTerm) ||
        shelf.code?.toLowerCase().includes(searchTerm) ||
        shelf.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro por almacén (indirectamente a través del departamento)
    if (currentFilters.warehouse) {
      filtered = filtered.filter(shelf => 
        shelf.warehouse_id === parseInt(currentFilters.warehouse)
      );
    }
    
    // Filtro por departamento
    if (currentFilters.department) {
      filtered = filtered.filter(shelf => 
        shelf.department === parseInt(currentFilters.department)
      );
    }
    
    // Filtro por estado (activo/inactivo)
    if (currentFilters.is_active !== '') {
      const isActive = currentFilters.is_active === 'true';
      filtered = filtered.filter(shelf => 
        shelf.is_active === isActive
      );
    }
    
    setFilteredShelves(filtered);
  };
  
  const resetFilters = () => {
    const resetFiltersState = {
      search: '',
      warehouse: '',
      department: '',
      is_active: ''
    };
    setFilters(resetFiltersState);
    applyFilters(resetFiltersState);
  };

  const handleOpenDialog = (shelf = null) => {
    if (shelf) {
      setEditingShelf(shelf);
      setFormData({
        name: shelf.name,
        description: shelf.description || '',
        department: shelf.department.toString(),
        is_active: shelf.is_active
      });
    } else {
      setEditingShelf(null);
      setFormData({
        name: '',
        description: '',
        department: departmentId || '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShelf(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre de la estantería es obligatorio');
      return;
    }
    
    if (!formData.department) {
      toast.error('Debe seleccionar una dependencia');
      return;
    }
    
    try {
      if (editingShelf) {
        await updateShelf(editingShelf.id, formData);
        toast.success('Estantería actualizada correctamente');
      } else {
        await createShelf(formData);
        toast.success('Estantería creada correctamente');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error al guardar la estantería:', error);
      toast.error('Error al guardar la estantería');
    }
  };

  const handleDeleteShelf = async (shelf) => {
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
        await deleteShelf(shelf.id);
        toast.success('Estantería eliminada correctamente');
        fetchData();
      }
    } catch (error) {
      console.error('Error al eliminar la estantería:', error);
      toast.error('Error al eliminar la estantería');
    }
  };

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
      field: 'department_name',
      headerName: 'Dependencia',
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
              onClick={() => navigate(`/dashboard/storage/shelves/${params.row.id}`)}
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
              onClick={() => handleDeleteShelf(params.row)}
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
    noRowsLabel: 'No hay estanterías',
  };

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
        <Typography color="text.primary">Estanterías</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Estanterías 
          {filters.department && departments.find(d => d.id === parseInt(filters.department))?.name ? 
            ` - ${departments.find(d => d.id === parseInt(filters.department)).name}` : ''}
        </Typography>
        <Box>
          <Button 
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Estantería
          </Button>
        </Box>
      </Box>

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
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => {
                    setFilters({...filters, search: ''});
                    applyFilters({...filters, search: ''});
                  }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Tooltip title="Filtros avanzados">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterList />
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="outlined"
            onClick={() => applyFilters()}
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
            
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Dependencia</InputLabel>
              <Select
                name="department"
                value={filters.department}
                label="Dependencia"
                onChange={handleFilterChange}
                disabled={!departments.length}
              >
                <MenuItem value="">Todas</MenuItem>
                {departments.map(department => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
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
            rows={filteredShelves}
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
            localeText={localeText}
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
        <DialogTitle>{editingShelf ? 'Editar Estantería' : 'Nueva Estantería'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Dependencia</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    label="Dependencia *"
                    onChange={handleInputChange}
                    disabled={editingShelf} // No permitir cambio de dependencia en edición
                  >
                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.id.toString()}>
                        {department.name} {department.warehouse_name && `(${department.warehouse_name})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre de la estantería"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
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
                  label="Estantería activa"
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
            {editingShelf ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShelfList;