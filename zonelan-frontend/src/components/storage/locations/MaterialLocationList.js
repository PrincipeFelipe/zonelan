import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, TextField,
  InputAdornment, Grid, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Chip,
  LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add, Search, FilterList, Clear, Edit, 
  Delete, Visibility, WarningAmber, ArrowUpward
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../../utils/axiosConfig';

import {
  getMaterialLocations,
  getLowStockLocations,
  getWarehouses,
  getDepartments,
  getShelves,
  getTrays,
  createMaterialLocation,
  updateMaterialLocation,
  deleteMaterialLocation
} from '../../../services/storageService';

const MaterialLocationList = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const lowStockParam = queryParams.get('lowStock');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Estados para los filtros
  const [filters, setFilters] = useState({
    search: '',
    warehouse: '',
    department: '',
    shelf: '',
    tray: '',
    lowStock: false
  });
  
  // Estados para los datos relacionados
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [trays, setTrays] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // Estado para el diálogo de formulario
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    material: '',
    tray: '',
    quantity: 0,
    minimum_quantity: 0
  });
  
  useEffect(() => {
    fetchLocations();
    fetchFilterData();
  }, []);
  
  useEffect(() => {
    if (filters.warehouse) {
      fetchDepartments(filters.warehouse);
    } else {
      setDepartments([]);
    }
    setFilters(prev => ({ ...prev, department: '', shelf: '', tray: '' }));
  }, [filters.warehouse]);
  
  useEffect(() => {
    if (filters.department) {
      fetchShelves(filters.department);
    } else {
      setShelves([]);
    }
    setFilters(prev => ({ ...prev, shelf: '', tray: '' }));
  }, [filters.department]);
  
  useEffect(() => {
    if (filters.shelf) {
      fetchTrays(filters.shelf);
    } else {
      setTrays([]);
    }
    setFilters(prev => ({ ...prev, tray: '' }));
  }, [filters.shelf]);
  
  useEffect(() => {
    applyFilters();
  }, [locations, filters.lowStock]);
  
  useEffect(() => {
    if (lowStockParam === 'true') {
      console.log('Cargando ubicaciones con stock bajo');
      setFilters(prev => ({...prev, lowStock: true}));
      fetchLowStock(); 
    } else {
      console.log('Cargando todas las ubicaciones');
      fetchLocations();
    }
  }, [lowStockParam]); // Añade lowStockParam como dependencia
  
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getMaterialLocations();
      setLocations(data);
      setFilteredLocations(data);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      toast.error('Error al cargar las ubicaciones de materiales');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const data = await getLowStockLocations();
      setLocations(data);
      setFilteredLocations(data);
      setShowLowStock(true);
    } catch (error) {
      console.error('Error al cargar ubicaciones con stock bajo:', error);
      toast.error('Error al cargar las ubicaciones con stock bajo');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFilterData = async () => {
    try {
      const warehousesData = await getWarehouses();
      setWarehouses(warehousesData);
      
      // El problema está en esta línea:
      // const materialsResponse = await fetch('/materials/materials/');
      // const materialsData = await materialsResponse.json();
      
      // Corrección usando axios:
      const materialsResponse = await axios.get('/materials/materials/');
      const materialsData = materialsResponse.data;
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error al cargar datos de filtro:', error);
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
  
  const fetchTrays = async (shelfId) => {
    try {
      const data = await getTrays({ shelf: shelfId });
      setTrays(data);
    } catch (error) {
      console.error('Error al cargar baldas:', error);
    }
  };
  
  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const applyFilters = () => {
    let filtered = [...locations];
    
    // Filtrar por búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(location => (
        location.material_name.toLowerCase().includes(searchTerm) ||
        location.tray_name.toLowerCase().includes(searchTerm) ||
        location.tray_full_code.toLowerCase().includes(searchTerm) ||
        location.warehouse_name.toLowerCase().includes(searchTerm) ||
        location.department_name.toLowerCase().includes(searchTerm) ||
        location.shelf_name.toLowerCase().includes(searchTerm)
      ));
    }
    
    // Filtrar por almacén
    if (filters.warehouse) {
      filtered = filtered.filter(location => 
        location.tray?.shelf?.department?.warehouse === parseInt(filters.warehouse)
      );
    }
    
    // Filtrar por dependencia
    if (filters.department) {
      filtered = filtered.filter(location => 
        location.tray?.shelf?.department === parseInt(filters.department)
      );
    }
    
    // Filtrar por estantería
    if (filters.shelf) {
      filtered = filtered.filter(location => 
        location.tray?.shelf === parseInt(filters.shelf)
      );
    }
    
    // Filtrar por balda
    if (filters.tray) {
      filtered = filtered.filter(location => 
        location.tray === parseInt(filters.tray)
      );
    }
    
    // Filtrar por stock bajo
    if (filters.lowStock) {
      filtered = filtered.filter(location => 
        location.quantity <= location.minimum_quantity
      );
    }
    
    setFilteredLocations(filtered);
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      warehouse: '',
      department: '',
      shelf: '',
      tray: '',
      lowStock: false
    });
    setDepartments([]);
    setShelves([]);
    setTrays([]);
    setShowLowStock(false);
    fetchLocations();
  };
  
  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        material: location.material,
        tray: location.tray,
        quantity: location.quantity,
        minimum_quantity: location.minimum_quantity
      });
    } else {
      setEditingLocation(null);
      setFormData({
        material: '',
        tray: '',
        quantity: 0,
        minimum_quantity: 0
      });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'minimum_quantity' ? Number(value) : value
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (!formData.material) {
        toast.error('Debe seleccionar un material');
        return;
      }
      
      if (!formData.tray) {
        toast.error('Debe seleccionar una balda');
        return;
      }
      
      if (formData.quantity < 0) {
        toast.error('La cantidad no puede ser negativa');
        return;
      }
      
      if (editingLocation) {
        await updateMaterialLocation(editingLocation.id, formData);
        toast.success('Ubicación de material actualizada correctamente');
      } else {
        await createMaterialLocation(formData);
        toast.success('Ubicación de material creada correctamente');
      }
      
      handleCloseDialog();
      fetchLocations();
    } catch (error) {
      console.error('Error al guardar la ubicación:', error);
      toast.error('Error al guardar la ubicación de material');
    }
  };
  
  const handleDeleteLocation = async (locationId, materialName, trayName) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Quieres eliminar la ubicación del material "${materialName}" en "${trayName}"? Esta acción no se puede deshacer.`,
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
        fetchLocations();
      }
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      toast.error('Error al eliminar la ubicación');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };
  
  // Componente para el overlay de carga
  const CustomLoadingOverlay = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      padding: 3
    }}>
      <LinearProgress sx={{ width: '50%', mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Cargando ubicaciones de materiales...
      </Typography>
    </Box>
  );
  
  // Columnas para la tabla
  const columns = [
    {
      field: 'warehouse_name',
      headerName: 'Almacén',
      width: 150,
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
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'shelf_name',
      headerName: 'Estantería',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'tray_name',
      headerName: 'Balda',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'tray_full_code',
      headerName: 'Código Ubicación',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" fontFamily="monospace">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'material_name',
      headerName: 'Material',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'quantity',
      headerName: 'Cantidad',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          height: '100%',
          width: '100%' 
        }}>
          <Typography variant="body2" fontWeight={params.value <= params.row.minimum_quantity ? 'bold' : 'normal'}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'minimum_quantity',
      headerName: 'Mínimo',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          height: '100%',
          width: '100%' 
        }}>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {params.row.quantity <= params.row.minimum_quantity ? (
            <Chip 
              label="Stock Bajo" 
              color="error" 
              variant="outlined" 
              size="small"
              icon={<WarningAmber fontSize="small" />}
            />
          ) : (
            <Chip 
              label="OK" 
              color="success" 
              variant="outlined" 
              size="small"
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
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%', width: '100%' }}>
          <Tooltip title="Ver balda">
            <IconButton
              size="small"
              onClick={() => navigate(`/dashboard/storage/trays/${params.row.tray}`)}
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
              onClick={() => handleDeleteLocation(
                params.row.id,
                params.row.material_name,
                params.row.tray_name
              )}
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
    noRowsLabel: 'No hay ubicaciones',
  };

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h1">
          Gestión de Ubicaciones
        </Typography>
      </Box>
      
      {/* Botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant={showLowStock ? 'contained' : 'outlined'}
          color={showLowStock ? 'error' : 'primary'}
          startIcon={<WarningAmber />}
          onClick={() => {
            if (showLowStock) {
              fetchLocations();
              setShowLowStock(false);
            } else {
              fetchLowStock();
            }
          }}
        >
          {showLowStock ? 'Ver Todas' : 'Ver Stock Bajo'}
        </Button>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Ubicación
          </Button>
        </Box>
      </Box>
      
      {/* Filtros de búsqueda */}
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
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilters({ ...filters, search: '' })}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          
          <Tooltip title="Filtros avanzados">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterList />
            </IconButton>
          </Tooltip>
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
            
            {departments.length > 0 && (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Dependencia</InputLabel>
                <Select
                  name="department"
                  value={filters.department}
                  label="Dependencia"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {departments.map(department => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {shelves.length > 0 && (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Estantería</InputLabel>
                <Select
                  name="shelf"
                  value={filters.shelf}
                  label="Estantería"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {shelves.map(shelf => (
                    <MenuItem key={shelf.id} value={shelf.id}>
                      {shelf.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {trays.length > 0 && (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Balda</InputLabel>
                <Select
                  name="tray"
                  value={filters.tray}
                  label="Balda"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {trays.map(tray => (
                    <MenuItem key={tray.id} value={tray.id}>
                      {tray.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Button 
              variant="text"
              onClick={resetFilters}
            >
              Limpiar filtros
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowUpward />}
              onClick={applyFilters}
            >
              Aplicar
            </Button>
          </Box>
        )}
      </Paper>

      {/* Tabla de ubicaciones */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={filteredLocations}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
              sorting: {
                sortModel: [{ field: 'warehouse_name', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            loading={loading}
            autoHeight
            slots={{
              toolbar: GridToolbar,
              loadingOverlay: CustomLoadingOverlay,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            getRowId={(row) => row.id}
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

      {/* Diálogo para añadir/editar ubicación */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Material</InputLabel>
                  <Select
                    name="material"
                    value={formData.material}
                    label="Material *"
                    onChange={handleInputChange}
                  >
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Balda</InputLabel>
                  <Select
                    name="tray"
                    value={formData.tray}
                    label="Balda *"
                    onChange={handleInputChange}
                  >
                    {trays.map((tray) => (
                      <MenuItem key={tray.id} value={tray.id}>
                        {`${tray.name} (${tray.tray_full_code || 'Sin código'})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={formData.quantity}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="minimum_quantity"
                  label="Cantidad mínima"
                  type="number"
                  fullWidth
                  value={formData.minimum_quantity}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Nivel mínimo para alertas de stock"
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
            {editingLocation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialLocationList;