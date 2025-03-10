import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, 
    FormControl, InputLabel, Select, MenuItem,
    TextField, InputAdornment, Chip, Tooltip, IconButton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
    Add, Search, Visibility, CreditCard, 
    Cancel, Delete, Print
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import NewTicketDialog from './NewTicketDialog';
import { printTicket } from '../../utils/ticketPrinter';

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
    const navigate = useNavigate();
    const [totalCount, setTotalCount] = useState(0);
    
    // Estado para controlar los permisos del usuario actual
    const [isSuperuser, setIsSuperuser] = useState(false);

    useEffect(() => {
        fetchTickets();
        const user = JSON.parse(localStorage.getItem('user'));
        setIsSuperuser(user?.type === 'SuperAdmin' || user?.type === 'Admin');
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/tickets/tickets/');
            setTickets(response.data.results || response.data);
            setTotalCount(response.data.count || response.data.length);
        } catch (error) {
            console.error('Error al cargar tickets:', error);
            toast.error('Error al cargar la lista de tickets', { position: 'top-right' });
            setTickets([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'PAID': return 'Pagado';
            case 'CANCELED': return 'Cancelado';
            default: return status || 'Pendiente';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ed6c02';
            case 'PAID': return '#2e7d32';
            case 'CANCELED': return '#d32f2f';
            default: return '#757575';
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case 'CASH': return 'Efectivo';
            case 'CARD': return 'Tarjeta';
            case 'TRANSFER': return 'Transferencia';
            case 'BIZUM': return 'Bizum';
            default: return method || 'No especificado';
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0,00 €';
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const handleViewTicket = (id) => {
        navigate(`/dashboard/tickets/${id}`);
    };

    const handlePrintTicket = (id) => {
        try {
            printTicket(id);
            toast.success('Imprimiendo ticket...');
        } catch (error) {
            toast.error('Error al imprimir el ticket');
        }
    };

    const handlePayTicket = async (ticket) => {
        try {
            const { isConfirmed, value } = await Swal.fire({
                title: 'Procesar pago',
                html: `
                    <div>
                        <p>Total a pagar: <strong>${formatCurrency(ticket.total_amount)}</strong></p>
                        <div style="margin-top: 15px;">
                            <label for="payment-method" style="display: block; text-align: left; margin-bottom: 5px;">Método de pago:</label>
                            <select id="payment-method" class="swal2-input" style="width: 100%;">
                                <option value="CASH">Efectivo</option>
                                <option value="CARD">Tarjeta</option>
                                <option value="TRANSFER">Transferencia</option>
                                <option value="BIZUM">Bizum</option>
                            </select>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Procesar pago',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return {
                        paymentMethod: document.getElementById('payment-method').value
                    };
                }
            });

            if (isConfirmed) {
                await axios.post(`/tickets/tickets/${ticket.id}/pay/`, {
                    payment_method: value.paymentMethod
                });
                
                fetchTickets();
                toast.success('Pago procesado correctamente');
                handlePrintTicket(ticket.id);
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            toast.error('Error al procesar el pago');
        }
    };

    const handleCancelTicket = async (ticket) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Quieres cancelar el ticket ${ticket.ticket_number || '#' + ticket.id}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No'
            });

            if (result.isConfirmed) {
                await axios.post(`/tickets/tickets/${ticket.id}/cancel/`);
                fetchTickets(); // Refrescar la lista
                toast.success('Ticket cancelado correctamente');
            }
        } catch (error) {
            console.error('Error al cancelar ticket:', error);
            toast.error('Error al cancelar el ticket');
        }
    };

    const handleDeleteTicket = async (ticket) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Quieres eliminar el ticket ${ticket.ticket_number || '#' + ticket.id}? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                await axios.delete(`/tickets/tickets/${ticket.id}/`);
                fetchTickets(); // Refrescar la lista
                toast.success('Ticket eliminado correctamente', { position: 'top-right' });
            }
        } catch (error) {
            console.error('Error al eliminar ticket:', error);
            toast.error('Error al eliminar el ticket', { position: 'top-right' });
        }
    };

    const handleCreateSuccess = () => {
        setNewTicketDialogOpen(false);
        fetchTickets();
        toast.success('Ticket creado correctamente');
    };
    
    // Columnas para el DataGrid
    const columns = [
        {
            field: 'ticket_number',
            headerName: 'Nº',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Typography variant="body2" fontWeight="500">
                        {params.value || `#${params.row.id}`}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'created_at',
            headerName: 'Fecha',
            width: 180,
            renderCell: (params) => {
                if (!params.value) return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                        <Typography variant="body2">Pendiente</Typography>
                    </Box>
                );
                
                try {
                    return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <Typography variant="body2">
                                {format(new Date(params.value), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {format(new Date(params.value), 'HH:mm', { locale: es })}
                            </Typography>
                        </Box>
                    );
                } catch (error) {
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                            <Typography variant="body2">Fecha inválida</Typography>
                        </Box>
                    );
                }
            }
        },
        {
            field: 'customer_name',
            headerName: 'Cliente',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Typography variant="body2">
                        {params.value || 'Sin cliente'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Estado',
            width: 120,
            renderCell: (params) => {
                const status = params.value || 'PENDING';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                        <Chip
                            size="small"
                            label={getStatusLabel(status)}
                            sx={{
                                color: getStatusColor(status),
                                border: `1px solid ${getStatusColor(status)}`,
                                backgroundColor: 'transparent',
                                fontWeight: 500
                            }}
                            variant="outlined"
                        />
                    </Box>
                );
            }
        },
        {
            field: 'payment_method',
            headerName: 'Método de pago',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Typography variant="body2">
                        {getPaymentMethodLabel(params.value)}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'total_amount',
            headerName: 'Total',
            width: 120,
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
                    <Typography variant="body2" fontWeight="500">
                        {formatCurrency(params.value)}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '4px',
                    height: '100%',
                    width: '100%',
                    '& .MuiIconButton-root': {
                        padding: '4px',
                        fontSize: '0.875rem',
                    }
                }}>
                    <Tooltip title="Ver detalle">
                        <IconButton
                            onClick={() => handleViewTicket(params.row.id)}
                            size="small"
                            sx={{ color: 'info.main' }}
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    
                    {(!params.row.status || params.row.status === 'PENDING') && (
                        <Tooltip title="Procesar pago">
                            <IconButton
                                onClick={() => handlePayTicket(params.row)}
                                size="small"
                                sx={{ color: 'success.main' }}
                            >
                                <CreditCard fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {(!params.row.status || params.row.status === 'PENDING') && (
                        <Tooltip title="Cancelar ticket">
                            <IconButton
                                onClick={() => handleCancelTicket(params.row)}
                                size="small"
                                sx={{ color: 'error.main' }}
                            >
                                <Cancel fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {(params.row.status === 'PAID' || params.row.status === 'CANCELED') && (
                        <Tooltip title="Imprimir">
                            <IconButton
                                onClick={() => handlePrintTicket(params.row.id)}
                                size="small"
                                sx={{ color: 'text.secondary' }}
                            >
                                <Print fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {isSuperuser && (
                        <Tooltip title="Eliminar">
                            <IconButton
                                onClick={() => handleDeleteTicket(params.row)}
                                size="small"
                                sx={{ color: 'error.main' }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )
        }
    ];

    // Filtrar tickets
    const filteredTickets = tickets.filter(ticket => {
        // Aplicar filtro por término de búsqueda
        const matchesSearch = !searchTerm || 
            ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Aplicar filtro por estado
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Traducciones para el DataGrid
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
        noRowsLabel: 'No hay tickets registrados',
        errorOverlayDefaultLabel: 'Ha ocurrido un error.',
        
        // Exportar
        toolbarExportCSV: 'Descargar CSV',
        toolbarExportPrint: 'Imprimir',
    };
    
    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Tickets de Venta
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setNewTicketDialogOpen(true)}
                    >
                        Nuevo Ticket
                    </Button>
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="Buscar por cliente o número de ticket"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ flexGrow: 1, minWidth: 200 }}
                        />
                        
                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Estado"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="PENDING">Pendientes</MenuItem>
                                <MenuItem value="PAID">Pagados</MenuItem>
                                <MenuItem value="CANCELED">Cancelados</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={filteredTickets}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                            sorting: {
                                sortModel: [{ field: 'created_at', sort: 'desc' }],
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
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center', // Centrado vertical para todas las celdas
                                '& .MuiBox-root': {
                                    width: '100%' // Asegurar que todos los contenedores Box ocupen el ancho completo
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
                </Paper>
            </Box>

            <NewTicketDialog 
                open={newTicketDialogOpen}
                onClose={() => setNewTicketDialogOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
};

export default TicketList;