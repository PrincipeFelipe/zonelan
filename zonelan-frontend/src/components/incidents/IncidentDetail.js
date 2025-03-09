import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Paper, Button, Chip, Grid, Divider, IconButton, 
    CircularProgress, Card, CardContent 
} from '@mui/material';
import { KeyboardBackspace, Print, Edit } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReportDialog from '../reports/ReportDialog';

const IncidentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openReportDialog, setOpenReportDialog] = useState(false);

    useEffect(() => {
        fetchIncident();
    }, [id]);

    const fetchIncident = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/incidents/incidents/${id}/`);
            setIncident(response.data);
        } catch (error) {
            console.error('Error al cargar la incidencia:', error);
            toast.error('Error al cargar los datos de la incidencia');
            navigate('/dashboard/incidents');
        } finally {
            setLoading(false);
        }
    };

    const handleViewReports = () => {
        setOpenReportDialog(true);
    };

    const handleEditIncident = () => {
        // Redirigir a la página de edición o abrir un diálogo para editar
        navigate(`/dashboard/incidents?edit=${id}`);
    };

    const getStatusChip = (status) => {
        let label = '';
        let color = '';
        
        switch (status) {
            case 'PENDING':
                label = 'Pendiente';
                color = 'warning';
                break;
            case 'IN_PROGRESS':
                label = 'En Progreso';
                color = 'info';
                break;
            case 'RESOLVED':
                label = 'Resuelta';
                color = 'success';
                break;
            case 'CLOSED':
                label = 'Cerrada';
                color = 'default';
                break;
            default:
                label = status;
                color = 'default';
        }
        
        return <Chip size="small" label={label} color={color} />;
    };

    const getPriorityChip = (priority) => {
        let label = '';
        let color = '';
        
        switch (priority) {
            case 'LOW':
                label = 'Baja';
                color = 'success';
                break;
            case 'MEDIUM':
                label = 'Media';
                color = 'info';
                break;
            case 'HIGH':
                label = 'Alta';
                color = 'warning';
                break;
            case 'CRITICAL':
                label = 'Crítica';
                color = 'error';
                break;
            default:
                label = priority;
                color = 'default';
        }
        
        return <Chip size="small" label={label} color={color} />;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!incident) {
        return (
            <Box p={3}>
                <Typography variant="h6">No se encontró la incidencia solicitada</Typography>
                <Button 
                    startIcon={<KeyboardBackspace />} 
                    onClick={() => navigate('/dashboard/incidents')} 
                    sx={{ mt: 2 }}
                >
                    Volver al listado
                </Button>
            </Box>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <Box p={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center">
                        <IconButton onClick={() => navigate('/dashboard/incidents')} sx={{ mr: 1 }}>
                            <KeyboardBackspace />
                        </IconButton>
                        <Typography variant="h5">
                            Incidencia #{incident.id}: {incident.title}
                        </Typography>
                    </Box>
                    <Box>
                        <Button 
                            startIcon={<Edit />}
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={handleEditIncident}
                        >
                            Editar
                        </Button>
                        <Button 
                            startIcon={<Print />}
                            variant="contained"
                            onClick={() => navigate(`/dashboard/incidents?print=${id}`)}
                        >
                            Imprimir
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Detalles</Typography>
                                <Box display="flex" gap={1}>
                                    {getStatusChip(incident.status)}
                                    {getPriorityChip(incident.priority)}
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Cliente</Typography>
                                    <Typography variant="body1" gutterBottom>{incident.customer_name}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Fecha de creación</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {format(new Date(incident.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Reportada por</Typography>
                                    <Typography variant="body1" gutterBottom>{incident.reported_by_name || 'No especificado'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Última actualización</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {format(new Date(incident.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </Typography>
                                </Grid>
                            </Grid>
                            
                            <Box mt={2}>
                                <Typography variant="subtitle2">Descripción</Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body1">{incident.description}</Typography>
                                </Paper>
                            </Box>
                            
                            {incident.resolution_notes && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">Notas de resolución</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                        <Typography variant="body1">{incident.resolution_notes}</Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Partes de trabajo</Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={handleViewReports}
                                >
                                    Ver todos
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Box mt={2} display="flex" justifyContent="center">
                                <Button 
                                    variant="contained" 
                                    onClick={() => navigate(`/dashboard/reports/new?incident=${incident.id}`)}
                                >
                                    Crear nuevo parte
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {incident && (
                <ReportDialog
                    open={openReportDialog}
                    onClose={() => setOpenReportDialog(false)}
                    incident={incident}
                    onReportSelect={(reportId) => navigate(`/dashboard/reports/${reportId}`)}
                />
            )}
        </>
    );
};

export default IncidentDetail;