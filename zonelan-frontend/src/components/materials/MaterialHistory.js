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

    const getReasonLabel = (reason) => {
        switch (reason) {
            case 'COMPRA': return 'Compra';
            case 'VENTA': return 'Venta';
            case 'RETIRADA': return 'Retirada';
            case 'USO': return 'Uso en reporte';
            case 'DEVOLUCION': return 'Devolución';
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
                                            label={getReasonLabel(record.reason)}
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