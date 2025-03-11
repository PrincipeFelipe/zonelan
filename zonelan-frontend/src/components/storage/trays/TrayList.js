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
  Clear, ViewStream as TrayIcon
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import {
  getTrays, createTray, updateTray, deleteTray,
  getWarehouses, getDepartments, getShelves
} from '../../../services/storageService';

const TrayList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const shelfId = queryParams.get('shelf');
  const departmentId = queryParams.get('department');
  const warehouseId = queryParams.get('warehouse');

  const [loading, setLoading] = useState(true);
  const [trays, setTrays] = useState([]);
  const [filteredTrays, setFilteredTrays] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shelves, setShelves] = useState([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTray, setEditingTray] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para la selección jerárquica
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseId || '');
  const [selectedDepartment, setSelectedDepartment] = useState(departmentId || '');
  
  const [filters, setFilters] = useState({
    search: '',
    warehouse: warehouseId || '',
    department: departmentId || '',
    shelf: shelfId || '',
    is_active: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shelf: shelfId || '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [shelfId, departmentId, warehouseId]);

  useEffect(() => {
    if (filters.warehouse) {
      fetchDepartments(filters.warehouse);
    } else {
      setDepartments([]);
      setFilters(prev => ({ ...prev, department: '', shelf: '' }));
    }
  }, [filters.warehouse]);

  useEffect(() => {
    if (filters.department) {
      fetchShelves(filters.department);
    } else {
      setShelves([]);
      setFilters(prev => ({ ...prev, shelf: '' }));
    }
  }, [filters.department]);
  
  // Para el diálogo de creación/edición
  useEffect(() => {
    if (selectedWarehouse) {
      fetchDepartmentsForForm(selectedWarehouse);
    } else {
      setDepartments([]);
      setSelectedDepartment('');
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchShelvesForForm(selectedDepartment);
    } else {
      setShelves([]);
      setFormData(prev => ({ ...prev, shelf: '' }));
    }
  }, [selectedDepartment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (shelfId) {
        params.shelf = shelfId;
      } else if (departmentId) {
        params.department = departmentId;
      } else if (warehouseId) {
        params.warehouse = warehouseId;
      }
      
      const [traysData, warehousesData] = await Promise.all([
        getTrays(params),
        getWarehouses()
      ]);
      
      // Procesar los datos para asegurar que tengan los campos necesarios
      const processedTrays = traysData.map(tray => ({
        ...tray,
        shelf_name: tray.shelf_name || (tray.shelf && typeof tray.shelf === 'object' ? tray.shelf.name : '—'),
        department_name: tray.department_name || 
                        (tray.shelf && tray.shelf.department_name) || 
                        (tray.shelf && typeof tray.shelf === 'object' && 
                         tray.shelf.department && typeof tray.shelf.department === 'object' ? 
                         tray.shelf.department.name : '—'),
        warehouse_name: tray.warehouse_name || 
                       (tray.shelf && tray.shelf.warehouse_name) || 
                       (tray.shelf && typeof tray.shelf === 'object' && 
                        tray.shelf.department && typeof tray.shelf.department === 'object' && 
                        tray.shelf.department.warehouse && typeof tray.shelf.department.warehouse === 'object' ? 
                        tray.shelf.department.warehouse.name : '—')
      }));
      
      setTrays(processedTrays);
      setFilteredTrays(processedTrays);
      setWarehouses(warehousesData);
      
      // Si hay filtros preestablecidos, cargar datos relacionados
      if (warehouseId) {
        await fetchDepartments(warehouseId);
        
        if (departmentId) {
          await fetchShelves(departmentId);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
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
  
  const fetchDepartmentsForForm = async (warehouseId) => {
    try {
      const data = await getDepartments({ warehouse: warehouseId });
      setDepartments(data);
    } catch (error) {
      console.error('Error al cargar dependencias para el formulario:', error);
    }
  };

  const fetchShelvesForForm = async (departmentId) => {
    try {
      const data = await getShelves({ department: departmentId });
      setShelves(data);
    } catch (error) {
      console.error('Error al cargar estanterías para el formulario:', error);
    }
  };

  const handleOpenDialog = (tray = null) => {
    if (tray) {
      setEditingTray(tray);
      setFormData({
        name: tray.name,
        description: tray.description || '',
        shelf: tray.shelf,
        is_active: tray.is_active
      });
      
      // Cargar datos jerárquicos para el formulario
      if (tray.department_id) {
        setSelectedDepartment(tray.department_id);
        if (tray.warehouse_id) {
          setSelectedWarehouse(tray.warehouse_id);
        }
      }
    } else {
      setEditingTray(null);
      setFormData({
        name: '',
        description: '',
        shelf: shelfId || '',
        is_active: true
      });
      
      // Establecer valores iniciales para la jerarquía
      if (warehouseId) {
        setSelectedWarehouse(warehouseId);
      }
      if (departmentId) {
        setSelectedDepartment(departmentId);
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTray(null);
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  const applyFilters = () => {
    let filtered = [...trays];
    
    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(tray =>
        tray.name.toLowerCase().includes(searchTerm) ||
        tray.description?.toLowerCase().includes(searchTerm) ||
        tray.code?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro por almacén
    if (filters.warehouse) {
      filtered = filtered.filter(tray => tray.warehouse_id === parseInt(filters.warehouse));
    }
    
    // Filtro por dependencia
    if (filters.department) {
      filtered = filtered.filter(tray => tray.department_id === parseInt(filters.department));
    }
    
    // Filtro por estantería
    if (filters.shelf) {
      filtered = filtered.filter(tray => tray.shelf === parseInt(filters.shelf));
    }
    
    // Filtro por estado
    if (filters.is_active === 'true') {
      filtered = filtered.filter(tray => tray.is_active);
    } else if (filters.is_active === 'false') {
      filtered = filtered.filter(tray => !tray.is_active);
    }
    
    setFilteredTrays(filtered);
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      warehouse: warehouseId || '',
      department: departmentId || '',
      shelf: shelfId || '',
      is_active: ''
    });
    setFilteredTrays(trays);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre de la balda es obligatorio');
      return;
    }
    
    if (!formData.shelf) {
      toast.error('Debe seleccionar una estantería');
      return;
    }
    
    try {
      // Añadir explícitamente el code vacío para asegurar que se envía
      const dataToSubmit = {
        ...formData,
        code: ""  // Enviar código vacío explícitamente
      };
      
      console.log('Datos a enviar:', dataToSubmit); // Para depuración
      
      if (editingTray) {
        await updateTray(editingTray.id, dataToSubmit);
        toast.success('Balda actualizada correctamente');
      } else {
        await createTray(dataToSubmit);
        toast.success('Balda creada correctamente');
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error al guardar:', error);
      
      // Mostrar mensaje de error más detallado
      if (error.response && error.response.data) {
        console.log('Respuesta de error:', error.response.data);
        let errorMessage = '';
        
        // Formatear los errores para mostrar al usuario
        if (typeof error.response.data === 'object') {
          Object.entries(error.response.data).forEach(([key, value]) => {
            errorMessage += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
          });
        } else {
          errorMessage = error.response.data;
        }
        
        toast.error(`Error: ${errorMessage}`);
      } else {
        toast.error(editingTray ? 'Error al actualizar la balda' : 'Error al crear la balda');
      }
    }
  };

  const handleDelete = async (id, name) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la balda "${name}"? Esta acción no se puede deshacer y eliminará todas las ubicaciones de materiales asociadas.`,
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
        fetchData();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la balda');
    }
  };

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
    noRowsLabel: 'No hay baldas',
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
      field: 'shelf_name',
      headerName: 'Estantería',
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
              label="Activa" 
              color="success" 
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip 
              label="Inactiva" 
              color="error" 
              size="small"
              variant="outlined"
            />
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
              onClick={() => navigate(`/dashboard/storage/trays/${params.row.id}`)}
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
      
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component={RouterLink} 
          to="/dashboard/storage"
          underline="hover"
          color="inherit"
        >
          Almacenamiento
        </Link>
        <Typography color="text.primary">Baldas</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Baldas
          {shelfId && shelves.find(s => s.id === parseInt(shelfId))?.name 
            ? ` - ${shelves.find(s => s.id === parseInt(shelfId)).name}` 
            : ''
          }
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Balda
        </Button>
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
                  <IconButton size="small" onClick={() => setFilters({...filters, search: ''})}>
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
            
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Dependencia</InputLabel>
              <Select
                name="department"
                value={filters.department}
                label="Dependencia"
                onChange={handleFilterChange}
                disabled={!filters.warehouse}
              >
                <MenuItem value="">Todas</MenuItem>
                {departments.map(department => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Estantería</InputLabel>
              <Select
                name="shelf"
                value={filters.shelf}
                label="Estantería"
                onChange={handleFilterChange}
                disabled={!filters.department}
              >
                <MenuItem value="">Todas</MenuItem>
                {shelves.map(shelf => (
                  <MenuItem key={shelf.id} value={shelf.id}>
                    {shelf.name}
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
            rows={filteredTrays}
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
        <DialogTitle>{editingTray ? 'Editar Balda' : 'Nueva Balda'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!shelfId && (
                <>
                  <Grid item xs={12} md={6}>
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
                  
                  <Grid item xs={12} md={6}>
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
                  
                  <Grid item xs={12}>
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
                  value={formData.description || ''}
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
                  label="Balda activa"
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
            {editingTray ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrayList;