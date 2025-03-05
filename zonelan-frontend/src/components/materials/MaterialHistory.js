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
    Button
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
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Fecha</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.user_name}</TableCell>
                                    <TableCell>
                                        {record.operation === 'ADD' ? 'Añadir' : 'Quitar'}
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