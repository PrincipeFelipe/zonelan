import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField,
  InputAdornment, Grid, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Chip,
  Breadcrumbs, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, FormControlLabel, Switch
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add, Search, FilterList, Clear, Visibility, InsertDriveFile,
  ImportExport, MoveToInbox, Inventory2, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  getMaterialMovements,
  getWarehouses,
  getDepartments,
  getMaterialLocations
} from '../../../services/storageService';
import axios from '../../../utils/axiosConfig';

const MaterialMovementList = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    warehouse: '',
    material: '',
    operation: '',
    user: '',
    startDate: '',
    endDate: ''
  });
  
  const [openMovementDialog, setOpenMovementDialog] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [filters.search]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [movementsData, materialsData, warehousesData, usersData] = await Promise.all([
        getMaterialMovements(),
        axios.get('/materials/materials/'),
        getWarehouses(),
        axios.get('/users/')
      ]);
      
      setMovements(movementsData);
      setFilteredMovements(movementsData);
      setMaterials(materialsData.data);
      setWarehouses(warehousesData);
      setUsers(usersData.data);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
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
    let filteredData = [...movements];
    
    // Filtro de búsqueda general
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredData = filteredData.filter(movement => 
        movement.material_name?.toLowerCase().includes(searchTerm) ||
        movement.notes?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro por almacén (a través de ubicación)
    if (filters.warehouse) {
      filteredData = filteredData.filter(movement => {
        // Verificar si source_location o target_location contienen el almacén
        const sourceWarehouse = movement.source_location_warehouse;
        const targetWarehouse = movement.target_location_warehouse;
        return sourceWarehouse === parseInt(filters.warehouse) || 
               targetWarehouse === parseInt(filters.warehouse);
      });
    }
    
    // Filtro por material
    if (filters.material) {
      filteredData = filteredData.filter(movement => 
        movement.material === parseInt(filters.material)
      );
    }
    
    // Filtro por tipo de operación
    if (filters.operation) {
      filteredData = filteredData.filter(movement => 
        movement.operation === filters.operation
      );
    }
    
    // Filtro por usuario
    if (filters.user) {
      filteredData = filteredData.filter(movement => 
        movement.user === parseInt(filters.user)
      );
    }
    
    // Filtro por fecha de inicio
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(movement => {
        const movementDate = new Date(movement.timestamp);
        return movementDate >= startDate;
      });
    }
    
    // Filtro por fecha de fin
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(movement => {
        const movementDate = new Date(movement.timestamp);
        return movementDate <= endDate;
      });
    }
    
    setFilteredMovements(filteredData);
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      warehouse: '',
      material: '',
      operation: '',
      user: '',
      startDate: '',
      endDate: ''
    });
    setFilteredMovements(movements);
  };
  
  const handleViewMovement = (movement) => {
    setSelectedMovement(movement);
    setOpenMovementDialog(true);
  };
  
  const handleCloseMovementDialog = () => {
    setOpenMovementDialog(false);
    setSelectedMovement(null);
  };
  
  const getOperationIcon = (operation) => {
    switch(operation) {
      case 'ADD':
        return <ArrowDownward fontSize="small" sx={{ color: 'success.main' }} />;
      case 'REMOVE':
        return <ArrowUpward fontSize="small" sx={{ color: 'error.main' }} />;
      case 'TRANSFER':
        return <ImportExport fontSize="small" sx={{ color: 'info.main' }} />;
      default:
        return <Inventory2 fontSize="small" />;
    }
  };
  
  const getOperationColor = (operation) => {
    switch(operation) {
      case 'ADD':
        return 'success';
      case 'REMOVE':
        return 'error';
      case 'TRANSFER':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70
    },
    {
      field: 'timestamp',
      headerName: 'Fecha',
      width: 180,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Typography variant="body2">
              {format(date, 'dd/MM/yyyy HH:mm', { locale: es })}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'operation',
      headerName: 'Operación',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          {getOperationIcon(params.value)}
          <Chip 
            label={params.row.operation_display} 
            size="small"
            color={getOperationColor(params.value)}
            sx={{ ml: 1 }}
          />
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
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'quantity',
      headerName: 'Cantidad',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'source_location',
      headerName: 'Origen',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (params.row.operation === 'ADD') {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">-</Typography>
            </Box>
          );
        }
        
        if (!params.row.source_location_display) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Sin origen</Typography>
            </Box>
          );
        }
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Tooltip title={params.row.source_location_display || ''}>
              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {params.row.source_location_display}
              </Typography>
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'target_location',
      headerName: 'Destino',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (params.row.operation === 'REMOVE') {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">-</Typography>
            </Box>
          );
        }
        
        if (!params.row.target_location_display) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Sin destino</Typography>
            </Box>
          );
        }
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Tooltip title={params.row.target_location_display || ''}>
              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {params.row.target_location_display}
              </Typography>
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'user_name',
      headerName: 'Usuario',
      width: 150,
      renderCell: (params) => {
        const username = params.row.username || params.row.user_name || 'Desconocido';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Typography variant="body2">
              {username}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Tooltip title="Ver detalles">
            <IconButton
              size="small"
              onClick={() => handleViewMovement(params.row)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];
  
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
    noRowsLabel: 'No hay movimientos',
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
        <Typography color="text.primary">Movimientos</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Movimientos de Materiales
        </Typography>
        <Box>
          <Button 
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/dashboard/storage/movements/new')}
          >
            Nuevo Movimiento
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Material</InputLabel>
                  <Select
                    name="material"
                    value={filters.material}
                    label="Material"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {materials.map(material => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Operación</InputLabel>
                  <Select
                    name="operation"
                    value={filters.operation}
                    label="Operación"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="ADD">Entrada</MenuItem>
                    <MenuItem value="REMOVE">Salida</MenuItem>
                    <MenuItem value="TRANSFER">Traslado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl size="small" fullWidth>
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
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    name="user"
                    value={filters.user}
                    label="Usuario"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="startDate"
                  label="Fecha inicial"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="endDate"
                  label="Fecha final"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="text"
                  onClick={resetFilters}
                  sx={{ height: '100%' }}
                >
                  Limpiar filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ width: '100%' }}>
          {loading ? (
            <LinearProgress />
          ) : (
            <DataGrid
              rows={filteredMovements}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
                sorting: {
                  sortModel: [{ field: 'timestamp', sort: 'desc' }],
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
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
                  display: 'flex',            // Añadido para centrar contenido
                  alignItems: 'center',       // Añadido para centrar contenido verticalmente
                  '& .MuiBox-root': {         // Asegurar que los contenedores Box ocupen el ancho completo
                    width: '100%'             // Permite que el contenido se alinee correctamente
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
                  outline: 'none',            // Elimina el contorno al hacer foco
                },
              }}
            />
          )}
        </Box>
      </Paper>
      
      {/* Diálogo de detalles del movimiento */}
      <Dialog open={openMovementDialog} onClose={handleCloseMovementDialog} maxWidth="md" fullWidth>
        <DialogTitle>Detalles del Movimiento</DialogTitle>
        <DialogContent dividers>
          {selectedMovement && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Fecha y Hora
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedMovement.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Tipo de Operación
                </Typography>
                <Chip 
                  label={selectedMovement.operation_display} 
                  color={getOperationColor(selectedMovement.operation)}
                  icon={getOperationIcon(selectedMovement.operation)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Material
                </Typography>
                <Typography variant="body1">
                  {selectedMovement.material_name}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Cantidad
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedMovement.quantity}
                </Typography>
              </Grid>
              
              {selectedMovement.operation !== 'ADD' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Ubicación de Origen
                  </Typography>
                  <Typography variant="body1">
                    {selectedMovement.source_location_display || 'No especificado'}
                  </Typography>
                </Grid>
              )}
              
              {selectedMovement.operation !== 'REMOVE' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Ubicación de Destino
                  </Typography>
                  <Typography variant="body1">
                    {selectedMovement.target_location_display || 'No especificado'}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Usuario
                </Typography>
                <Typography variant="body1">
                  {selectedMovement.username || selectedMovement.user_username || 'Desconocido'}
                </Typography>
              </Grid>
              
              {selectedMovement.material_control && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Control de Material
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<InsertDriveFile />}
                    onClick={() => navigate(`/dashboard/materials/controls/${selectedMovement.material_control}`)}
                  >
                    Ver control #{selectedMovement.material_control}
                  </Button>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Notas
                </Typography>
                <Typography variant="body1">
                  {selectedMovement.notes || 'Sin notas'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMovementDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialMovementList;