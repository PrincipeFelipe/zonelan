import React, { useState, useEffect } from 'react';
import { 
    Box, Paper, Typography, Button, Grid, 
    TextField, FormControlLabel, Switch, 
    FormControl, InputLabel, Select, MenuItem,
    Divider, CircularProgress, Alert
} from '@mui/material';
import format from 'date-fns/format';
import { es } from 'date-fns/locale/es';
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useContracts } from '../../hooks/useContracts';
import axios from '../../utils/axiosConfig';

const ContractForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { createContract, updateContract, fetchContract, loading: contractsLoading } = useContracts();

    const [loading, setLoading] = useState(isEditMode);
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        customer: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        status: 'ACTIVE',
        requires_maintenance: false,
        maintenance_frequency: '',
        next_maintenance_date: '',
        observations: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchCustomers();
        
        if (isEditMode) {
            fetchContractDetails();
        }
    }, [id]);

    const frequencyOptions = [
        { value: 'WEEKLY', label: 'Semanal' },
        { value: 'BIWEEKLY', label: 'Quincenal' },
        { value: 'MONTHLY', label: 'Mensual' },
        { value: 'QUARTERLY', label: 'Trimestral' },
        { value: 'SEMIANNUAL', label: 'Semestral' },
        { value: 'ANNUAL', label: 'Anual' }
    ];

    const fetchCustomers = async () => {
        try {
            // Ajusta esta URL según la estructura de tu API
            const response = await axios.get('/api/customers/');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            toast.error('Error al cargar los clientes');
        }
    };

    const fetchContractDetails = async () => {
        try {
            setLoading(true);
            const contract = await fetchContract(id);
            
            setFormData({
                title: contract.title || '',
                // Asegúrate de que customer sea solo el ID, no el objeto completo
                customer: contract.customer?.id || contract.customer || '',
                description: contract.description || '',
                start_date: contract.start_date || '',
                end_date: contract.end_date || '',
                status: contract.status || 'ACTIVE',
                requires_maintenance: contract.requires_maintenance || false,
                maintenance_frequency: contract.maintenance_frequency || '',
                next_maintenance_date: contract.next_maintenance_date || '',
                observations: contract.observations || ''
            });
        } catch (error) {
            console.error('Error al cargar datos del contrato:', error);
            toast.error('Error al cargar detalles del contrato');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Limpiar errores al editar
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }

        if (!formData.customer) {
            newErrors.customer = 'Debes seleccionar un cliente';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'La fecha de inicio es obligatoria';
        }

        if (formData.requires_maintenance && !formData.maintenance_frequency) {
            newErrors.maintenance_frequency = 'Debes seleccionar la frecuencia de mantenimiento';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Por favor corrige los errores antes de enviar');
            return;
        }

        try {
            // Asegúrate de que el customer sea un ID, no un objeto
            const dataToSubmit = {
                ...formData,
                customer: typeof formData.customer === 'object' ? formData.customer.id : formData.customer
            };

            if (isEditMode) {
                await updateContract(id, dataToSubmit);
                toast.success('Contrato actualizado correctamente');
                navigate(`/dashboard/contracts/${id}`);
            } else {
                const newContract = await createContract(dataToSubmit);
                toast.success('Contrato creado correctamente');
                navigate(`/dashboard/contracts/${newContract.id}`);
            }
        } catch (error) {
            console.error('Error al guardar el contrato:', error);
            // Manejo de errores mejorado
            if (error.response?.data) {
                const errorMessages = Object.entries(error.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('. ');
                toast.error(`Error: ${errorMessages}`);
            } else {
                toast.error('Error al guardar el contrato');
            }
        }
    };

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
                <Typography variant="h5">
                    {isEditMode ? 'Editar Contrato' : 'Nuevo Contrato'}
                </Typography>
                
                <Button 
                    variant="outlined"
                    onClick={() => navigate('/dashboard/contracts/list')}
                >
                    Volver
                </Button>
            </Box>
            
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                name="title"
                                label="Título del contrato"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={handleChange}
                                error={Boolean(errors.title)}
                                helperText={errors.title}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth error={Boolean(errors.customer)}>
                                <InputLabel>Cliente *</InputLabel>
                                <Select
                                    name="customer"
                                    value={formData.customer}
                                    label="Cliente *"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">Seleccionar cliente</MenuItem>
                                    {customers.map(customer => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.customer && (
                                    <Typography variant="caption" color="error">
                                        {errors.customer}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    label="Estado"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="ACTIVE">Activo</MenuItem>
                                    <MenuItem value="INACTIVE">Inactivo</MenuItem>
                                    <MenuItem value="EXPIRED">Vencido</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                name="start_date"
                                label="Fecha de inicio"
                                type="date"
                                fullWidth
                                required
                                value={formData.start_date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(errors.start_date)}
                                helperText={errors.start_date}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                name="end_date"
                                label="Fecha de finalización"
                                type="date"
                                fullWidth
                                value={formData.end_date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Descripción del contrato"
                                multiline
                                rows={4}
                                fullWidth
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.requires_maintenance}
                                        onChange={handleChange}
                                        name="requires_maintenance"
                                    />
                                }
                                label="Requiere mantenimiento periódico"
                            />
                        </Grid>
                        
                        {formData.requires_maintenance && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                        Configuración de mantenimiento
                                    </Typography>
                                    <Divider />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={Boolean(errors.maintenance_frequency)}>
                                        <InputLabel>Frecuencia de mantenimiento</InputLabel>
                                        <Select
                                            name="maintenance_frequency"
                                            value={formData.maintenance_frequency}
                                            label="Frecuencia de mantenimiento"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="">Seleccionar frecuencia</MenuItem>
                                            {frequencyOptions.map(option => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.maintenance_frequency && (
                                            <Typography variant="caption" color="error">
                                                {errors.maintenance_frequency}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        name="next_maintenance_date"
                                        label="Próxima fecha de mantenimiento"
                                        type="date"
                                        fullWidth
                                        value={formData.next_maintenance_date}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Si no se especifica, se calculará automáticamente"
                                    />
                                </Grid>
                            </>
                        )}
                        
                        <Grid item xs={12}>
                            <TextField
                                name="observations"
                                label="Observaciones"
                                multiline
                                rows={4}
                                fullWidth
                                value={formData.observations}
                                onChange={handleChange}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate('/dashboard/contracts/list')}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    disabled={contractsLoading}
                                >
                                    {contractsLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default ContractForm;