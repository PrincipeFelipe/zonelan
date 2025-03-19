import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useContracts } from '../../hooks/useContracts';
import axios from '../../utils/axiosConfig';
// Corregir la ruta de importación del contexto de autenticación
import { useAuth } from '../../hooks/useAuth';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Grid, Box, CircularProgress
} from '@mui/material';

// Añadir record a las props del componente
const MaintenanceForm = ({ open, onClose, contractId, record = null, onFormSubmit }) => {
    const { user } = useAuth(); // Obtener el usuario actual de la sesión
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para input type="date"
        maintenance_type: '',
        technician: '', // Este campo será reemplazado por el selector de usuarios
        status: 'PENDING',
        observations: '',
        contract: contractId,
        performed_by: user?.id || '' // Inicializar con el ID del usuario actual
    });

    const { createMaintenanceRecord, updateMaintenanceRecord } = useContracts();
    
    const isEditMode = !!record;

    // Añadir esta función después de las declaraciones de estado:
    const getDisplayName = (user) => {
        if (!user) return "";
        
        // Si tiene nombre completo, usar ese
        if (user.name && user.name.trim()) {
            return user.name;
        }
        
        // Si tiene first_name, usar ese
        if (user.first_name && user.first_name.trim()) {
            return user.first_name;
        }
        
        // Si no tiene ninguno de los anteriores, usar el nombre de usuario
        return user.username;
    };

    // Cargar la lista de usuarios
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const response = await axios.get('/users/');
                setUsers(response.data);
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
                toast.error('No se pudieron cargar los usuarios');
            } finally {
                setLoadingUsers(false);
            }
        };
        
        fetchUsers();
    }, []);

    useEffect(() => {
        if (record) {
            setFormData({
                // Asegúrate de formatear la fecha correctamente
                date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                maintenance_type: record.maintenance_type || '',
                technician: record.technician || '', // Mantener esto como string para compatibilidad
                status: record.status || 'PENDING',
                observations: record.observations || '',
                contract: record.contract || contractId,
                performed_by: record.performed_by || user?.id || ''
            });
        } else {
            // Reiniciar el formulario si no hay registro para editar
            setFormData({
                date: new Date().toISOString().split('T')[0],
                maintenance_type: '',
                technician: '',
                status: 'PENDING',
                observations: '',
                contract: contractId,
                performed_by: user?.id || '' // Usuario de la sesión actual
            });
        }
    }, [record, contractId, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Preparar datos para enviar
            const dataToSubmit = {
                ...formData,
                // Asegurarse de que contract sea un ID y no un objeto
                contract: typeof formData.contract === 'object' 
                    ? formData.contract.id 
                    : formData.contract,
                // El campo technician ahora es un ID de usuario, no un string
                performed_by: user?.id || formData.performed_by
            };
            
            if (isEditMode) {
                await updateMaintenanceRecord(record.id, dataToSubmit);
                toast.success('Registro actualizado correctamente');
            } else {
                await createMaintenanceRecord(dataToSubmit);
                toast.success('Registro creado correctamente');
            }
            
            // Llamar a onFormSubmit si existe
            if (typeof onFormSubmit === 'function') {
                onFormSubmit(formData);
            }
            
            // Cerrar el formulario y refrescar la lista
            handleClose(true);
        } catch (error) {
            console.error('Error al guardar registro:', error);
            toast.error('Error al guardar el registro de mantenimiento');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClose = (refresh = false) => {
        // Llamar al callback onClose del padre con el parámetro de refresco
        if (typeof onClose === 'function') {
            onClose(refresh);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => handleClose(false)}
            maxWidth="md"
            fullWidth
        >
            <form onSubmit={handleSubmit} noValidate>
                <DialogTitle>
                    {isEditMode ? 'Editar Registro de Mantenimiento' : 'Nuevo Registro de Mantenimiento'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    name="date"
                                    label="Fecha de Mantenimiento"
                                    type="date"
                                    fullWidth
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Tipo de Mantenimiento</InputLabel>
                                    <Select
                                        name="maintenance_type"
                                        value={formData.maintenance_type}
                                        onChange={handleChange}
                                        label="Tipo de Mantenimiento"
                                    >
                                        <MenuItem value="PREVENTIVE">Preventivo</MenuItem>
                                        <MenuItem value="CORRECTIVE">Correctivo</MenuItem>
                                        <MenuItem value="EMERGENCY">Emergencia</MenuItem>
                                        <MenuItem value="INSPECTION">Inspección</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            {/* Campo para seleccionar el técnico (usando el selector de usuarios) */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Técnico</InputLabel>
                                    <Select
                                        name="technician"
                                        value={formData.technician}
                                        onChange={handleChange}
                                        label="Técnico"
                                        disabled={loadingUsers}
                                    >
                                        <MenuItem value="">Seleccionar técnico</MenuItem>
                                        {users.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                {getDisplayName(user)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        label="Estado"
                                    >
                                        <MenuItem value="PENDING">Pendiente</MenuItem>
                                        <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                                        <MenuItem value="COMPLETED">Completado</MenuItem>
                                        <MenuItem value="CANCELLED">Cancelado</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="observations"
                                    label="Observaciones"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={formData.observations}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose(false)} color="secondary">
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        color="primary" 
                        disabled={loading || loadingUsers}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default MaintenanceForm;