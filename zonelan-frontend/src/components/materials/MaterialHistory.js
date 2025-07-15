import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Box,
    IconButton,
    Typography,
    Grid,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { 
    ReceiptOutlined, 
    Close, 
    ArrowUpward,
    ArrowDownward,
    SwapHoriz
} from '@mui/icons-material';
import axios, { getMediaUrl } from '../../utils/axiosConfig';

const MaterialHistory = ({ open, onClose, material }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openInvoice, setOpenInvoice] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (material && material.id && open) {
            fetchHistory();
        }
    }, [material, open]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/materials/material-history/${material.id}/`);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoiceUrl) => {
        setCurrentInvoice(invoiceUrl);
        setOpenInvoice(true);
    };

    // Función actualizada para los colores de operación
    const getOperationColor = (operation) => {
        switch (operation) {
            case 'ADD': return 'success';
            case 'REMOVE': return 'error';
            case 'TRANSFER': return 'info';
            default: return 'default';
        }
    };

    // Función actualizada para los iconos de operación
    const getOperationIcon = (operation) => {
        switch (operation) {
            case 'ADD': return <ArrowUpward fontSize="small" />;
            case 'REMOVE': return <ArrowDownward fontSize="small" />;
            case 'TRANSFER': return <SwapHoriz fontSize="small" />;
            default: return null;
        }
    };

    // Función actualizada para las etiquetas de operación
    const getOperationLabel = (operation) => {
        switch (operation) {
            case 'ADD': return 'Entrada';
            case 'REMOVE': return 'Salida';
            case 'TRANSFER': return 'Traslado';
            default: return operation;
        }
    };

    // Función actualizada para los colores de motivo
    const getReasonColor = (reason) => {
        switch (reason) {
            case 'COMPRA': return 'info';
            case 'VENTA': return 'warning';
            case 'RETIRADA': return 'secondary';
            case 'USO': return 'error';
            case 'DEVOLUCION': return 'success';
            case 'TRASLADO': return 'info';
            case 'CUADRE': return 'warning';
            default: return 'default';
        }
    };

    // Modificar la función getReasonLabel para mostrar tickets eliminados
    const getReasonLabel = (reason, report, reportDeleted, ticket, ticketCanceled, ticketDeleted) => {
        switch (reason) {
            case 'COMPRA': return 'Compra';
            case 'VENTA': 
                if (ticket) {
                    if (ticketDeleted) {
                        return `Venta en ticket #${ticket} (Eliminado)`;
                    }
                    return `Venta en ticket #${ticket}`;
                }
                return 'Venta';
            case 'RETIRADA': return 'Retirada';
            case 'USO': 
                return report ? `Uso en reporte #${report}` : 'Uso';
            case 'DEVOLUCION': 
                if (report && reportDeleted) {
                    return `Devolución por eliminación de reporte #${report}`;
                }
                if (ticket && ticketCanceled) {
                    return `Devolución por cancelación de ticket #${ticket}`;
                }
                if (ticket && ticketDeleted) {
                    return `Devolución por eliminación de ticket #${ticket}`;
                }
                if (ticket) {
                    return `Devolución de producto en ticket #${ticket}`;
                }
                return 'Devolución';
            case 'TRASLADO': return 'Traslado';
            case 'CUADRE': return 'Cuadre de inventario';
            default: return reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase();
        }
    };

    if (!material) return null;

    return (
        <>
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="md" 
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"}>
                            Historial de {material.name}
                        </Typography>
                        <IconButton onClick={onClose} size={isMobile ? "small" : "medium"}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {isMobile ? (
                        // Vista de tarjetas para móvil
                        <Box sx={{ mt: 1 }}>
                            {history.map((record) => (
                                <Paper 
                                    key={record.id} 
                                    sx={{ p: 2, mb: 2, border: '1px solid #eee' }}
                                >
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Operación
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    size="small"
                                                    label={getOperationLabel(record.operation)}
                                                    color={getOperationColor(record.operation)}
                                                    icon={getOperationIcon(record.operation)}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Motivo
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    size="small"
                                                    label={getReasonLabel(
                                                        record.reason, 
                                                        record.report_id, 
                                                        record.report_deleted,
                                                        record.ticket_id,
                                                        record.ticket_canceled,
                                                        record.ticket_deleted,
                                                        record.contract_report_id,
                                                        record.contract_report_deleted
                                                    )}
                                                    color={getReasonColor(record.reason)}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Cantidad
                                            </Typography>
                                            <Typography variant="body2">
                                                {record.quantity}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Fecha
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(record.date).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        {record.invoice_image && (
                                            <Grid item xs={12} sx={{ mt: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<ReceiptOutlined />}
                                                    onClick={() => handleViewInvoice(record.invoice_image)}
                                                >
                                                    Ver albarán
                                                </Button>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        // Vista de tabla para tablets y desktop
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Usuario</TableCell>
                                        <TableCell>Operación</TableCell>
                                        <TableCell>Motivo</TableCell>
                                        <TableCell>Cantidad</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Albarán</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.user_name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getOperationLabel(record.operation)}
                                                    color={getOperationColor(record.operation)}
                                                    icon={getOperationIcon(record.operation)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getReasonLabel(
                                                        record.reason, 
                                                        record.report, 
                                                        record.report_deleted,
                                                        record.ticket,
                                                        record.ticket_canceled,
                                                        record.ticket_deleted // Añadido este nuevo parámetro
                                                    )}
                                                    color={getReasonColor(record.reason)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{record.quantity}</TableCell>
                                            <TableCell>
                                                {new Date(record.date).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {record.invoice_image ? (
                                                    <IconButton 
                                                        color="primary" 
                                                        size="small"
                                                        onClick={() => handleViewInvoice(record.invoice_image)}
                                                    >
                                                        <ReceiptOutlined />
                                                    </IconButton>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de imagen - hacer fullScreen en móvil */}
            <Dialog 
                open={openInvoice} 
                onClose={() => setOpenInvoice(false)} 
                maxWidth="md" 
                fullWidth
                fullScreen={isMobile}
            >
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
        </>
    );
};

export default MaterialHistory;