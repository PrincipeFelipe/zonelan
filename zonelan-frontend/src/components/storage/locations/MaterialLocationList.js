import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, TextField,
  InputAdornment, Grid, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Chip,
  LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert
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
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Simplificar el estado de filtros, mantener solo lowStock
  const [filters, setFilters] = useState({
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
  
  // Añadir estos estados
  const [stockInfo, setStockInfo] = useState({
    totalStock: 0,
    totalAllocated: 0,
    availableStock: 0,
    loading: false
  });

  // 1. Añade un nuevo estado para los selectores del formulario (al inicio del componente)
  const [formSelectors, setFormSelectors] = useState({
    warehouse: '',
    department: '',
    shelf: ''
  });

  useEffect(() => {
    fetchLocations();
    fetchFilterData();
  }, []);
  
  useEffect(() => {
    if (locations.length > 0) {
      applyFilters();
    }
  }, [locations, filters]); // Añade locations y filters como dependencias
  
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
  
  // Añadir este efecto para cargar los datos de stock cuando cambia el material seleccionado
  useEffect(() => {
    // Solo cargar si hay un material seleccionado
    if (formData.material) {
      setStockInfo(prev => ({ ...prev, loading: true }));
      verifyAvailableStock(formData.material)
        .then(info => {
          setStockInfo({
            ...info,
            loading: false
          });
        })
        .catch(error => {
          console.error("Error al obtener información de stock:", error);
          setStockInfo({
            totalStock: 0,
            totalAllocated: 0,
            availableStock: 0,
            loading: false
          });
        });
    }
  }, [formData.material]);

  useEffect(() => {
    console.log('Estado de locations después de fetch:', locations);
    console.log('Estado de filteredLocations después de filter:', filteredLocations);
  }, [locations, filteredLocations]); // Se ejecutará cuando cualquiera de estas variables cambie

  // Actualiza los efectos para escuchar cambios en formSelectors también
useEffect(() => {
  // Si hay cambio en el almacén de filtros o del formulario
  if (filters.warehouse) {
    fetchDepartments(filters.warehouse);
  } else if (formSelectors.warehouse && openDialog) {
    // Solo cargar si el diálogo está abierto
    fetchDepartments(formSelectors.warehouse);
  } else {
    setDepartments([]);
  }
  
  // Sólo resetear filtros, no formSelectors
  if (!openDialog) {
    setFilters(prev => ({ ...prev, department: '', shelf: '', tray: '' }));
  }
}, [filters.warehouse, formSelectors.warehouse, openDialog]);

useEffect(() => {
  // Si hay cambio en el departamento de filtros o del formulario
  if (filters.department) {
    fetchShelves(filters.department);
  } else if (formSelectors.department && openDialog) {
    // Solo cargar si el diálogo está abierto
    fetchShelves(formSelectors.department);
  } else {
    setShelves([]);
  }
  
  // Sólo resetear filtros, no formSelectors
  if (!openDialog) {
    setFilters(prev => ({ ...prev, shelf: '', tray: '' }));
  }
}, [filters.department, formSelectors.department, openDialog]);

useEffect(() => {
  // Si hay cambio en la estantería de filtros o del formulario
  if (filters.shelf) {
    fetchTrays(filters.shelf);
  } else if (formSelectors.shelf && openDialog) {
    // Solo cargar si el diálogo está abierto
    fetchTrays(formSelectors.shelf);
  } else {
    setTrays([]);
  }
  
  // Sólo resetear filtros, no formSelectors
  if (!openDialog) {
    setFilters(prev => ({ ...prev, tray: '' }));
  }
}, [filters.shelf, formSelectors.shelf, openDialog]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getMaterialLocations();
      
      console.log('Ubicaciones cargadas:', data.length);
      
      // Guardar los datos completos
      setLocations(data);
      
      // Aplicar solo el filtro de stock bajo si está activo
      if (filters.lowStock) {
        const filtered = data.filter(location => 
          location.quantity <= location.minimum_quantity
        );
        setFilteredLocations(filtered);
      } else {
        setFilteredLocations(data);
      }
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
  
  // Simplificar applyFilters
const applyFilters = () => {
  let filtered = [...locations];
  
  // Solo mantener el filtro de stock bajo
  if (filters.lowStock) {
    filtered = filtered.filter(location => 
      location.quantity <= location.minimum_quantity
    );
  }
  
  setFilteredLocations(filtered);
};

  // Simplificar resetFilters
const resetFilters = () => {
  setFilters({
    lowStock: false
  });
  setShowLowStock(false);
  fetchLocations();
};

  // Reemplazar la función handleOpenDialog existente con esta versión mejorada
const handleOpenDialog = async (location = null) => {
  try {
    if (location) {
      setEditingLocation(location);
      setFormData({
        material: location.material,
        tray: location.tray,
        quantity: location.quantity,
        minimum_quantity: location.minimum_quantity
      });
      
      // Obtener información detallada de la balda para establecer la jerarquía
      const trayResponse = await axios.get(`/storage/trays/${location.tray}/`);
      const trayData = trayResponse.data;
      
      // Obtener info de la estantería
      const shelfResponse = await axios.get(`/storage/shelves/${trayData.shelf}/`);
      const shelfData = shelfResponse.data;
      
      // Obtener info del departamento
      const departmentResponse = await axios.get(`/storage/departments/${shelfData.department}/`);
      const departmentData = departmentResponse.data;
      
      // Establecer los valores seleccionados en orden jerárquico
      const warehouseId = departmentData.warehouse;
      setFormSelectors(prev => ({ ...prev, warehouse: warehouseId }));
      await fetchDepartments(warehouseId);
      
      setFormSelectors(prev => ({ ...prev, department: shelfData.department }));
      await fetchShelves(shelfData.department);
      
      setFormSelectors(prev => ({ ...prev, shelf: trayData.shelf }));
      await fetchTrays(trayData.shelf);
      
    } else {
      // Resetear todo para una nueva ubicación
      setEditingLocation(null);
      setFormData({
        material: '',
        tray: '',
        quantity: 0,
        minimum_quantity: 0
      });
      
      // Resetear los selectores jerárquicos
      setFormSelectors({ 
        warehouse: '', 
        department: '', 
        shelf: ''
      });
      
      setDepartments([]);
      setShelves([]);
      setTrays([]);
    }
    
    setOpenDialog(true);
  } catch (error) {
    console.error('Error al preparar el diálogo de ubicación:', error);
    toast.error('Error al cargar los datos para la edición');
  }
};
  
const handleCloseDialog = () => {
  setOpenDialog(false);
  setEditingLocation(null);
  setFormData({
    material: '',
    tray: '',
    quantity: 0,
    minimum_quantity: 0
  });
  
  // Resetear los selectores del formulario
  setFormSelectors({
    warehouse: '',
    department: '',
    shelf: ''
  });
  
  // Reestablecer también la información de stock
  setStockInfo({
    totalStock: 0,
    totalAllocated: 0,
    availableStock: 0,
    loading: false
  });
};
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'minimum_quantity' ? Number(value) : value
    });
  };
  
  // Añadir esta función después de handleInputChange
const handleFormSelectorChange = (e) => {
  const { name, value } = e.target;
  setFormSelectors({
    ...formSelectors,
    [name]: value
  });
  
  // Gestionar los cambios de jerarquía
  if (name === 'warehouse') {
    // Si cambia el almacén, cargar departamentos y resetear selecciones inferiores
    fetchDepartments(value);
    setFormSelectors(prev => ({ ...prev, department: '', shelf: '' }));
    setFormData(prev => ({ ...prev, tray: '' }));
    setShelves([]);
    setTrays([]);
  } else if (name === 'department') {
    // Si cambia el departamento, cargar estanterías y resetear selecciones inferiores
    fetchShelves(value);
    setFormSelectors(prev => ({ ...prev, shelf: '' }));
    setFormData(prev => ({ ...prev, tray: '' }));
    setTrays([]);
  } else if (name === 'shelf') {
    // Si cambia la estantería, cargar baldas y resetear la balda seleccionada
    fetchTrays(value);
    setFormData(prev => ({ ...prev, tray: '' }));
  }
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
      
      if (formData.quantity <= 0) {
        toast.error('La cantidad debe ser mayor que cero');
        return;
      }
      
      // Verificar stock disponible
      const stockInfo = await verifyAvailableStock(formData.material);
      
      let savedLocation;
      
      if (editingLocation) {
        // Si estamos editando, debemos considerar el stock actual
        const currentStock = editingLocation.quantity || 0;
        const requestedIncrease = formData.quantity - currentStock;
        
        // Si estamos aumentando la cantidad, verificar si hay stock disponible
        if (requestedIncrease > 0 && requestedIncrease > stockInfo.availableStock) {
          toast.error(`No hay suficiente stock disponible. Máximo incremento posible: ${stockInfo.availableStock}`);
          return;
        }
        
        savedLocation = await updateMaterialLocation(editingLocation.id, formData);
        toast.success('Ubicación de material actualizada correctamente');
      } else {
        // Si estamos creando, verificar si hay suficiente stock
        if (formData.quantity > stockInfo.availableStock) {
          toast.error(`No hay suficiente stock disponible. Máximo disponible: ${stockInfo.availableStock}`);
          return;
        }
        
        savedLocation = await createMaterialLocation(formData);
        toast.success('Ubicación de material creada correctamente');
      }
      
      // Cerrar el diálogo
      handleCloseDialog();
      
      // Recargar la lista completa en lugar de intentar actualizar el estado directamente
      setLoading(true);
      
      try {
        const newLocations = await getMaterialLocations();
        setLocations(newLocations);
        
        // Simplificar el filtrado, aplicar solo filtro de stock bajo
        let filtered = [...newLocations];
        
        if (filters.lowStock) {
          filtered = filtered.filter(location => 
            location.quantity <= location.minimum_quantity
          );
        }
        
        setFilteredLocations(filtered);
        
      } catch (error) {
        console.error('Error al recargar ubicaciones:', error);
        toast.error('Error al actualizar la lista de ubicaciones');
      } finally {
        setLoading(false);
      }
      
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
  
  // Añadir esta función después de handleFilterChange
const verifyAvailableStock = async (materialId) => {
  try {
    // Obtener información del material
    const materialResponse = await axios.get(`/materials/materials/${materialId}/`);
    const material = materialResponse.data;
    
    // Obtener todas las ubicaciones existentes para este material
    const locationsResponse = await getMaterialLocations({ material: materialId });
    const materialLocations = Array.isArray(locationsResponse) ? locationsResponse : [];
    
    // Calcular el total ya ubicado
    const totalAllocated = materialLocations.reduce((sum, location) => {
      // Si estamos editando, excluir la ubicación actual del cálculo
      if (editingLocation && location.id === editingLocation.id) {
        return sum;
      }
      return sum + location.quantity;
    }, 0);
    
    // Stock total del material
    const totalStock = material.quantity || 0;
    
    // Stock disponible = total - ubicado
    const availableStock = totalStock - totalAllocated;
    
    return {
      totalStock,
      totalAllocated,
      availableStock
    };
  } catch (error) {
    console.error("Error al verificar stock disponible:", error);
    throw error;
  }
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
        <Typography variant="h6">
          {showLowStock ? 'Ubicaciones con Stock Bajo' : 'Ubicaciones de Materiales'}
        </Typography>
        
        <Box>
          {/* Mostrar el botón "Ver Todas" solo cuando estamos en modo stock bajo y NO venimos del parámetro URL */}
          {showLowStock && !lowStockParam && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Visibility />}
              onClick={() => {
                fetchLocations();
                setShowLowStock(false);
              }}
              sx={{ mr: 1 }}
            >
              Ver Todas
            </Button>
          )}
          
          {/* Mostrar el botón "Ver Stock Bajo" solo cuando no estamos en modo stock bajo */}
          {!showLowStock && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<WarningAmber />}
              onClick={() => {
                fetchLowStock();
              }}
              sx={{ mr: 1 }}
            >
              Ver Stock Bajo
            </Button>
          )}
          
          {/* Mostrar el botón "Nueva Ubicación" solo cuando NO estamos en el modo stock bajo por parámetro URL */}
          {!lowStockParam && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nueva Ubicación
            </Button>
          )}
        </Box>
      </Box>
      
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
              filter: {
                filterModel: {
                  items: [],
                },
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                    disabled={Boolean(editingLocation)}
                  >
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Añadir información de stock */}
                {formData.material && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    {stockInfo.loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Cargando información de stock...
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Stock total:</Typography>
                          <Typography variant="body2" fontWeight="medium">{stockInfo.totalStock}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Ya ubicado:</Typography>
                          <Typography variant="body2" fontWeight="medium">{stockInfo.totalAllocated}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Disponible:</Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            color={stockInfo.availableStock <= 0 ? 'error.main' : 'success.main'}
                          >
                            {stockInfo.availableStock}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}
                {formData.material && !stockInfo.loading && stockInfo.availableStock <= 0 && !editingLocation && (
                  <Box sx={{ mt: 1 }}>
                    <Alert severity="error">
                      No hay stock disponible para ubicar. Todo el stock de este material ya está asignado a ubicaciones.
                    </Alert>
                  </Box>
                )}
              </Grid>
              
              {/* Selector de almacén */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Almacén</InputLabel>
                  <Select
                    name="warehouse"
                    value={formSelectors.warehouse}
                    label="Almacén *"
                    onChange={handleFormSelectorChange}
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
              
              {/* Selector de departamento */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={!formSelectors.warehouse}>
                  <InputLabel>Dependencia</InputLabel>
                  <Select
                    name="department"
                    value={formSelectors.department}
                    label="Dependencia *"
                    onChange={handleFormSelectorChange}
                    disabled={!Boolean(formSelectors.warehouse)}
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
              
              {/* Selector de estantería */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={!formSelectors.department}>
                  <InputLabel>Estantería</InputLabel>
                  <Select
                    name="shelf"
                    value={formSelectors.shelf}
                    label="Estantería *"
                    onChange={handleFormSelectorChange}
                    disabled={!Boolean(formSelectors.department)}
                  >
                    <MenuItem value="">Seleccione una estantería</MenuItem>
                    {shelves.map((shelf) => (
                      <MenuItem key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Selector de balda */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={!formSelectors.shelf}>
                  <InputLabel>Balda</InputLabel>
                  <Select
                    name="tray"
                    value={formData.tray}
                    label="Balda *"
                    onChange={handleInputChange}
                    disabled={!Boolean(formSelectors.shelf)}
                  >
                    <MenuItem value="">Seleccione una balda</MenuItem>
                    {trays.map((tray) => (
                      <MenuItem key={tray.id} value={tray.id}>
                        {`${tray.name} ${tray.full_code ? `(${tray.full_code})` : ''}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* En el campo TextField de quantity */}
              <Grid item xs={12} md={6}>
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={formData.quantity}
                  onChange={handleInputChange}
                  InputProps={{ 
                    inputProps: { 
                      min: 0, 
                      max: editingLocation 
                        ? stockInfo.availableStock + (editingLocation.quantity || 0) 
                        : stockInfo.availableStock 
                    }
                  }}
                  disabled={stockInfo.availableStock <= 0 && !editingLocation}
                  helperText={
                    editingLocation 
                      ? `Disponible para añadir: ${stockInfo.availableStock}` 
                      : `Máximo disponible: ${stockInfo.availableStock}`
                  }
                  error={
                    editingLocation 
                      ? formData.quantity - (editingLocation.quantity || 0) > stockInfo.availableStock
                      : formData.quantity > stockInfo.availableStock
                  }
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
            disabled={
              !formData.material || 
              !formData.tray || 
              formData.quantity <= 0 ||
              (!editingLocation && stockInfo.availableStock <= 0) ||
              (editingLocation 
                ? formData.quantity - (editingLocation.quantity || 0) > stockInfo.availableStock
                : formData.quantity > stockInfo.availableStock
              )
            }
          >
            {editingLocation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialLocationList;
