import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
  CalendarMonth,
  FilterList,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import differenceInDays from 'date-fns/differenceInDays';
import es from 'date-fns/locale/es';
import { useContracts } from '../../hooks/useContracts';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const ContractList = () => {
  const navigate = useNavigate();
  const { fetchContracts, deleteContract, loading } = useContracts();
  
  const [contracts, setContracts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    requires_maintenance: '',
    pending_maintenance: false,
    expiring_soon: false
  });
  
  useEffect(() => {
    loadContracts();
  }, []);
  
  const loadContracts = async (appliedFilters = {}) => {
    try {
      const contractsData = await fetchContracts({
        ...appliedFilters
      });
      setContracts(contractsData);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('Error al cargar la lista de contratos');
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleFilterToggle = (filterName) => {
    setFilters({
      ...filters,
      [filterName]: !filters[filterName]
    });
  };
  
  const handleFilterDialogOpen = () => {
    setFilterDialogOpen(true);
  };
  
  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };
  
  const handleFilterApply = () => {
    loadContracts(filters);
    setFilterDialogOpen(false);
  };
  
  const handleFilterReset = () => {
    setFilters({
      status: '',
      customer: '',
      requires_maintenance: '',
      pending_maintenance: false,
      expiring_soon: false
    });
    loadContracts({});
    setFilterDialogOpen(false);
  };
  
  const handleDeleteContract = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción no se puede revertir",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      
      if (result.isConfirmed) {
        await deleteContract(id);
        toast.success('Contrato eliminado correctamente');
        loadContracts(filters);
      }
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      toast.error('Error al eliminar el contrato');
    }
  };
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };
  
  // Función para verificar si un contrato tiene mantenimiento pendiente
  const isMaintenancePending = (contract) => {
    // Primero verificar si el contrato requiere mantenimiento
    if (!contract.requires_maintenance) {
      return false;
    }
    
    // Si no tiene fecha de próximo mantenimiento pero requiere mantenimiento, considerarlo pendiente
    if (!contract.next_maintenance_date) {
      return true;
    }
    
    // Verificar si la fecha de próximo mantenimiento ya pasó o es hoy
    const today = new Date();
    // La fecha viene en formato ISO (YYYY-MM-DD)
    const nextMaintenance = parseISO(contract.next_maintenance_date);
    const daysToMaintenance = differenceInDays(nextMaintenance, today);
    
    // Si daysToMaintenance es menor o igual a 0, entonces el mantenimiento está pendiente
    return daysToMaintenance <= 0;
  };
  
  // Filtrado de contratos por término de búsqueda
  const filteredContracts = contracts.filter((contract) => 
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contract.description && contract.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Paginación
  const displayedContracts = filteredContracts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Contador de filtros activos
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false && value !== undefined
  ).length;
  
  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestión de Contratos
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/contracts/new')}
        >
          Nuevo Contrato
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar por título, cliente o descripción"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<FilterList />}
                onClick={handleFilterDialogOpen}
                color={activeFiltersCount > 0 ? "primary" : "inherit"}
              >
                Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
              
              {/* Filtros rápidos */}
              <Button 
                variant={filters.pending_maintenance ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  const updatedFilter = !filters.pending_maintenance;
                  setFilters({
                    ...filters,
                    pending_maintenance: updatedFilter
                  });
                  loadContracts({
                    ...filters,
                    pending_maintenance: updatedFilter
                  });
                }}
                startIcon={<Warning />}
                color={filters.pending_maintenance ? "warning" : "inherit"}
              >
                Mantenimientos
              </Button>
              
              <Button 
                variant={filters.expiring_soon ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  const updatedFilter = !filters.expiring_soon;
                  setFilters({
                    ...filters,
                    expiring_soon: updatedFilter
                  });
                  loadContracts({
                    ...filters,
                    expiring_soon: updatedFilter
                  });
                }}
                startIcon={<CalendarMonth />}
                color={filters.expiring_soon ? "error" : "inherit"}
              >
                Por vencer
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha inicio</TableCell>
              <TableCell>Fecha fin</TableCell>
              <TableCell>Mantenimiento</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              displayedContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.customer_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={contract.status} 
                      color={contract.status === 'ACTIVE' ? 'success' : contract.status === 'INACTIVE' ? 'default' : 'error'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(contract.start_date)}</TableCell>
                  <TableCell>{formatDate(contract.end_date)}</TableCell>
                  <TableCell>
                    {contract.requires_maintenance ? (
                      isMaintenancePending(contract) ? (
                        <Chip 
                          label="Pendiente" 
                          color="warning" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          label="Programado" 
                          color="info" 
                          size="small" 
                        />
                      )
                    ) : (
                      <Chip 
                        label="No requiere" 
                        color="default" 
                        variant="outlined" 
                        size="small" 
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/dashboard/contracts/${contract.id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/dashboard/contracts/${contract.id}/edit`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => handleDeleteContract(contract.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={filteredContracts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* Dialogo de filtros */}
      <Dialog open={filterDialogOpen} onClose={handleFilterDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Filtros
          <IconButton
            aria-label="close"
            onClick={handleFilterDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="INACTIVE">Inactivo</MenuItem>
                  <MenuItem value="EXPIRED">Vencido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Cliente"
                name="customer"
                value={filters.customer}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Mantenimiento</InputLabel>
                <Select
                  name="requires_maintenance"
                  value={filters.requires_maintenance}
                  onChange={handleFilterChange}
                  label="Mantenimiento"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Requiere</MenuItem>
                  <MenuItem value="false">No requiere</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.pending_maintenance}
                    onChange={() => handleFilterToggle('pending_maintenance')}
                    name="pending_maintenance"
                    color="primary"
                  />
                }
                label="Mantenimiento pendiente"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.expiring_soon}
                    onChange={() => handleFilterToggle('expiring_soon')}
                    name="expiring_soon"
                    color="primary"
                  />
                }
                label="Próximos a vencer"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset} color="secondary">
            Resetear
          </Button>
          <Button onClick={handleFilterApply} color="primary">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractList;