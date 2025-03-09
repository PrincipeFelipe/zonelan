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
    IconButton,
    Chip
} from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de estados mejorado para incluir los colores
const statusMap = {
    'DRAFT': { label: 'Borrador', color: 'warning' },
    'COMPLETED': { label: 'Completado', color: 'success' },
};

const ReportDialog = ({ open, onClose, incident, onReportSelect }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (incident && open) {
            fetchReports();
        }
    }, [incident, open]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/reports/reports/?incident=${incident.id}`);
            setReports(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        
        try {
            return format(parseISO(dateString), 'dd MMMM yyyy', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    const handleViewReport = (reportId) => {
        if (onReportSelect) {
            onReportSelect(reportId);
        } else {
            onClose(); // Cerrar el diálogo actual
            navigate(`/dashboard/reports/${reportId}`); // Navegar al parte
        }
    };

    const formatTechnicians = (technicians) => {
        if (!technicians || !technicians.length) return 'Sin asignar';
        
        // Si hay más de 2 técnicos, mostrar los 2 primeros y un contador
        if (technicians.length > 2) {
            return (
                <>
                    {technicians.slice(0, 2).map(tech => tech.technician_name).join(', ')}
                    <Chip 
                        size="small" 
                        label={`+${technicians.length - 2}`} 
                        sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                    />
                </>
            );
        }
        
        return technicians.map(tech => tech.technician_name).join(', ');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                        Partes de trabajo - Incidencia #{incident?.id}
                    </Typography>
                    <IconButton onClick={onClose} size="small" edge="end">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {/* Detalles de la incidencia */}
                <Box mb={3} p={2} bgcolor="rgba(0, 0, 0, 0.04)" borderRadius={1}>
                    <Typography variant="h6" gutterBottom>
                        {incident?.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Descripción:</strong> {incident?.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Cliente:</strong> {incident?.customer_name}
                    </Typography>
                </Box>

                {/* Tabla de partes */}
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                    Listado de partes ({reports.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                            <TableRow>
                                <TableCell width="5%">#</TableCell>
                                <TableCell width="15%">Fecha</TableCell>
                                <TableCell width="30%">Técnicos</TableCell>
                                <TableCell width="15%">Estado</TableCell>
                                <TableCell width="15%">Horas</TableCell>
                                <TableCell width="10%">Materiales</TableCell>
                                <TableCell width="10%" align="center">Ver</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : reports.length > 0 ? (
                                reports.map((report) => (
                                    <TableRow key={report.id} hover>
                                        <TableCell>{report.id}</TableCell>
                                        <TableCell>{formatDate(report.date)}</TableCell>
                                        <TableCell>{formatTechnicians(report.technicians)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                size="small" 
                                                label={statusMap[report.status]?.label || report.status} 
                                                color={statusMap[report.status]?.color || 'default'} 
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {report.hours_worked ? (
                                                <Typography variant="body2">
                                                    {report.hours_worked}h
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No especificado
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {report.materials_used?.length ? (
                                                <Chip 
                                                    size="small" 
                                                    label={report.materials_used.length} 
                                                    color="info" 
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    -
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton 
                                                size="small"
                                                color="primary"
                                                onClick={() => handleViewReport(report.id)}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No hay partes de trabajo registrados para esta incidencia
                                        </Typography>
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