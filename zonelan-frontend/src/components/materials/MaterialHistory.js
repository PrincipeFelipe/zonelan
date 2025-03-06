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
} from '@mui/material';
import { ReceiptOutlined, Close } from '@mui/icons-material';
import axios, { getMediaUrl } from '../../utils/axiosConfig';

const MaterialHistory = ({ open, onClose, material }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openInvoice, setOpenInvoice] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);

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

    const getReasonLabel = (reason, report, reportDeleted) => {
        switch (reason) {
            case 'COMPRA': return 'Compra';
            case 'VENTA': return 'Venta';
            case 'RETIRADA': return 'Retirada';
            case 'USO': return report ? `Uso en reporte #${report}` : 'Uso';
            case 'DEVOLUCION': 
                if (report && reportDeleted) {
                    return `Devolución por eliminación de reporte #${report}`;
                }
                return 'Devolución';
            default: return reason;
        }
    };

    if (!material) return null;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Historial de {material.name}</DialogTitle>
                <DialogContent>
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
                                                label={record.operation === 'ADD' ? 'Entrada' : 'Salida'}
                                                color={getOperationColor(record.operation)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getReasonLabel(record.reason, record.report, record.report_deleted)}
                                                color={getReasonColor(record.reason)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{record.quantity}</TableCell>
                                        <TableCell>
                                            {new Date(record.date).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {record.invoice_url ? (
                                                <IconButton 
                                                    color="primary" 
                                                    size="small"
                                                    onClick={() => handleViewInvoice(record.invoice_url)}
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>

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
        </>
    );
};

export default MaterialHistory;