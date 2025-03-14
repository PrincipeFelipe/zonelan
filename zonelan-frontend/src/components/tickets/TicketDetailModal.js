import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
    Typography, Box, Grid, Chip, Divider, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, AlertTitle
} from '@mui/material';
import { Close, Receipt, Person, Event, Print, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from '../../utils/axiosConfig';
import { useTickets } from '../../hooks/useTickets';
import { formatCurrency } from '../../utils/helpers';

const TicketDetailModal = ({ open, onClose, ticketId }) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { printTicket } = useTickets();

    useEffect(() => {
        if (open && ticketId) {
            fetchTicketDetails(ticketId);
        }
    }, [open, ticketId]);

    const fetchTicketDetails = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/tickets/tickets/${id}/`, {
                params: { include_deleted: true }
            });
            
            // Convertir números para evitar problemas con formateo
            if (response.data) {
                // Asegurarnos de que is_deleted se interprete correctamente como booleano
                const isDeleted = response.data.is_deleted === true || 
                                  response.data.is_deleted === "true" || 
                                  response.data.is_deleted === 1 || 
                                  response.data.is_deleted === "1";
                                  
                const ticketData = {
                    ...response.data,
                    total_amount: parseFloat(response.data.total_amount || 0),
                    // Asegurar interpretación booleana correcta
                    is_deleted: isDeleted,
                    items: Array.isArray(response.data.items) ? response.data.items.map(item => ({
                        ...item,
                        quantity: parseFloat(item.quantity || 0),
                        unit_price: parseFloat(item.unit_price || 0),
                        total_price: parseFloat(item.total_price || 0),
                        discount_percentage: parseFloat(item.discount_percentage || 0)
                    })) : []
                };
                setTicket(ticketData);
            }
        } catch (err) {
            console.error('Error al cargar los detalles del ticket:', err);
            setError('No se pudieron cargar los detalles del ticket');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintTicket = () => {
        if (ticketId) {
            try {
                printTicket(ticketId);
            } catch (error) {
                console.error('Error al imprimir:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'PAID': return 'Pagado';
            case 'CANCELED': return 'Cancelado';
            default: return status;
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
            case 'BIZUM': return 'Bizum';
            default: return method || 'No especificado';
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                        <Receipt sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            Ticket {ticket?.ticket_number || `#${ticketId}`}
                        </Typography>
                        {ticket && (
                            <Chip 
                                label={getStatusLabel(ticket.status)} 
                                color={getStatusColor(ticket.status)} 
                                size="small" 
                                sx={{ ml: 1 }} 
                            />
                        )}
                        {/* Añadir indicador de eliminado */}
                        {ticket && ticket.is_deleted && (
                            <Chip 
                                label="Eliminado" 
                                color="error" 
                                size="small" 
                                sx={{ ml: 1 }}
                                icon={<Delete fontSize="small" />}
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : ticket ? (
                    <>
                        {/* Mostrar alerta cuando el ticket está eliminado */}
                        {ticket.is_deleted && (
                            <Alert 
                                severity="warning" 
                                sx={{ mb: 2 }}
                                icon={<Delete color="error" />}
                            >
                                <AlertTitle>Ticket eliminado</AlertTitle>
                                Este ticket ha sido eliminado
                                {ticket.deleted_at && (
                                    <> el {formatDate(ticket.deleted_at)}</>
                                )}.
                            </Alert>
                        )}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 2 }}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Person fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle2">Cliente</Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        {ticket.customer_name || 'Sin cliente'}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Event fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle2">Fecha</Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        {formatDate(ticket.created_at)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Método de pago
                                    </Typography>
                                    <Typography variant="body2">
                                        {getPaymentMethodLabel(ticket.payment_method)}
                                    </Typography>
                                </Box>

                                {ticket.notes && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Notas
                                        </Typography>
                                        <Typography variant="body2">
                                            {ticket.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom>
                            Productos
                        </Typography>

                        {ticket.items && ticket.items.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Material</TableCell>
                                            <TableCell align="center">Cantidad</TableCell>
                                            <TableCell align="right">Precio unitario</TableCell>
                                            <TableCell align="center">Descuento</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {ticket.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.material_name}</TableCell>
                                                <TableCell align="center">{item.quantity}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                                                <TableCell align="center">{item.discount_percentage}%</TableCell>
                                                <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No hay productos en este ticket
                            </Typography>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography variant="h6" color="primary">
                                Total: {formatCurrency(ticket.total_amount)}
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            {ticket.paid_at && (
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Fecha de pago:</strong> {formatDate(ticket.paid_at)}
                                </Typography>
                            )}
                            {ticket.canceled_at && (
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Fecha de cancelación:</strong> {formatDate(ticket.canceled_at)}
                                </Typography>
                            )}
                        </Box>
                    </>
                ) : (
                    <Typography color="text.secondary">
                        No se ha encontrado información del ticket
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
                {ticket && ticket.status === 'PAID' && (
                    <Button 
                        startIcon={<Print />}
                        onClick={handlePrintTicket}
                    >
                        Imprimir
                    </Button>
                )}
                <Button 
                    color="primary" 
                    variant="contained" 
                    href={`/dashboard/tickets/${ticketId}`}
                >
                    Ver detalle completo
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TicketDetailModal;