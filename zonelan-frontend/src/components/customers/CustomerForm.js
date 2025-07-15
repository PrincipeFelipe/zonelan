import React, { useState, useEffect } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, Grid, 
    CircularProgress, FormControl, InputLabel, MenuItem,
    Select, Divider, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';

const CustomerForm = ({ view = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customer, setCustomer] = useState({
        name: '',
        business_name: '',
        nif: '',
        address: '',
        city: '',
        postal_code: '',
        province: '',
        country: 'España',
        phone: '',
        email: '',
        contact_person: '',
        notes: ''
    });

    const isEditing = !!id;
    const isViewing = view && isEditing;
    const pageTitle = isViewing ? 'Detalles del Cliente' : 
                     isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente';

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (id) {
            fetchCustomer();
        }
    }, [id]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/customers/${id}/`);
            setCustomer(response.data);
            setError(null);
        } catch (err) {
            console.error('Error al cargar cliente:', err);
            setError('Error al cargar la información del cliente. Por favor, inténtalo de nuevo.');
            toast.error('Error al cargar la información del cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomer(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);
            if (isEditing) {
                await axios.put(`/customers/${id}/`, customer);
                toast.success('Cliente actualizado correctamente');
            } else {
                await axios.post('/customers/', customer);
                toast.success('Cliente creado correctamente');
            }
            navigate('/dashboard/customers');
        } catch (err) {
            console.error('Error al guardar cliente:', err);
            setError('Error al guardar la información del cliente. Por favor, inténtalo de nuevo.');
            toast.error('Error al guardar la información del cliente');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!customer.name) {
            toast.error('El nombre es obligatorio');
            return false;
        }
        return true;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                    {pageTitle}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={{ xs: 2, md: 3 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="name"
                                value={customer.name}
                                onChange={handleInputChange}
                                disabled={isViewing}
                                required
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre Comercial"
                                name="business_name"
                                value={customer.business_name}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="NIF/CIF"
                                name="nif"
                                value={customer.nif}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={customer.email}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                name="phone"
                                value={customer.phone}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Persona de contacto"
                                name="contact_person"
                                value={customer.contact_person}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>
                                Dirección
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dirección"
                                name="address"
                                value={customer.address}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Código Postal"
                                name="postal_code"
                                value={customer.postal_code}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Ciudad"
                                name="city"
                                value={customer.city}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Provincia"
                                name="province"
                                value={customer.province}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notas adicionales"
                                name="notes"
                                multiline
                                rows={4}
                                value={customer.notes}
                                onChange={handleInputChange}
                                disabled={isViewing}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                gap: 2,
                                mt: 2,
                                flexDirection: isMobile ? 'column' : 'row',
                                '& .MuiButton-root': {
                                    width: isMobile ? '100%' : 'auto'
                                }
                            }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate('/dashboard/customers')}
                                >
                                    {isViewing ? 'Volver' : 'Cancelar'}
                                </Button>
                                {!isViewing && (
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        disabled={loading}
                                    >
                                        {isEditing ? 'Actualizar' : 'Crear'}
                                        {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                                    </Button>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default CustomerForm;