import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, Paper,
    Grid, FormControlLabel, Switch, CircularProgress,
    Alert
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from '../../../utils/axiosConfig';
import StorageNavigation from '../common/StorageNavigation';

const WarehouseForm = () => {
    const { warehouseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!warehouseId);
    const [error, setError] = useState(null);
    const [warehouse, setWarehouse] = useState({
        name: '',
        location: '',
        description: '',
        is_active: true
    });
    
    const isEditing = !!warehouseId;

    useEffect(() => {
        if (warehouseId) {
            fetchWarehouse();
        } else {
            setInitialLoading(false);
        }
    }, [warehouseId]);

    const fetchWarehouse = async () => {
        try {
            setInitialLoading(true);
            const response = await axios.get(`/storage/warehouses/${warehouseId}/`);
            setWarehouse(response.data);
        } catch (error) {
            console.error('Error fetching warehouse:', error);
            setError('Error al cargar los datos del almacén. Inténtalo de nuevo.');
            toast.error('Error al cargar los datos del almacén');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        const newValue = name === 'is_active' ? checked : value;
        
        setWarehouse({
            ...warehouse,
            [name]: newValue
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                await axios.put(`/storage/warehouses/${warehouseId}/`, warehouse);
                toast.success('Almacén actualizado correctamente');
            } else {
                await axios.post('/storage/warehouses/', warehouse);
                toast.success('Almacén creado correctamente');
            }
            navigate('/dashboard/storage/warehouses');
        } catch (error) {
            console.error('Error saving warehouse:', error);
            setError('Error al guardar los datos del almacén. Verifica los campos e inténtalo de nuevo.');
            toast.error('Error al guardar los datos del almacén');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Toaster position="top-right" />
            
            <StorageNavigation 
                currentLevel={2} 
                warehouseName={isEditing ? warehouse.name : null}
                warehouseId={warehouseId}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    {isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Almacén"
                                name="name"
                                value={warehouse.name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Ubicación"
                                name="location"
                                value={warehouse.location || ''}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Ej: Calle Principal 123, Madrid"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="description"
                                value={warehouse.description || ''}
                                onChange={handleInputChange}
                                multiline
                                rows={4}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={warehouse.is_active}
                                        onChange={handleInputChange}
                                        name="is_active"
                                        disabled={loading}
                                    />
                                }
                                label="Activo"
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate('/dashboard/storage/warehouses')}
                                disabled={loading}
                            >
                                Volver
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default WarehouseForm;