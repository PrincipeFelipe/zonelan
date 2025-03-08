import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Chip, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid,
    IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
    Add, Search, Visibility, Print, CreditCard, Cancel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTickets } from '../../hooks/useTickets';
import { formatCurrency } from '../../utils/helpers';
import NewTicketDialog from './NewTicketDialog';
import Swal from 'sweetalert2';

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { printTicket, markAsPaid, cancelTicket } = useTickets();

    useEffect(() => {
        fetchTickets();
    }, [searchTerm, statusFilter]); // Refrescar cuando cambian los filtros

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = {};

            if (searchTerm) {
                params.search = searchTerm;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            console.log('Fetching tickets with params:', params);
            const response = await axios.get('/tickets/tickets/', { params });
            console.log('Tickets response:', response.data);
            
            // Manejar diferentes formatos de respuesta de la API
            if (Array.isArray(response.data)) {
                setTickets(response.data);
                setTotalCount(response.data.length);
            } else if (response.data?.results) {
                setTickets(response.data.results);
                setTotalCount(response.data.count || 0);
            } else {
                setTickets([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error al cargar tickets:', error);
            setTickets([]);
            setTotalCount(0);
            toast.error('Error al cargar la lista de tickets');
        } finally {
            setLoading(false);
        }
    };

    const getPaginatedData = () => {
        if (!tickets || tickets.length === 0) return [];
        
        // Filtrar en cliente si es necesario
        let filtered = [...tickets];
        
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(ticket => 
                ticket.customer_name?.toLowerCase().includes(searchLower) ||
                ticket.ticket_number?.toLowerCase().includes(searchLower)
            );
        }
        
        if (statusFilter) {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }
        
        // Paginar
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filtered.slice(startIndex, endIndex);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
            case 'PENDING': return 'warning';
            case 'PAID': return 'success';
            case 'CANCELED': return 'error';
            default: return 'default';
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case 'CASH': return 'Efectivo';
            case 'CARD': return 'Tarjeta';
            case 'TRANSFER': return 'Transferencia';
            case 'OTHER': return 'Otro';
            default: return method || 'No especificado';
        }
    };

    const handleViewTicket = (id) => {
        navigate(`/dashboard/tickets/${id}`);
    };

    const handlePrintTicket = (id) => {
        printTicket(id);
    };

    const handlePayTicket = async (ticket) => {
        try {
            const { isConfirmed, value } = await Swal.fire({
                title: 'Procesar Pago',
                text: `¿Desea marcar el ticket #${ticket.ticket_number || ticket.id} como pagado?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, marcar como pagado',
                cancelButtonText: 'Cancelar',
                input: 'select',
                inputOptions: {
                    'CASH': 'Efectivo',
                    'CARD': 'Tarjeta',
                    'TRANSFER': 'Transferencia',
                    'OTHER': 'Otro'
                },
                inputPlaceholder: 'Seleccione método de pago',
                inputValue: ticket.payment_method || 'CASH',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Debe seleccionar un método de pago';
                    }
                }
            });

            if (isConfirmed) {
                await markAsPaid(ticket.id, value);
                fetchTickets();
                toast.success('Ticket marcado como pagado correctamente');
            }
        } catch (error) {
            console.error('Error al procesar pago:', error);
            toast.error('Error al procesar el pago');
        }
    };

    const handleCancelTicket = async (ticket) => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: 'Cancelar Ticket',
                text: `¿Está seguro de cancelar el ticket #${ticket.ticket_number || ticket.id}? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar ticket',
                cancelButtonText: 'No, mantener ticket'
            });

            if (isConfirmed) {
                await cancelTicket(ticket.id);
                fetchTickets();
                toast.success('Ticket cancelado correctamente');
            }
        } catch (error) {
            console.error('Error al cancelar ticket:', error);
            toast.error('Error al cancelar el ticket');
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
        setPage(0);
    };

    const handleCreateSuccess = () => {
        setNewTicketDialogOpen(false);
        fetchTickets();
        toast.success('Ticket creado correctamente');
    };

    return (
        <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Tickets de Venta</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setNewTicketDialogOpen(true)}
                >
                    Nuevo Ticket
                </Button>
            </Box>

            <Paper sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por cliente o número de ticket"
                            value={searchTerm}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                label="Estado"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="PENDING">Pendientes</MenuItem>
                                <MenuItem value="PAID">Pagados</MenuItem>
                                <MenuItem value="CANCELED">Cancelados</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nº</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Método de Pago</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress size={24} sx={{ my: 2 }} />
                                    <Typography variant="body2" sx={{ display: 'block' }}>Cargando tickets...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : tickets && tickets.length > 0 ? (
                            getPaginatedData().map((ticket) => (
                                <TableRow key={ticket.id} hover>
                                    <TableCell>{ticket.ticket_number || `#${ticket.id}`}</TableCell>
                                    <TableCell>
                                        {ticket.created_at ? 
                                            format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                            'Pendiente'
                                        }
                                    </TableCell>
                                    <TableCell>{ticket.customer_name || 'Sin cliente'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={getStatusLabel(ticket.status)} 
                                            color={getStatusColor(ticket.status)}
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {getPaymentMethodLabel(ticket.payment_method)}
                                    </TableCell>
                                    <TableCell>{formatCurrency(ticket.total_amount)}</TableCell>
                                    <TableCell align="center">
                                        <Box>
                                            <Tooltip title="Ver detalle">
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => handleViewTicket(ticket.id)}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            {(!ticket.status || ticket.status === 'PENDING') && (
                                                <Tooltip title="Procesar pago">
                                                    <IconButton 
                                                        size="small" 
                                                        color="success"
                                                        onClick={() => handlePayTicket(ticket)}
                                                    >
                                                        <CreditCard fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {(!ticket.status || ticket.status === 'PENDING') && (
                                                <Tooltip title="Cancelar ticket">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleCancelTicket(ticket)}
                                                    >
                                                        <Cancel fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            
                                            {(ticket.status === 'PAID' || ticket.status === 'CANCELED') && (
                                                <Tooltip title="Imprimir">
                                                    <IconButton 
                                                        size="small" 
                                                        color="secondary"
                                                        onClick={() => handlePrintTicket(ticket.id)}
                                                    >
                                                        <Print fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No se encontraron tickets
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>

            <NewTicketDialog 
                open={newTicketDialogOpen}
                onClose={() => setNewTicketDialogOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <Toaster position="top-right" />
        </>
    );
};

export default TicketList;