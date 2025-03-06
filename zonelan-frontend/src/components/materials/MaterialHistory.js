import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    DialogActions,
    Button,
    Chip
} from '@mui/material';
import axios from '../../utils/axiosConfig';

const MaterialHistory = ({ open, onClose, material }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (material) {
            fetchHistory();
        }
    }, [material]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/materials/control/');
            const filteredHistory = response.data.filter(h => h.material === material.id);
            setHistory(filteredHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
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
    );
};

export default MaterialHistory;