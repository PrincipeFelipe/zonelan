import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Paper, CircularProgress, 
    Button, Card, CardContent, CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../../hooks/useContracts';
import { Toaster, toast } from 'react-hot-toast';
import { Add, Assignment, Warning, EventBusy } from '@mui/icons-material';

const ContractDashboard = () => {
    const navigate = useNavigate();
    const { fetchDashboardData, loading } = useContracts();
    const [dashboardData, setDashboardData] = useState({
        total_contracts: 0,
        active_contracts: 0,
        pending_maintenance: 0,
        expiring_soon: 0,
        contracts_by_customer: []
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const data = await fetchDashboardData();
                setDashboardData(data || {
                    total_contracts: 0,
                    active_contracts: 0,
                    pending_maintenance: 0,
                    expiring_soon: 0,
                    contracts_by_customer: []
                });
            } catch (error) {
                console.error('Error al cargar datos del dashboard:', error);
                toast.error('Error al cargar datos del dashboard');
                
                // Establecer valores predeterminados en caso de error
                setDashboardData({
                    total_contracts: 0,
                    active_contracts: 0,
                    pending_maintenance: 0,
                    expiring_soon: 0,
                    contracts_by_customer: []
                });
            }
        };
        
        loadDashboardData();
    }, []); // Quitar fetchDashboardData de las dependencias
    
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: 2 }}>
            <Toaster position="top-right" />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Dashboard de Contratos</Typography>
                <Button 
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/contracts/new')}
                >
                    Nuevo Contrato
                </Button>
            </Box>
            
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h3" color="primary">
                            {dashboardData.total_contracts}
                        </Typography>
                        <Typography variant="body1">
                            Total de contratos
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h3" color="success.main">
                            {dashboardData.active_contracts}
                        </Typography>
                        <Typography variant="body1">
                            Contratos activos
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            textAlign: 'center', 
                            height: '100%',
                            bgcolor: dashboardData.pending_maintenance > 0 ? 'warning.light' : 'inherit'
                        }}
                    >
                        <Typography variant="h3" color={dashboardData.pending_maintenance > 0 ? 'warning.dark' : 'text.primary'}>
                            {dashboardData.pending_maintenance}
                        </Typography>
                        <Typography variant="body1">
                            Mantenimientos pendientes
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            height: '100%',
                            bgcolor: dashboardData.expiring_soon > 0 ? 'error.light' : 'inherit'
                        }}
                    >
                        <Typography variant="h3" color={dashboardData.expiring_soon > 0 ? 'error.dark' : 'text.primary'}>
                            {dashboardData.expiring_soon}
                        </Typography>
                        <Typography variant="body1">
                            Próximos a vencer
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>Acciones Rápidas</Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Assignment sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Ver todos los contratos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Acceda a la lista completa de contratos y su gestión
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                size="small" 
                                onClick={() => navigate('/dashboard/contracts/list')}
                            >
                                Ver Lista
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Mantenimientos Pendientes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Contratos que requieren mantenimiento programado
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                size="small" 
                                onClick={() => navigate('/dashboard/contracts/list?pending_maintenance=true')}
                            >
                                Ver Pendientes
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <EventBusy sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Contratos a Vencer
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Contratos próximos a finalizar en los siguientes 30 días
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button 
                                size="small" 
                                onClick={() => navigate('/dashboard/contracts/list?expiring_soon=true')}
                            >
                                Ver Próximos a Vencer
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ContractDashboard;