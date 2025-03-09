import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead,
    TableBody, TableRow, TableCell, TablePagination, Chip, Link,
    TextField, MenuItem, FormControl, InputLabel, Select, Button,
    Grid, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, 
    DialogActions
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
    FilterList, Receipt, Close, ReceiptOutlined,
    Search, Clear
} from '@mui/icons-material';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Para reportes
import ReceiptIcon from '@mui/icons-material/Receipt'; // Para tickets
import DescriptionIcon from '@mui/icons-material/Description'; // Para albaranes
import { toast } from 'react-hot-toast';
import axios, { getMediaUrl } from '../../utils/axiosConfig';

const MaterialControlList = () => {
    const [controls, setControls] = useState([]);
    const [filteredControls, setFilteredControls] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
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
        setPage(0);
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
        const date = new Date(dateString);
        return date.toLocaleString('es-ES');
    };

    // Función para formatear la referencia al reporte, teniendo en cuenta si está eliminado
    const formatDeletedReportReference = (control) => {
        if (!control.report) {
            return '-';
        }
        
        // Si el reporte está marcado como eliminado
        if (control.report_deleted) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Reporte #{control.report}
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
                to={`/dashboard/reports/${control.report}`}
            >
                Ver reporte #{control.report}
            </Link>
        );
    };

    // Función para formatear la referencia al ticket, teniendo en cuenta si está cancelado
    const formatTicketReference = (control) => {
        if (!control.ticket) {
            return '-';
        }
        
        // Si el ticket está cancelado
        if (control.ticket_canceled) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Ticket #{control.ticket}
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
                to={`/dashboard/tickets/${control.ticket}`}
            >
                Ver ticket #{control.ticket}
        </Link>
        );
    };

    // Modificar la definición de columnas

    // 1. Eliminar las columnas individuales de Reporte, Ticket y Albarán
    // 2. Añadir una nueva columna unificada "Referencia"

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'timestamp', headerName: 'Fecha', width: 180, 
            renderCell: (params) => formatDate(params.value) 
        },
        { field: 'material_name', headerName: 'Material', flex: 1 },
        { 
            field: 'operation', 
            headerName: 'Operación', 
            width: 120,
            renderCell: (params) => (
                <Chip 
                    size="small" 
                    label={params.value === 'ADD' ? 'Entrada' : 'Salida'} 
                    color={getOperationColor(params.value)}
                />
            )
        },
        { field: 'quantity', headerName: 'Cantidad', width: 120 },
        { 
            field: 'reason', 
            headerName: 'Motivo', 
            width: 150,
            renderCell: (params) => (
                <Chip 
                    size="small" 
                    label={getReasonLabel(params.value)} 
                    color={getReasonColor(params.value)}
                />
            )
        },
        // Nueva columna unificada "Referencia"
        { 
            field: 'reference', 
            headerName: 'Referencia', 
            width: 200,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;
                
                // 1. Verificar si hay albarán
                if (row.invoice) {
                    return (
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<Receipt />}
                            onClick={() => handleViewInvoice(row.invoice)}
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
        { 
            field: 'user_username', 
            headerName: 'Usuario', 
            width: 150 
        }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Control de Materiales
                </Typography>
                <Box>
                    <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
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

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Material</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Operación</TableCell>
                                <TableCell>Motivo</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Referencia</TableCell> {/* Columna unificada */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredControls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No hay registros disponibles
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredControls
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((control) => (
                                        <TableRow key={control.id}>
                                            <TableCell>
                                                {formatDate(control.timestamp)}
                                            </TableCell>
                                            <TableCell>{control.material_name}</TableCell>
                                            <TableCell>{control.quantity}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={control.operation === 'ADD' ? 'Entrada' : 'Salida'} 
                                                    color={getOperationColor(control.operation)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={getReasonLabel(control.reason, control.ticket)} 
                                                    color={getReasonColor(control.reason)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{control.user_name || control.user_username}</TableCell>
                                            <TableCell>
                                                {/* Renderizado de la referencia unificada */}
                                                {control.invoice_url ? (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<ReceiptOutlined />}
                                                        onClick={() => handleViewInvoice(control.invoice_url)}
                                                    >
                                                        Ver Albarán
                                                    </Button>
                                                ) : control.report ? (
                                                    control.report_deleted ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Reporte #{control.report}
                                                            </Typography>
                                                            <Chip
                                                                label="Eliminado"
                                                                size="small"
                                                                color="default"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem' }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Link 
                                                            component={RouterLink} 
                                                            to={`/dashboard/reports/${control.report}`}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                        >
                                                            <AssignmentIcon fontSize="small" />
                                                            Reporte #{control.report}
                                                        </Link>
                                                    )
                                                ) : control.ticket ? (
                                                    control.ticket_canceled ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Ticket #{control.ticket}
                                                            </Typography>
                                                            <Chip
                                                                label="Cancelado"
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem' }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Link 
                                                            component={RouterLink} 
                                                            to={`/dashboard/tickets/${control.ticket}`}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                        >
                                                            <ReceiptIcon fontSize="small" />
                                                            Ticket #{control.ticket}
                                                        </Link>
                                                    )
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredControls.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
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