import React, { useState, useEffect } from 'react';
import { 
    Grid, Paper, Typography, Box, Card, CardContent,
    List, ListItem, ListItemText, ListItemIcon,
    Divider, CircularProgress
} from '@mui/material';
import { 
    Report as ReportIcon,
    Warning as WarningIcon,
    Inventory as InventoryIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';

const DashboardHome = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        incidents: { total: 0, pending: 0 },
        reports: { total: 0, draft: 0 },
        materials: { total: 0, lowStock: 0 },
        tickets: { total: 0, pending: 0 }
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Aquí podrías hacer llamadas a la API para obtener estadísticas
            // Ejemplo simplificado:
            const incidentsResponse = await axios.get('/incidents/counts/');
            const materialsResponse = await axios.get('/materials/stats/');
            
            // Actualizar con datos reales o simular por ahora
            setStats({
                incidents: {
                    total: incidentsResponse.data.total || 0,
                    pending: incidentsResponse.data.pending || 0
                },
                reports: {
                    total: 0, // Obtener de API cuando esté disponible
                    draft: 0
                },
                materials: {
                    total: materialsResponse.data.total || 0,
                    lowStock: materialsResponse.data.low_stock || 0
                },
                tickets: {
                    total: 0, // Obtener de API cuando esté disponible
                    pending: 0
                }
            });
            
        } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Panel de Control
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-5px)' } 
                        }}
                        onClick={() => handleNavigate('/dashboard/incidents')}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Incidencias</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Incidencias pendientes: <strong>{stats.incidents.pending}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total de incidencias: {stats.incidents.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-5px)' } 
                        }}
                        onClick={() => handleNavigate('/dashboard/reports')}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <ReportIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Partes</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Partes en borrador: <strong>{stats.reports.draft}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total de partes: {stats.reports.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-5px)' } 
                        }}
                        onClick={() => handleNavigate('/dashboard/materials')}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <InventoryIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Materiales</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Materiales con stock bajo: <strong>{stats.materials.lowStock}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total de materiales: {stats.materials.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                    <Card 
                        sx={{ 
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-5px)' } 
                        }}
                        onClick={() => handleNavigate('/dashboard/tickets')}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <ReceiptIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Tickets</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Tickets pendientes: <strong>{stats.tickets.pending}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total de tickets: {stats.tickets.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardHome;