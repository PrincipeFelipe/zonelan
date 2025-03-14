import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Card, CardContent, Grid, Divider, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, AlertTitle
} from '@mui/material';
import {
    ArrowBack, Print, Delete, Add, CreditCard, Cancel
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useTickets } from '../../hooks/useTickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/helpers';
import AddTicketItemDialog from './AddTicketItemDialog';
import Swal from 'sweetalert2';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        printTicket, 
        markAsPaid, 
        cancelTicket, 
        removeTicketItem,
        deleteTicket
    } = useTickets();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            // Añadir el parámetro include_deleted=true para obtener también tickets eliminados
            const response = await axios.get(`/tickets/tickets/${id}/`, {
                params: { include_deleted: true }
            });
            
            // Convertir campos numéricos a números para evitar problemas con .toFixed()
            if (response.data) {
                // Asegurarse explícitamente que is_deleted sea un booleano
                const isDeleted = response.data.is_deleted === true || 
                                  response.data.is_deleted === "true" || 
                                  response.data.is_deleted === 1 || 
                                  response.data.is_deleted === "1";
                
                const ticketData = {
                    ...response.data,
                    total_amount: parseFloat(response.data.total_amount || 0),
                    // Forzar la evaluación booleana
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
                
                // Mostrar en consola para depuración
                console.log("Datos del ticket:", {
                    id: ticketData.id,
                    deleted: ticketData.is_deleted,
                    originalDeleted: response.data.is_deleted,
                    deleted_at: ticketData.deleted_at,
                    status: ticketData.status
                });
            } else {
                toast.error('No se encontró información del ticket');
                navigate('/dashboard/tickets');
            }
        } catch (error) {
            console.error('Error al cargar ticket:', error);
            toast.error('Error al cargar los datos del ticket');
            navigate('/dashboard/tickets');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintTicket = () => {
        try {
            // Mostrar un indicador de carga antes de iniciar el proceso
            setLoading(true);
            printTicket(id);
        } catch (error) {
            console.error('Error al imprimir:', error);
            toast.error('Error al generar la impresión del ticket');
        } finally {
            // Asegurarse de que el indicador de carga se oculte
            setTimeout(() => setLoading(false), 1000);
        }
    };

    const handleAddItem = () => {
        // Verificar si el ticket está en estado pendiente
        if (ticket.status !== 'PENDING') {
            toast.error('Solo se pueden añadir productos a tickets pendientes');
            return;
        }
        
        setAddItemDialogOpen(true);
    };

    const handleItemAdded = () => {
        setAddItemDialogOpen(false);
        fetchTicket(); // Actualizar datos después de añadir un item
    };

    const handleRemoveItem = async (itemId) => {
        // Verificar si el ticket está en estado pendiente
        if (ticket.status !== 'PENDING') {
            toast.error('Solo se pueden eliminar productos de tickets pendientes');
            return;
        }

        try {
            const { isConfirmed } = await Swal.fire({
                title: '¿Eliminar producto?',
                text: '¿Está seguro de eliminar este producto del ticket?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (isConfirmed) {
                await removeTicketItem(id, itemId);
                fetchTicket(); // Actualizar datos después de eliminar un item
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
        }
    };

    const handlePayTicket = async () => {
        try {
            const { isConfirmed, value } = await Swal.fire({
                title: 'Procesar Pago',
                text: `¿Desea marcar el ticket #${ticket.ticket_number} como pagado?`,
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
                fetchTicket(); // Actualizar datos después de marcar como pagado
                toast.success('Ticket marcado como pagado correctamente');
            }
        } catch (error) {
            console.error('Error al procesar pago:', error);
        }
    };

    const handleCancelTicket = async () => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: 'Cancelar Ticket',
                text: `¿Está seguro de cancelar el ticket #${ticket.ticket_number}? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar ticket',
                cancelButtonText: 'No, mantener ticket'
            });

            if (isConfirmed) {
                await cancelTicket(ticket.id);
                fetchTicket(); // Actualizar datos después de cancelar
                toast.success('Ticket cancelado correctamente');
            }
        } catch (error) {
            console.error('Error al cancelar ticket:', error);
        }
    };

    const handleDeleteTicket = async () => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: '¿Eliminar Ticket?',
                text: `¿Está seguro de eliminar el ticket #${ticket.ticket_number}? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (isConfirmed) {
                // Preguntar qué hacer con los materiales
                const { isConfirmed: returnMaterials } = await Swal.fire({
                    title: 'Materiales del ticket',
                    text: '¿Desea devolver los materiales al stock?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, devolver al stock',
                    cancelButtonText: 'No, mantener registros'
                });

                // Usar el hook useTickets para eliminar el ticket
                await deleteTicket(ticket.id, returnMaterials);
                
                // Redirigir a la lista de tickets
                toast.success('Ticket eliminado correctamente');
                navigate('/dashboard/tickets');
            }
        } catch (error) {
            console.error('Error al eliminar ticket:', error);
            toast.error('Error al eliminar el ticket');
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'PAID': return 'Pagado';
            case 'CANCELED': return 'Cancelado';
            default: return status || 'Desconocido';
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

    const isTicketDeleted = Boolean(ticket?.is_deleted);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!ticket) {
        return (
            <Alert severity="error">No se pudo cargar el ticket. Por favor, intente de nuevo.</Alert>
        );
    }

    return (
        <>
            {/* Banner superior para tickets eliminados - mantener este como único indicador principal */}
            {isTicketDeleted && (
                <Paper 
                    sx={{ 
                        p: 1.5, 
                        mb: 3, 
                        backgroundColor: '#ffebee', 
                        borderLeft: '5px solid #d32f2f',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Delete color="error" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="error">
                            TICKET ELIMINADO
                            {ticket.deleted_at && (
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                    el {format(new Date(ticket.deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </Typography>
                            )}
                        </Typography>
                    </Box>
                    <Button 
                        variant="outlined" 
                        color="error"
                        size="small" 
                        onClick={() => navigate('/dashboard/tickets')}
                    >
                        Volver a la lista
                    </Button>
                </Paper>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/dashboard/tickets')}
                    >
                        Volver
                    </Button>
                    <Typography variant="h6">
                        Ticket {ticket.ticket_number || `#${ticket.id}`}
                    </Typography>
                    <Chip 
                        label={getStatusLabel(ticket.status)} 
                        color={getStatusColor(ticket.status)}
                        size="small"
                    />
                    {/* Mantener solo el chip como indicador adicional más discreto */}
                    {isTicketDeleted && (
                        <Chip 
                            label="Eliminado" 
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {ticket.status === 'PENDING' && !ticket.is_deleted && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddItem}
                                color="primary"
                                sx={{ mr: 1 }}
                            >
                                Añadir Producto
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CreditCard />}
                                onClick={handlePayTicket}
                                color="success"
                                sx={{ mr: 1 }}
                            >
                                Procesar Pago
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancelTicket}
                                color="error"
                            >
                                Cancelar
                            </Button>
                        </>
                    )}

                    {(ticket.status === 'PAID' || ticket.status === 'CANCELED') && !ticket.is_deleted && (
                        <Button
                            variant="outlined"
                            startIcon={<Print />}
                            onClick={handlePrintTicket}
                            color="primary"
                            sx={{ mr: 1 }}
                            disabled={ticket.status !== 'PAID'}
                        >
                            Imprimir
                        </Button>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Información del Ticket
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Typography variant="body2" gutterBottom>
                                <strong>Número:</strong> {ticket.ticket_number || `#${ticket.id}`}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Estado:</strong> {getStatusLabel(ticket.status)}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Fecha:</strong> {ticket.created_at ? 
                                    format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                    'Pendiente'
                                }
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Cliente:</strong> {ticket.customer_name || 'Sin cliente'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Método de pago:</strong> {
                                    ticket.payment_method ? (
                                        ticket.payment_method === 'CASH' ? 'Efectivo' :
                                        ticket.payment_method === 'CARD' ? 'Tarjeta' :
                                        ticket.payment_method === 'TRANSFER' ? 'Transferencia' : 'Otro'
                                    ) : 'No especificado'
                                }
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Notas:</strong> {ticket.notes || 'Sin notas'}
                            </Typography>
                            {ticket.paid_at && (
                                <Typography variant="body2" gutterBottom>
                                    <strong>Fecha de pago:</strong> {format(new Date(ticket.paid_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </Typography>
                            )}
                            {ticket.canceled_at && (
                                <Typography variant="body2" gutterBottom>
                                    <strong>Fecha de cancelación:</strong> {format(new Date(ticket.canceled_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </Typography>
                            )}
                            
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                <Typography variant="h6" color="primary">
                                    Total: {formatCurrency(ticket.total_amount)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Productos
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {ticket.items && ticket.items.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Material</TableCell>
                                                <TableCell>Cantidad</TableCell>
                                                <TableCell>Precio unitario</TableCell>
                                                <TableCell>Descuento</TableCell>
                                                <TableCell>Total</TableCell>
                                                <TableCell align="center">Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {ticket.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.material_name}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                                    <TableCell>{item.discount_percentage}%</TableCell>
                                                    <TableCell>{formatCurrency(item.total_price)}</TableCell>
                                                    <TableCell align="center">
                                                        {ticket.status === 'PENDING' && (
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                                    No hay productos en este ticket
                                </Typography>
                            )}
                            
                            {ticket.status === 'PENDING' && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<Add />} 
                                        onClick={handleAddItem}
                                    >
                                        Añadir Producto
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Diálogo para añadir productos */}
            <AddTicketItemDialog
                open={addItemDialogOpen}
                onClose={() => setAddItemDialogOpen(false)}
                onSuccess={handleItemAdded}
                ticketId={id}
            />

            <Toaster position="top-right" />
        </>
    );
};

export default TicketDetail;
