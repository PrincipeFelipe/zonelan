import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, CardActionArea,
    Paper, CircularProgress
} from '@mui/material';
import { 
    Warehouse as WarehouseIcon,
    Apartment as DepartmentIcon,
    ViewModule as ShelfIcon,
    ViewStream as TrayIcon,
    Inventory as MaterialIcon,
    SwapHoriz as MovementIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axiosConfig';
import { Toaster, toast } from 'react-hot-toast';
import StorageNavigation from '../common/StorageNavigation';

const StorageDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        warehouses: 0,
        departments: 0,
        shelves: 0,
        trays: 0,
        locations: 0,
        lowStock: 0,
        movements: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchStorageStats();
    }, []);

    const fetchStorageStats = async () => {
        try {
            setLoading(true);
            
            // Usar Promise.allSettled en lugar de Promise.all para manejar fallos individuales
            const results = await Promise.allSettled([
                axios.get('/storage/warehouses/'),
                axios.get('/storage/departments/'),
                axios.get('/storage/shelves/'),
                axios.get('/storage/trays/'),
                axios.get('/storage/locations/'),
                axios.get('/storage/locations/low_stock/'),
                axios.get('/storage/movements/')
            ]);
            
            // Función para extraer datos de forma segura
            const extractData = (result, index) => {
                if (result.status === 'fulfilled') {
                    const data = result.value.data;
                    return Array.isArray(data) ? data.length : (data.count || 0);
                } else {
                    console.error(`Error en la petición ${index}:`, result.reason);
                    return 0;
                }
            };
            
            setStats({
                warehouses: extractData(results[0], 'warehouses'),
                departments: extractData(results[1], 'departments'),
                shelves: extractData(results[2], 'shelves'),
                trays: extractData(results[3], 'trays'),
                locations: extractData(results[4], 'locations'),
                lowStock: extractData(results[5], 'lowStock'),
                movements: extractData(results[6], 'movements')
            });
        } catch (error) {
            console.error('Error fetching storage stats:', error);
            toast.error('Error al cargar estadísticas de almacenamiento');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (path) => {
        console.log('Navegando a:', path);
        navigate(path); // Navegar a la ruta especificada
    };

    const dashboardItems = [
        { 
            title: 'Almacenes', 
            icon: <WarehouseIcon sx={{ fontSize: 40 }} color="primary" />, 
            count: stats.warehouses,
            path: '/dashboard/storage/warehouses', // Esta ruta está bien
            description: 'Gestión de almacenes físicos'
        },
        { 
            title: 'Dependencias', 
            icon: <DepartmentIcon sx={{ fontSize: 40 }} color="secondary" />, 
            count: stats.departments,
            path: '/dashboard/storage/departments', // Esta ruta está bien
            description: 'Áreas dentro de almacenes'
        },
        { 
            title: 'Estanterías', 
            icon: <ShelfIcon sx={{ fontSize: 40 }} color="success" />, 
            count: stats.shelves,
            path: '/dashboard/storage/shelves', // Esta ruta está bien
            description: 'Estanterías de almacenamiento'
        },
        { 
            title: 'Baldas', 
            icon: <TrayIcon sx={{ fontSize: 40 }} color="info" />, 
            count: stats.trays,
            path: '/dashboard/storage/trays', // Esta ruta está bien
            description: 'Subdivisiones de estanterías'
        },
        { 
            title: 'Ubicaciones', 
            icon: <MaterialIcon sx={{ fontSize: 40 }} color="warning" />, 
            count: stats.locations,
            path: '/dashboard/storage/locations', // Esta ruta está bien
            description: 'Ubicaciones de materiales'
        },
        { 
            title: 'Stock Bajo', 
            icon: <WarningIcon sx={{ fontSize: 40 }} color="error" />, 
            count: stats.lowStock,
            path: '/dashboard/storage/locations?lowStock=true', // Cambiar a una ruta válida para stock bajo
            // Debes usar: path: '/dashboard/storage/locations?lowStock=true',
            // o crear una ruta específica si existe en tu sistema 
            description: 'Materiales con stock bajo'
        },
        { 
            title: 'Movimientos', 
            icon: <MovementIcon sx={{ fontSize: 40 }} color="action" />, 
            count: stats.movements,
            path: '/dashboard/storage/movements', // Esta ruta está bien
            description: 'Historial de movimientos'
        }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Toaster position="top-right" />
            
            <StorageNavigation currentLevel={1} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Gestión de Almacenamiento
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {dashboardItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.title}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { 
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => handleCardClick(item.path)}
                        >
                            <CardActionArea 
                                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                            >
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ mb: 2 }}>
                                        {item.icon}
                                    </Box>
                                    <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 500 }}>
                                        {item.count}
                                    </Typography>
                                    <Typography variant="h6" component="div" gutterBottom>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        {item.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default StorageDashboard;