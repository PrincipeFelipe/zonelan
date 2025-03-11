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
import { toast, Toaster } from 'react-hot-toast';

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
            
            // Peticiones para todas las estadísticas con manejo de errores
            const [incidentsData, materialsData, reportsData, ticketsData] = await Promise.allSettled([
              axios.get('/incidents/counts/').catch(err => {
                console.warn('Error al obtener estadísticas de incidencias:', err);
                return { data: { total: 0, pending: 0 } };
              }),
              axios.get('/materials/stats/').catch(err => {
                console.warn('Error al obtener estadísticas de materiales:', err);
                return { status: 'rejected' };
              }),
              axios.get('/reports/counts/').catch(err => {
                console.warn('Error al obtener estadísticas de reportes:', err);
                return { data: { total: 0, draft: 0 } };
              }),
              axios.get('/tickets/counts/').catch(err => {
                console.warn('Error al obtener estadísticas de tickets:', err);
                return { data: { total: 0, pending: 0 } };
              })
            ]);
            
            // Procesar estadísticas de incidentes
            const incidentsStats = incidentsData.status === 'fulfilled' 
              ? incidentsData.value.data 
              : { total: 0, pending: 0 };
              
            // Procesar estadísticas de materiales
            let materialsStats = { total: 0, lowStock: 0 };
            if (materialsData.status === 'fulfilled') {
              materialsStats = {
                total: materialsData.value.data.total || 0,
                lowStock: materialsData.value.data.lowStock || 0,
                recentOperations: materialsData.value.data.recentOperations || 0
              };
            } else {
              // Calcular manualmente si falló la API
              try {
                const materialsListResponse = await axios.get('/materials/materials/');
                const materials = materialsListResponse.data;
                materialsStats = {
                  total: materials.length,
                  lowStock: materials.filter(m => m.quantity <= (m.minimum_quantity || 0)).length,
                  recentOperations: 0 // No podemos calcular esto sin la API
                };
              } catch (materialListError) {
                console.error("Error obteniendo lista de materiales", materialListError);
              }
            }
            
            // Procesar estadísticas de reportes y tickets
            // CORRECCIÓN: Usar reportsData en lugar de reportsStats
            const reportsStats = reportsData.status === 'fulfilled' 
              ? reportsData.value.data 
              : { total: 0, draft: 0 };
              
            // CORRECCIÓN: Usar ticketsData en lugar de ticketsStats
            const ticketsStats = ticketsData.status === 'fulfilled' 
              ? ticketsData.value.data 
              : { total: 0, pending: 0 };
            
            // Actualizar estado
            setStats({
              incidents: incidentsStats,
              materials: materialsStats,
              reports: reportsStats,
              tickets: ticketsStats
            });
            
          } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
            toast.error('Error al cargar datos del dashboard');
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
            <Toaster position="top-right" /> {/* Añadir esta línea */}
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
                                Incidencias pendientes: <strong>
                                    {stats.incidents.active || 
                                     (stats.incidents.pending + (stats.incidents.in_progress || 0))}
                                </strong>
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
                            {stats.materials.recentOperations > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    Operaciones recientes: {stats.materials.recentOperations}
                                </Typography>
                            )}
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