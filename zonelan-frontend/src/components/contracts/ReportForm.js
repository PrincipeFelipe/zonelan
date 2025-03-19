import React, { useState, useEffect } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, Grid,
    FormControl, InputLabel, Select, MenuItem, Switch,
    FormControlLabel, Divider, CircularProgress, Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, Save } from '@mui/icons-material';
import format from 'date-fns/format';
import es from 'date-fns/locale/es';
import { useContracts } from '../../hooks/useContracts';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const ReportForm = () => {
    const { id, reportId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = Boolean(reportId);
    
    const { 
        contract, 
        contractsLoading, 
        reportLoading,
        fetchContract,
        fetchContractReport,
        createContractReport,
        updateContractReport
    } = useContracts();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours_worked: '',
        performed_by: user?.id || '',
        contract: id,
        is_completed: false,
        observations: ''
    });
    
    const [errors, setErrors] = useState({});
    
    useEffect(() => {
        loadData();
    }, [id, reportId]);
    
    const loadData = async () => {
        try {
            await fetchContract(id);
            
            if (isEditMode) {
                const reportData = await fetchContractReport(reportId);
                if (reportData) {
                    setFormData({
                        title: reportData.title || '',
                        description: reportData.description || '',
                        date: reportData.date ? format(new Date(reportData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                        hours_worked: reportData.hours_worked || '',
                        performed_by: reportData.performed_by || user?.id || '',
                        contract: reportData.contract || id,
                        is_completed: reportData.is_completed || false,
                        observations: reportData.observations || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar la información');
        }
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        
        // Limpiar error cuando se edita el campo
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }
        
        if (!formData.date) {
            newErrors.date = 'La fecha es obligatoria';
        }
        
        if (formData.is_completed) {
            if (!formData.hours_worked || formData.hours_worked <= 0) {
                newErrors.hours_worked = 'Debe especificar las horas trabajadas';
            }
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es obligatoria';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, corrija los errores del formulario');
            return;
        }
        
        try {
            if (isEditMode) {
                await updateContractReport(reportId, formData);
                toast.success('Reporte actualizado correctamente');
            } else {
                await createContractReport(formData);
                toast.success('Reporte creado correctamente');
            }
            navigate(`/dashboard/contracts/${id}/reports`);
        } catch (error) {
            console.error('Error al guardar el reporte:', error);
            const errorMessage = error.response?.data?.detail || 'Error al guardar el reporte';
            toast.error(errorMessage);
        }
    };
    
    if (contractsLoading || reportLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-right" />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate(`/dashboard/contracts/${id}/reports`)}
                        sx={{ mr: 2 }}
                    >
                        Volver
                    </Button>
                    <Typography variant="h6">
                        {isEditMode ? 'Editar Reporte' : 'Nuevo Reporte'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                >
                    Guardar
                </Button>
            </Box>
            
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Título del reporte"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={handleChange}
                                error={Boolean(errors.title)}
                                helperText={errors.title}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="date"
                                label="Fecha"
                                type="date"
                                fullWidth
                                required
                                value={formData.date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(errors.date)}
                                helperText={errors.date}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="hours_worked"
                                label="Horas trabajadas"
                                type="number"
                                fullWidth
                                value={formData.hours_worked}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                                error={Boolean(errors.hours_worked)}
                                helperText={errors.hours_worked}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Descripción del trabajo"
                                multiline
                                rows={4}
                                fullWidth
                                required
                                value={formData.description}
                                onChange={handleChange}
                                error={Boolean(errors.description)}
                                helperText={errors.description}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                name="observations"
                                label="Observaciones"
                                multiline
                                rows={3}
                                fullWidth
                                value={formData.observations}
                                onChange={handleChange}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_completed}
                                        onChange={handleChange}
                                        name="is_completed"
                                    />
                                }
                                label="Trabajo completado"
                            />
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default ReportForm;