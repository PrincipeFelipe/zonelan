import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Grid, InputAdornment, CircularProgress, Box, Typography,
    Autocomplete
} from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useTickets } from '../../hooks/useTickets';
import { formatCurrency } from '../../utils/helpers';
import LocationSelector from '../materials/LocationSelector'; // Importar el componente LocationSelector

const AddTicketItemDialog = ({ open, onClose, onSuccess, ticketId }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [materialLoading, setMaterialLoading] = useState(false);
    const [formData, setFormData] = useState({
        material: '',
        quantity: 1,
        discount_percentage: 0,
        notes: '',
        location_id: null // Añadir campo para la ubicación
    });
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const { addTicketItem } = useTickets();
    
    // Estados para el selector de ubicación
    const [openLocationSelector, setOpenLocationSelector] = useState(false);

    useEffect(() => {
        if (open) {
            fetchMaterials();
            resetForm();
        }
    }, [open]);

    const fetchMaterials = async () => {
        try {
            setMaterialLoading(true);
            const response = await axios.get('/materials/materials/', {
                params: { available_only: true }
            });
            
            // Normalizar los datos para evitar problemas con valores numéricos
            const normalizedMaterials = response.data.map(material => ({
                ...material,
                price: parseFloat(material.price || 0),
                quantity: parseInt(material.quantity || 0)
            }));
            
            setMaterials(normalizedMaterials);
        } catch (error) {
            console.error('Error al cargar materiales:', error);
            toast.error('Error al cargar la lista de materiales', { position: 'top-right' });
        } finally {
            setMaterialLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            material: '',
            quantity: 1,
            discount_percentage: 0,
            notes: '',
            location_id: null
        });
        setSelectedMaterial(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Para campos numéricos, asegurarnos de que sean válidos
        if (name === 'quantity' && value < 0) {
            return;
        }
        
        if (name === 'discount_percentage' && (value < 0 || value > 100)) {
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMaterialChange = (event, newValue) => {
        if (newValue) {
            setSelectedMaterial(newValue);
            setFormData(prev => ({
                ...prev,
                material: newValue.id,
                // Inicializamos con el precio actual del material
                unit_price: newValue.price
            }));
        } else {
            setSelectedMaterial(null);
            setFormData(prev => ({
                ...prev,
                material: '',
                unit_price: 0,
                location_id: null
            }));
        }
    };

    // Modificar el handleSubmit para usar el selector de ubicación
    const handleSubmit = async () => {
        // Validaciones
        if (!formData.material) {
            toast.error('Debe seleccionar un material', { position: 'top-right' });
            return;
        }

        if (!formData.quantity || formData.quantity <= 0) {
            toast.error('La cantidad debe ser mayor que cero', { position: 'top-right' });
            return;
        }

        // Verificar que hay suficiente stock
        if (selectedMaterial && formData.quantity > selectedMaterial.quantity) {
            toast.error(`Stock insuficiente. Disponible: ${selectedMaterial.quantity}`, { position: 'top-right' });
            return;
        }

        // Abrir el selector de ubicación
        setOpenLocationSelector(true);
    };
    
    // Función para procesar la ubicación seleccionada
    const handleLocationSelected = async (location) => {
        try {
            setLoading(true);
            setOpenLocationSelector(false);
            
            // Agregar la ubicación al formData
            const dataToSubmit = {
                ...formData,
                location_id: location.id
            };
            
            // Enviar al servidor
            await addTicketItem(ticketId, dataToSubmit);
            onSuccess && onSuccess();
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error al añadir producto al ticket:', error);
            toast.error(error.response?.data?.detail || 'Error al añadir producto', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    // Cancelar la selección de ubicación
    const handleCancelLocationSelection = () => {
        setOpenLocationSelector(false);
    };

    const calculateTotal = () => {
        if (!selectedMaterial) return 0;
        
        const price = selectedMaterial.price;
        const quantity = parseFloat(formData.quantity || 0);
        const discount = parseFloat(formData.discount_percentage || 0);
        
        let total = price * quantity;
        if (discount > 0) {
            total = total - (total * discount / 100);
        }
        
        return total;
    };

    // Verificar si hay materiales disponibles
    const materialsWithStock = materials.filter(m => m.quantity > 0);
    const noMaterialsAvailable = materialsWithStock.length === 0;

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Añadir Producto</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            {noMaterialsAvailable ? (
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    No hay materiales disponibles en stock.
                                </Typography>
                            ) : materialLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2">Cargando materiales...</Typography>
                                </Box>
                            ) : (
                                <Autocomplete
                                    fullWidth
                                    options={materialsWithStock}
                                    getOptionLabel={(option) => `${option.name} (Stock: ${option.quantity}) - ${formatCurrency(option.price)}`}
                                    renderInput={(params) => <TextField {...params} label="Buscar material" />}
                                    onChange={handleMaterialChange}
                                    value={selectedMaterial}
                                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                                    filterOptions={(options, state) => {
                                        const inputValue = state.inputValue.toLowerCase().trim();
                                        if (inputValue === '') return options;
                                        
                                        return options.filter(option => 
                                            option.name.toLowerCase().includes(inputValue)
                                        );
                                    }}
                                />
                            )}
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="quantity"
                                label="Cantidad"
                                type="number"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                InputProps={{
                                    inputProps: { 
                                        min: 1, 
                                        max: selectedMaterial?.quantity || 999,
                                        step: 1
                                    }
                                }}
                                disabled={!selectedMaterial}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="discount_percentage"
                                label="Descuento (%)"
                                type="number"
                                value={formData.discount_percentage}
                                onChange={handleInputChange}
                                InputProps={{
                                    inputProps: { min: 0, max: 100, step: 1 },
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                disabled={!selectedMaterial}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                name="notes"
                                label="Notas"
                                multiline
                                rows={2}
                                value={formData.notes}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>

                    {selectedMaterial && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Resumen
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Precio unitario:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" align="right">{formatCurrency(selectedMaterial.price)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Cantidad:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" align="right">{formData.quantity}</Typography>
                                </Grid>
                                {parseFloat(formData.discount_percentage) > 0 && (
                                    <>
                                        <Grid item xs={6}>
                                            <Typography variant="body2">Descuento:</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" align="right">{formData.discount_percentage}%</Typography>
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12}>
                                    <hr style={{ margin: '8px 0' }} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Total:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" align="right">{formatCurrency(calculateTotal())}</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        color="primary" 
                        disabled={loading || !selectedMaterial || formData.quantity <= 0}
                    >
                        {loading ? <CircularProgress size={24} /> : "Continuar"}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Selector de ubicación */}
            <LocationSelector
                open={openLocationSelector}
                onClose={handleCancelLocationSelection}
                materialId={formData.material}
                materialName={selectedMaterial?.name}
                quantity={formData.quantity || 0}
                onSelectLocation={handleLocationSelected}
            />
        </>
    );
};

export default AddTicketItemDialog;