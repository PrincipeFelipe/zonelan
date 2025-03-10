import React, { useState, useEffect } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, Grid, 
    CircularProgress, FormControl, InputLabel, MenuItem,
    Select, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';

// Constantes para opciones de select
const STATUS_CHOICES = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'RESOLVED', label: 'Resuelta' },
    { value: 'CLOSED', label: 'Cerrada' }
];

const PRIORITY_CHOICES = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'CRITICAL', label: 'Crítica' }
];

const IncidentForm = ({ view = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [incident, setIncident] = useState({
        title: '',
        description: '',
        customer: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        resolution_notes: ''
    });

    const isEditing = !!id;
    const isViewing = view && isEditing;
    const pageTitle = isViewing ? 'Detalles de Incidencia' : 
                     isEditing ? 'Editar Incidencia' : 'Crear Nueva Incidencia';

    useEffect(() => {
        fetchCustomers();
        if (id) {
            fetchIncident();
        }
    }, [id]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/customers/');
            setCustomers(response.data);
        } catch (err) {
            console.error('Error al cargar clientes:', err);
            toast.error('Error al cargar la lista de clientes');
        }
    };

    const fetchIncident = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/incidents/${id}/`);
            setIncident(response.data);
            setError(null);
        } catch (err) {
            console.error('Error al cargar incidencia:', err);
            setError('Error al cargar la información de la incidencia. Por favor, inténtalo de nuevo.');
            toast.error('Error al cargar la información de la incidencia');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setIncident(prev => ({
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
                await axios.put(`/incidents/${id}/`, incident);
                toast.success('Incidencia actualizada correctamente');
            } else {
                await axios.post('/incidents/', incident);
                toast.success('Incidencia creada correctamente');
            }
            navigate('/dashboard/incidents');
        } catch (err) {
            console.error('Error al guardar incidencia:', err);
            setError('Error al guardar la información de la incidencia. Por favor, inténtalo de nuevo.');
            toast.error('Error al guardar la información de la incidencia');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!incident.title) {
            toast.error('El título es obligatorio');
            return false;
        }
        if (!incident.customer) {
            toast.error('Debe seleccionar un cliente');
            return false;
        }
        return true;
    };

    if (loading && !isEditing) {
        return (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                    {pageTitle}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Título"
                                name="title"
                                value={incident.title}
                                onChange={handleInputChange}
                                disabled={isViewing || loading}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="description"
                                multiline
                                rows={4}
                                value={incident.description}
                                onChange={handleInputChange}
                                disabled={isViewing || loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Cliente</InputLabel>
                                <Select
                                    name="customer"
                                    value={incident.customer}
                                    onChange={handleInputChange}
                                    label="Cliente"
                                    disabled={isViewing || loading}
                                    required
                                >
                                    {customers.map((customer) => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="status"
                                    value={incident.status}
                                    onChange={handleInputChange}
                                    label="Estado"
                                    disabled={isViewing || loading}
                                >
                                    {STATUS_CHOICES.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Prioridad</InputLabel>
                                <Select
                                    name="priority"
                                    value={incident.priority}
                                    onChange={handleInputChange}
                                    label="Prioridad"
                                    disabled={isViewing || loading}
                                >
                                    {PRIORITY_CHOICES.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {isEditing && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notas de resolución"
                                    name="resolution_notes"
                                    multiline
                                    rows={4}
                                    value={incident.resolution_notes || ''}
                                    onChange={handleInputChange}
                                    disabled={isViewing || loading}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate('/dashboard/incidents')}
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

export default IncidentForm;