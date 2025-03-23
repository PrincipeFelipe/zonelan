import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment,
    Grid, FormControl, InputLabel, Select, MenuItem, IconButton,
    Tooltip, Chip, Link, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, LinearProgress, Alert, AlertTitle
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
    Search, Clear, Visibility, ReceiptOutlined, Close, 
    ArrowDownward, ArrowUpward, ImportExport, FilterList, Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { getMediaUrl } from '../../utils/helpers';
import { getMaterialMovementById } from '../../services/storageService';
import ReportDetailModal from '../reports/ReportDetailModal';
import TicketDetailModal from '../tickets/TicketDetailModal';
import { useNavigate } from 'react-router-dom';
import ContractReportDetailModal from '../contracts/ContractReportDetailModal';

const MaterialControlList = () => {
    const [controls, setControls] = useState([]);
    const [filteredControls, setFilteredControls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Estados para gestionar la visualización de albaranes
    const [openInvoice, setOpenInvoice] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    
    // Estados para filtros
    const [filters, setFilters] = useState({
        operation: '',
        reason: '',
        material: '',
        user: '',
        operation_type: ''
    });

    // Lista de materiales para el filtro
    const [materialsList, setMaterialsList] = useState([]);
    const [usersList, setUsersList] = useState([]);

    // Añadir estos nuevos estados
    const [openMovementDialog, setOpenMovementDialog] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [loadingMovement, setLoadingMovement] = useState(false);

    // Añadir estos estados para los nuevos modales
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [openTicketDialog, setOpenTicketDialog] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Añadir estos estados después de las otras declaraciones de estado (alrededor de la línea 50)
    const [openControlDetailDialog, setOpenControlDetailDialog] = useState(false);
    const [selectedControl, setSelectedControl] = useState(null);

    // Añadir estos estados
    const [openContractReportDialog, setOpenContractReportDialog] = useState(false);
    const [selectedContractReportId, setSelectedContractReportId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchMaterialControls();
        fetchMaterials();
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [controls, filters]);

    const fetchMaterialControls = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/materials/control/');
            setControls(response.data);
            setFilteredControls(response.data);
        } catch (error) {
            console.error('Error fetching material controls:', error);
            toast.error('Error al cargar el historial de materiales');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await axios.get('/materials/materials/');
            setMaterialsList(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/users/');
            setUsersList(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const applyFilters = () => {
        let filteredData = [...controls];

        if (filters.operation) {
            filteredData = filteredData.filter(control => control.operation === filters.operation);
        }

        if (filters.reason) {
            filteredData = filteredData.filter(control => control.reason === filters.reason);
        }

        if (filters.material) {
            filteredData = filteredData.filter(control => control.material === parseInt(filters.material));
        }

        if (filters.user) {
            filteredData = filteredData.filter(control => control.user === parseInt(filters.user));
        }

        // Filtrar por tipo de operación
        if (filters.operation_type) {
            switch(filters.operation_type) {
                case 'report':
                    filteredData = filteredData.filter(control => control.report !== null);
                    break;
                case 'ticket':
                    filteredData = filteredData.filter(control => control.ticket !== null);
                    break;
                case 'other':
                    filteredData = filteredData.filter(control => control.report === null && control.ticket === null);
                    break;
            }
        }

        setFilteredControls(filteredData);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const resetFilters = () => {
        setFilters({
            operation: '',
            reason: '',
            material: '',
            user: '',
            operation_type: ''
        });
    };

    // Función para manejar la visualización del albarán
    const handleViewInvoice = (invoiceUrl) => {
        setCurrentInvoice(invoiceUrl);
        setOpenInvoice(true);
    };

    const getReasonColor = (reason) => {
        switch (reason) {
            case 'COMPRA': return 'info';
            case 'VENTA': return 'warning';
            case 'RETIRADA': return 'secondary';
            case 'USO': return 'error';
            case 'DEVOLUCION': return 'success';
            case 'TRASLADO': return 'info';
            case 'CUADRE': return 'warning';  // Color amarillo para cuadres
            default: return 'default';
        }
    };

    // Modificar getReasonLabel para incluir traslados
    const getReasonLabel = (reason, ticket, reportId, contractReportId) => {
        switch (reason) {
            case 'COMPRA': return 'Compra';
            case 'VENTA': 
                return ticket ? `Venta (Ticket)` : 'Venta';
            case 'RETIRADA': return 'Retirada';
            case 'USO': 
                if (contractReportId) {
                    return `Uso en reporte contrato #${contractReportId}`;
                } else if (reportId) {
                    return `Uso en reporte #${reportId}`;
                }
                return 'Uso en reporte';
            case 'DEVOLUCION': return 'Devolución';
            case 'TRASLADO': return 'Traslado';
            case 'CUADRE': return 'Cuadre de inventario';
            default: return reason;
        }
    };

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    // Añadir estas nuevas funciones
    const handleViewMovement = async (movementId) => {
        try {
            setLoadingMovement(true);
            setOpenMovementDialog(true);
            
            const movementData = await getMaterialMovementById(movementId);
            setSelectedMovement(movementData);
        } catch (error) {
            console.error('Error al cargar los detalles del movimiento:', error);
            toast.error('Error al cargar los detalles del movimiento');
        } finally {
            setLoadingMovement(false);
        }
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
                return null;
        }
    };

    const getOperationColor = (operation) => {
        switch(operation) {
            case 'ADD': return 'success';
            case 'REMOVE': return 'error';
            case 'TRANSFER': return 'info';
            default: return 'default';
        }
    };

    // Añadir estas nuevas funciones
    const handleViewReport = (reportId) => {
        setSelectedReportId(reportId);
        setOpenReportDialog(true);
    };

    // Modificar la función handleViewTicket para abrir el modal en lugar de redirigir
    const handleViewTicket = (ticketId) => {
        setSelectedTicketId(ticketId);
        setOpenTicketDialog(true);
    };

    // Añadir la función para manejar la vista del reporte de contrato
    const handleViewContractReport = (contractReportId) => {
        setSelectedContractReportId(contractReportId);
        setOpenContractReportDialog(true);
    };

    // Añadir estas funciones después de handleViewTicket o en una ubicación adecuada
    const handleViewControl = (control) => {
        setSelectedControl(control);
        setOpenControlDetailDialog(true);
    };

    const handleCloseControlDetailDialog = () => {
        setOpenControlDetailDialog(false);
        setSelectedControl(null);
    };

    // Modificar las columnas para aplicar alineación vertical consistente

const columns = [
    { 
        field: 'id', 
        headerName: 'ID', 
        width: 70,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                <Typography variant="body2">
                    #{params.value}
                </Typography>
            </Box>
        ),
    },
    { 
        // Cambiar de 'timestamp' a 'date', que es el nombre correcto que viene del backend
        field: 'date',  
        headerName: 'Fecha', 
        width: 180,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
                <Typography variant="body2">
                    {formatDate(params.value).split(' ')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {formatDate(params.value).split(' ')[1] || ''}
                </Typography>
            </Box>
        )
    },
    { 
        field: 'material_name', 
        headerName: 'Material', 
        flex: 1, 
        minWidth: 150,
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
        field: 'operation', 
        headerName: 'Operación', 
        width: 120,
        renderCell: (params) => {
            const getOperationLabel = (op) => {
                switch(op) {
                    case 'ADD': return 'Entrada';
                    case 'REMOVE': return 'Salida';
                    case 'TRANSFER': return 'Traslado';
                    default: return op;
                }
            };
            
            const getOperationColor = (op) => {
                switch(op) {
                    case 'ADD': return 'success';
                    case 'REMOVE': return 'error';
                    case 'TRANSFER': return 'info';
                    default: return 'default';
                }
            };
            
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Chip 
                        size="small" 
                        label={getOperationLabel(params.value)} 
                        color={getOperationColor(params.value)}
                        variant="outlined"
                        sx={{ 
                            border: `1px solid ${
                                params.value === 'ADD' ? '#2e7d32' : 
                                params.value === 'REMOVE' ? '#d32f2f' : 
                                '#0288d1'
                            }`,
                            color: params.value === 'ADD' ? '#2e7d32' : 
                                   params.value === 'REMOVE' ? '#d32f2f' : 
                                   '#0288d1',
                            backgroundColor: 'transparent'
                        }}
                    />
                </Box>
            )
        }
    },
    { 
        field: 'reason', 
        headerName: 'Motivo', 
        width: 150,
        renderCell: (params) => {
            const reason = params.value;
            let color;
            
            switch (reason) {
                case 'COMPRA': color = '#0277bd'; break;
                case 'VENTA': color = '#ed6c02'; break;
                case 'RETIRADA': color = '#9c27b0'; break;
                case 'USO': color = '#d32f2f'; break;
                case 'DEVOLUCION': color = '#2e7d32'; break;
                case 'TRASLADO': color = '#0288d1'; break;
                case 'CUADRE': color = '#ff8f00'; break;  // Color ámbar para cuadres
                default: color = '#757575';
            }
            
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Chip 
                        size="small" 
                        label={getReasonLabel(params.value, params.row.ticket)} 
                        sx={{
                            color: color,
                            border: `1px solid ${color}`,
                            backgroundColor: 'transparent'
                        }}
                        variant="outlined"
                    />
                </Box>
            );
        }
    },
    { 
        // Cambiar de 'user_username' a 'username', que es el nombre correcto que viene del backend
        field: 'username',  
        headerName: 'Usuario', 
        width: 130,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                <Typography variant="body2">
                    {params.value}
                </Typography>
            </Box>
        )
    },
    { 
        field: 'reference', 
        headerName: 'Referencia', 
        width: 200,
        renderCell: (params) => {
            // Si es un cuadre de inventario, no mostrar ninguna referencia
            if (params.row.reason === 'CUADRE') {
                return null;
            }
            
            // Construir referencias según el tipo de referencia disponible
            const references = [];
            
            // Referencia a reporte
            if (params.row.report_id) {
                references.push(
                    <Link 
                        component="button"
                        onClick={(e) => {
                            e.preventDefault();
                            handleViewReport(params.row.report_id);
                        }}
                        key="report"
                        underline="hover"
                        color="primary"
                        sx={{ textAlign: 'left', cursor: 'pointer' }}
                    >
                        Reporte #{params.row.report_id}
                    </Link>
                );
            }
            
            // Referencia a reporte de contrato
            if (params.row.contract_report_id) {
                references.push(
                    <Link 
                        component="button"
                        onClick={(e) => {
                            e.preventDefault();
                            handleViewContractReport(params.row.contract_report_id);
                        }}
                        key="contract_report"
                        underline="hover"
                        color="primary"
                        sx={{ textAlign: 'left', cursor: 'pointer' }}
                    >
                        Reporte contrato #{params.row.contract_report_id}
                    </Link>
                );
            }
            
            // Referencia a ticket
            if (params.row.ticket_id) {
                references.push(
                    <Link 
                        component="button"
                        onClick={(e) => {
                            e.preventDefault();
                            handleViewTicket(params.row.ticket_id);
                        }}
                        key="ticket" 
                        underline="hover"
                        color="primary"
                        sx={{ textAlign: 'left', cursor: 'pointer' }}
                    >
                        Ticket #{params.row.ticket_id}
                    </Link>
                );
            }
            
            // Referencia a movimiento
            if (params.row.movement_id && params.row.movement_id > 0) {
                references.push(
                    <Link 
                        component="button"
                        onClick={(e) => {
                            e.preventDefault();
                            handleViewMovement(params.row.movement_id);
                        }}
                        key="movement" 
                        underline="hover"
                        color="primary"
                        sx={{ textAlign: 'left', cursor: 'pointer' }}
                    >
                        Movimiento #{params.row.movement_id}
                    </Link>
                );
            }
            
            // Si hay referencias específicas, mostrarlas
            if (references.length > 0) {
                return (
                    <Box>
                        {references.map((ref, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <Box sx={{ my: 0.5 }} />}
                                {ref}
                            </React.Fragment>
                        ))}
                    </Box>
                );
            }
            
            // Si no hay ninguna referencia específica, no mostrar nada
            return null;
        }
    },
    // Puedes añadir esta columna al final del array columns:
    { 
        field: 'actions', 
        headerName: 'Acciones', 
        width: 100,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <IconButton
                    onClick={() => handleViewControl(params.row)}
                    size="small"
                    color="primary"
                    title="Ver detalles"
                >
                    <Visibility fontSize="small" />
                </IconButton>
            </Box>
        )
    },
];

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
                Cargando historial de materiales...
            </Typography>
        </Box>
    );

    // Traducción para DataGrid
    const localeText = {
        // Toolbar
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
        
        // Columnas
        columnMenuLabel: 'Menú',
        columnMenuShowColumns: 'Mostrar columnas',
        columnMenuFilter: 'Filtrar',
        columnMenuHideColumn: 'Ocultar',
        columnMenuUnsort: 'Desordenar',
        columnMenuSortAsc: 'Ordenar ASC',
        columnMenuSortDesc: 'Ordenar DESC',
        
        // Filtros
        filterPanelAddFilter: 'Añadir filtro',
        filterPanelDeleteIconLabel: 'Borrar',
        filterPanelOperators: 'Operadores',
        filterPanelOperatorAnd: 'Y',
        filterPanelOperatorOr: 'O',
        filterPanelColumns: 'Columnas',
        
        // Paginación
        footerTotalRows: 'Total de filas:',
        footerTotalVisibleRows: 'Filas visibles:',
        footerRowSelected: 'fila seleccionada',
        footerRowsSelected: 'filas seleccionadas',
        
        // Mensajes
        noRowsLabel: 'No hay datos',
        errorOverlayDefaultLabel: 'Ha ocurrido un error.',
        
        // Exportar
        toolbarExportCSV: 'Descargar CSV',
        toolbarExportPrint: 'Imprimir',
    };

    // Modificar el componente DataGrid para que coincida con el estilo de las otras tablas
    return (
        <Box sx={{ p: 2 }}>
            <Toaster position="top-right" />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Control de Materiales
                </Typography>
                <Box>
                    <Tooltip title={showFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}>
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterList />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {showFilters && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
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
                            <FormControl fullWidth size="small">
                                <InputLabel>Motivo</InputLabel>
                                <Select
                                    name="reason"
                                    value={filters.reason}
                                    label="Motivo"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="COMPRA">Compra</MenuItem>
                                    <MenuItem value="DEVOLUCION">Devolución</MenuItem>
                                    <MenuItem value="RETIRADA">Retirada</MenuItem>
                                    <MenuItem value="VENTA">Venta</MenuItem>
                                    <MenuItem value="USO">Uso</MenuItem>
                                    <MenuItem value="TRASLADO">Traslado</MenuItem>
                                    <MenuItem value="CUADRE">Cuadre de inventario</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Material</InputLabel>
                                <Select
                                    name="material"
                                    value={filters.material}
                                    label="Material"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {materialsList.map(material => (
                                        <MenuItem key={material.id} value={material.id}>
                                            {material.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Usuario</InputLabel>
                                <Select
                                    name="user"
                                    value={filters.user}
                                    label="Usuario"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {usersList.map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de operación</InputLabel>
                                <Select
                                    name="operation_type"
                                    value={filters.operation_type || ''}
                                    label="Tipo de operación"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="report">Reportes</MenuItem>
                                    <MenuItem value="ticket">Tickets</MenuItem>
                                    <MenuItem value="other">Otros</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                    variant="outlined"
                                    startIcon={<Clear />}
                                    onClick={resetFilters}
                                >
                                    Limpiar filtros
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <Box sx={{ width: '100%' }}>
                    <DataGrid
                        rows={filteredControls}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                            sorting: {
                                sortModel: [{ field: 'timestamp', sort: 'desc' }],
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
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
                            minWidth: 0, // Importante: evita que la tabla se desborde
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

            {/* Diálogo para mostrar la imagen del albarán */}
            <Dialog open={openInvoice} onClose={() => setOpenInvoice(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Albarán de Compra</Typography>
                        <IconButton onClick={() => setOpenInvoice(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            minHeight: '400px' 
                        }}
                    >
                        <img 
                            src={currentInvoice ? getMediaUrl(currentInvoice) : ''} 
                            alt="Albarán de compra" 
                            style={{ 
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain'
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInvoice(false)}>Cerrar</Button>
                    <Button 
                        color="primary" 
                        onClick={() => {
                            if (currentInvoice) {
                                const url = getMediaUrl(currentInvoice);
                                window.open(url, '_blank');
                            }
                        }}
                        disabled={!currentInvoice}
                    >
                        Ver en nueva pestaña
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Añadir este diálogo para mostrar los detalles del movimiento */}
            <Dialog open={openMovementDialog} onClose={handleCloseMovementDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Detalles del Movimiento</Typography>
                        <IconButton onClick={handleCloseMovementDialog}>
                            <Clear />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {loadingMovement ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedMovement ? (
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
                                    {selectedMovement.username}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Notas
                                </Typography>
                                <Typography variant="body1">
                                    {selectedMovement.notes || 'Sin notas'}
                                </Typography>
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography>No se pudo cargar la información del movimiento</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMovementDialog}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Añadir estos modales al final del componente */}
            <ReportDetailModal
                open={openReportDialog}
                onClose={() => setOpenReportDialog(false)}
                reportId={selectedReportId}
            />
            
            <TicketDetailModal
                open={openTicketDialog}
                onClose={() => setOpenTicketDialog(false)}
                ticketId={selectedTicketId}
            />

            {/* En el modal de detalle del control, añadir un campo para mostrar las notas */}
            <Dialog open={openControlDetailDialog} onClose={handleCloseControlDetailDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Detalles del Control de Material</Typography>
                        <IconButton onClick={handleCloseControlDetailDialog}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedControl ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Fecha y Hora
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedControl.date)}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Material
                                </Typography>
                                <Typography variant="body1">
                                    {selectedControl.material_name}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Operación
                                </Typography>
                                <Chip 
                                    label={selectedControl.operation === 'ADD' ? 'Entrada' : 
                                           selectedControl.operation === 'REMOVE' ? 'Salida' : 'Traslado'} 
                                    color={getOperationColor(selectedControl.operation)}
                                    variant="outlined"
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Motivo
                                </Typography>
                                <Chip 
                                    label={getReasonLabel(selectedControl.reason, selectedControl.ticket)} 
                                    color={getReasonColor(selectedControl.reason)}
                                    variant="outlined"
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Cantidad
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {selectedControl.quantity}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Usuario
                                </Typography>
                                <Typography variant="body1">
                                    {selectedControl.username}
                                </Typography>
                            </Grid>
                            
                            {selectedControl.notes && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Notas
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedControl.notes}
                                    </Typography>
                                </Grid>
                            )}
                            
                            {selectedControl.report_id && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Reporte asociado
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Link 
                                            component="button"
                                            onClick={() => {
                                                handleCloseControlDetailDialog();
                                                handleViewReport(selectedControl.report_id);
                                            }}
                                            color={selectedControl.report_deleted ? "error" : "primary"}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {selectedControl.report_deleted && <Delete fontSize="small" sx={{ mr: 0.5, color: 'error.main' }} />}
                                            Ver Reporte #{selectedControl.report_id}
                                        </Link>
                                        {selectedControl.report_deleted && (
                                            <Chip 
                                                label="Eliminado" 
                                                color="error"
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                    {selectedControl.report_deleted && selectedControl.report_deleted_at && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Eliminado el {format(new Date(selectedControl.report_deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </Typography>
                                    )}
                                </Grid>
                            )}
                            
                            {selectedControl.ticket_id && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Ticket asociado
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Link 
                                            component="button"
                                            onClick={() => {
                                                handleCloseControlDetailDialog();
                                                handleViewTicket(selectedControl.ticket_id);
                                            }}
                                            color={selectedControl.ticket_deleted ? "error" : "primary"}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {selectedControl.ticket_deleted && <Delete fontSize="small" sx={{ mr: 0.5, color: 'error.main' }} />}
                                            Ver Ticket #{selectedControl.ticket_id}
                                        </Link>
                                        {selectedControl.ticket_deleted && (
                                            <Chip 
                                                label="Eliminado" 
                                                color="error"
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                    {selectedControl.ticket_deleted && selectedControl.ticket_deleted_at && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Eliminado el {format(new Date(selectedControl.ticket_deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </Typography>
                                    )}
                                </Grid>
                            )}
                            
                            {selectedControl.movement_id && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Movimiento asociado
                                    </Typography>
                                    <Link 
                                        component="button"
                                        onClick={() => {
                                            handleCloseControlDetailDialog();
                                            handleViewMovement(selectedControl.movement_id);
                                        }}
                                        color="primary"
                                    >
                                        Ver Movimiento #{selectedControl.movement_id}
                                    </Link>
                                </Grid>
                            )}
                            
                            {selectedControl.invoice_image && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Albarán de compra
                                    </Typography>
                                    <Button 
                                        variant="outlined"
                                        startIcon={<Visibility />}
                                        onClick={() => {
                                            handleCloseControlDetailDialog();
                                            handleViewInvoice(selectedControl.invoice_image);
                                        }}
                                    >
                                        Ver albarán
                                    </Button>
                                </Grid>
                            )}

                            {/* En el diálogo de detalles del control, antes de mostrar los detalles */}
                            {selectedControl && selectedControl.ticket_deleted && (
                                <Alert 
                                    severity="warning" 
                                    sx={{ mb: 2 }}
                                    icon={<Delete color="error" />}
                                >
                                    <AlertTitle>Ticket eliminado</AlertTitle>
                                    Este control de material está asociado a un ticket que ha sido eliminado
                                    {selectedControl.ticket_deleted_at && (
                                        <> el {format(new Date(selectedControl.ticket_deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}</>
                                    )}.
                                </Alert>
                            )}

                            {/* Añadir alerta para reportes eliminados */}
                            {selectedControl && selectedControl.report_deleted && (
                                <Alert 
                                    severity="warning" 
                                    sx={{ mb: 2 }}
                                    icon={<Delete color="error" />}
                                >
                                    <AlertTitle>Reporte eliminado</AlertTitle>
                                    Este control de material está asociado a un reporte que ha sido eliminado
                                    {selectedControl.report_deleted_at && (
                                        <> el {format(new Date(selectedControl.report_deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}</>
                                    )}.
                                </Alert>
                            )}

                            {/* En el modal de detalles del control, añadir sección para reportes de contrato */}
                            {selectedControl.contract_report_id && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Reporte de contrato asociado
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Link 
                                            component="button"
                                            onClick={() => {
                                                handleCloseControlDetailDialog();
                                                handleViewContractReport(selectedControl.contract_report_id);
                                            }}
                                            color={selectedControl.contract_report_deleted ? "error" : "primary"}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {selectedControl.contract_report_deleted && <Delete fontSize="small" sx={{ mr: 0.5, color: 'error.main' }} />}
                                            Ver Reporte Contrato #{selectedControl.contract_report_id}
                                        </Link>
                                        {selectedControl.contract_report_deleted && (
                                            <Chip 
                                                label="Eliminado" 
                                                color="error"
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                    {selectedControl.contract_report_deleted && selectedControl.contract_report_deleted_at && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Eliminado el {format(new Date(selectedControl.contract_report_deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </Typography>
                                    )}
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Typography>No se pudo cargar la información del control</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseControlDetailDialog}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Añadir el modal para reportes de contrato */}
            <ContractReportDetailModal
                open={openContractReportDialog}
                onClose={() => setOpenContractReportDialog(false)}
                reportId={selectedContractReportId}
            />
        </Box>
    );
};

export default MaterialControlList;