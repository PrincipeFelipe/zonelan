import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton
} from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

// Añadir el mapeo de estados después de los imports
const statusMap = {
    'DRAFT': 'Borrador',
    'COMPLETED': 'Completado',
};

const ReportDialog = ({ open, onClose, incident }) => {
    const [reports, setReports] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (incident) {
            fetchReports();
        }
    }, [incident]);

    const fetchReports = async () => {
        try {
            const response = await axios.get(`/reports/reports/?incident=${incident.id}`);
            console.log('Datos recibidos:', response.data);
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleViewReport = (reportId) => {
        onClose(); // Cerrar el diálogo actual
        navigate(`/dashboard/reports/${reportId}`); // Navegar al parte
    };

    const formatTechnicianName = (technician) => {
        if (!technician) return '';
        return technician.technician_name || 'Sin nombre';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Detalles de la Incidencia</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                {/* Detalles de la incidencia */}
                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        {incident.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                        Descripción: {incident.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Cliente: {incident.customer_name}
                    </Typography>
                </Box>

                {/* Tabla de partes */}
                <Typography variant="h6" gutterBottom>
                    Partes de Trabajo
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Técnicos</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Horas</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>{formatDate(report.date)}</TableCell>
                                        <TableCell>
                                            {report.technicians && report.technicians.length > 0 
                                                ? report.technicians.map(tech => tech.technician_name).join(', ') 
                                                : 'Sin asignar'
                                            }
                                        </TableCell>
                                        <TableCell>{statusMap[report.status] || report.status}</TableCell>
                                        <TableCell>{report.hours_worked}</TableCell>
                                        <TableCell>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleViewReport(report.id)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No hay partes asociados a esta incidencia
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

export default ReportDialog;