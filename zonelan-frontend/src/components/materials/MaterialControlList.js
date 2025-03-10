import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, Link,
    TextField, MenuItem, FormControl, InputLabel, Select, Button,
    Grid, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, 
    DialogActions, LinearProgress
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import { 
    FilterList, Receipt, Close, ReceiptOutlined,
    Search, Clear
} from '@mui/icons-material';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Para reportes
import ReceiptIcon from '@mui/icons-material/Receipt'; // Para tickets
import DescriptionIcon from '@mui/icons-material/Description'; // Para albaranes
import { Toaster, toast } from 'react-hot-toast';
import axios, { getMediaUrl } from '../../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

    const getOperationColor = (operation) => {
        return operation === 'ADD' ? 'success' : 'error';
    };

    const getReasonColor = (reason) => {
        switch (reason) {
            case 'COMPRA': return 'info';
            case 'VENTA': return 'warning';
            case 'RETIRADA': return 'secondary';
            case 'USO': return 'error';
            case 'DEVOLUCION': return 'success';
            default: return 'default';
        }
    };

    // Modificar getReasonLabel para incluir tickets
    const getReasonLabel = (reason, ticket) => {
        switch (reason) {
            case 'COMPRA': return 'Compra';
            case 'VENTA': 
                return ticket ? `Venta (Ticket)` : 'Venta';
            case 'RETIRADA': return 'Retirada';
            case 'USO': return 'Uso en reporte';
            case 'DEVOLUCION': return 'Devolución';
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

    // Modificar la definición de columnas y la implementación de DataGrid
    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70,
            renderCell: (params) => (
                <Typography variant="body2">
                    #{params.value}
                </Typography>
            ),
        },
        { 
            field: 'timestamp', 
            headerName: 'Fecha', 
            width: 180,
            renderCell: (params) => (
                <Box sx={{ lineHeight: 1.2 }}>
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
            minWidth: 150
        },
        { 
            field: 'quantity', 
            headerName: 'Cantidad', 
            width: 100,
            align: 'right',
            headerAlign: 'right',
        },
        { 
            field: 'operation', 
            headerName: 'Operación', 
            width: 120,
            renderCell: (params) => (
                <Chip 
                    size="small" 
                    label={params.value === 'ADD' ? 'Entrada' : 'Salida'} 
                    color={params.value === 'ADD' ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ 
                        border: `1px solid ${params.value === 'ADD' ? '#2e7d32' : '#d32f2f'}`,
                        color: params.value === 'ADD' ? '#2e7d32' : '#d32f2f',
                        backgroundColor: 'transparent'
                    }}
                />
            )
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
                    default: color = '#757575';
                }
                
                return (
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
                );
            }
        },
        { 
            field: 'user_username', 
            headerName: 'Usuario', 
            width: 130 
        },
        { 
            field: 'reference', 
            headerName: 'Referencia', 
            width: 200,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;
                
                // 1. Verificar si hay albarán
                if (row.invoice_url) {
                    return (
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<ReceiptOutlined />}
                            onClick={() => handleViewInvoice(row.invoice_url)}
                        >
                            Ver Albarán
                        </Button>
                    );
                }
                
                // 2. Verificar si hay reporte
                if (row.report) {
                    // Si el reporte está eliminado
                    if (row.report_deleted) {
                        return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Reporte #{row.report}
                                </Typography>
                                <Chip
                                    label="Eliminado"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                    sx={{ fontSize: '0.65rem' }}
                                />
                            </Box>
                        );
                    }
                    
                    // Si el reporte existe y no está eliminado
                    return (
                        <Link 
                            component={RouterLink} 
                            to={`/dashboard/reports/${row.report}`}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <AssignmentIcon fontSize="small" />
                            Reporte #{row.report}
                        </Link>
                    );
                }
                
                // 3. Verificar si hay ticket
                if (row.ticket) {
                    // Si el ticket está cancelado
                    if (row.ticket_canceled) {
                        return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Ticket #{row.ticket}
                                </Typography>
                                <Chip
                                    label="Cancelado"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ fontSize: '0.65rem' }}
                                />
                            </Box>
                        );
                    }
                    
                    // Si el ticket existe y no está cancelado
                    return (
                        <Link 
                            component={RouterLink} 
                            to={`/dashboard/tickets/${row.ticket}`}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <ReceiptIcon fontSize="small" />
                            Ticket #{row.ticket}
                        </Link>
                    );
                }
                
                // Si no hay referencia
                return '-';
            }
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
                                    <MenuItem value="VENTA">Venta</MenuItem>
                                    <MenuItem value="RETIRADA">Retirada</MenuItem>
                                    <MenuItem value="USO">Uso</MenuItem>
                                    <MenuItem value="DEVOLUCION">Devolución</MenuItem>
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

            <Paper sx={{ width: '100%' }}>
                <Box sx={{ height: 600, width: '100%' }}>
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
                                padding: '8px 16px'
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
        </Box>
    );
};

export default MaterialControlList;