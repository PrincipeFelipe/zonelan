import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { 
    getWarehouses, 
    getDepartments, 
    getShelves, 
    getTrays,
    createMaterialLocation,
    getMaterialLocations
} from '../../services/storageService';
import axios from '../../utils/axiosConfig';

const MaterialLocationAssign = ({ open, onClose, material }) => {
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [trays, setTrays] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedShelf, setSelectedShelf] = useState('');
    const [selectedTray, setSelectedTray] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [minimumQuantity, setMinimumQuantity] = useState(0);
    
    // Nuevos estados para manejo de stock disponible
    const [availableStock, setAvailableStock] = useState(0);
    const [totalAllocatedStock, setTotalAllocatedStock] = useState(0);
    const [checkingStock, setCheckingStock] = useState(false);

    useEffect(() => {
        if (open && material) {
            fetchInitialData();
        }
    }, [open, material]);

    useEffect(() => {
        if (material && material.id) {
            calculateAvailableStock();
        }
    }, [material, locations]);

    useEffect(() => {
        if (selectedWarehouse) {
            fetchDepartments(selectedWarehouse);
        } else {
            setDepartments([]);
            setSelectedDepartment('');
        }
    }, [selectedWarehouse]);

    useEffect(() => {
        if (selectedDepartment) {
            fetchShelves(selectedDepartment);
        } else {
            setShelves([]);
            setSelectedShelf('');
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedShelf) {
            fetchTrays(selectedShelf);
        } else {
            setTrays([]);
            setSelectedTray('');
        }
    }, [selectedShelf]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Cargar datos iniciales
            const [warehousesData, existingLocationsData] = await Promise.all([
                getWarehouses(),
                getMaterialLocations({ material: material.id })
            ]);

            setWarehouses(warehousesData);
            setLocations(existingLocationsData);
            
            // Configurar valores predeterminados
            setQuantity(1);
            setMinimumQuantity(0);
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    // Nueva función para calcular el stock disponible sin ubicar
    const calculateAvailableStock = () => {
        setCheckingStock(true);
        try {
            // Calcular el stock ya asignado a ubicaciones
            const allocatedStock = locations.reduce(
                (total, location) => total + location.quantity, 
                0
            );
            
            setTotalAllocatedStock(allocatedStock);
            
            // Calcular stock disponible (total - asignado)
            const stockAvailable = material ? material.quantity - allocatedStock : 0;
            setAvailableStock(stockAvailable);
            
            // Si no hay stock disponible, establecer cantidad predeterminada a 0
            if (stockAvailable <= 0) {
                setQuantity(0);
            } else if (quantity > stockAvailable) {
                // Si la cantidad actual es mayor que el disponible, ajustar
                setQuantity(stockAvailable);
            }
        } catch (error) {
            console.error('Error al calcular stock disponible:', error);
        } finally {
            setCheckingStock(false);
        }
    };

    const fetchDepartments = async (warehouseId) => {
        try {
            const data = await getDepartments({ warehouse: warehouseId });
            setDepartments(data);
        } catch (error) {
            console.error('Error al cargar dependencias:', error);
        }
    };

    const fetchShelves = async (departmentId) => {
        try {
            const data = await getShelves({ department: departmentId });
            setShelves(data);
        } catch (error) {
            console.error('Error al cargar estanterías:', error);
        }
    };

    const fetchTrays = async (shelfId) => {
        try {
            const data = await getTrays({ shelf: shelfId });
            setTrays(data);
        } catch (error) {
            console.error('Error al cargar baldas:', error);
        }
    };

    const handleSubmit = async () => {
        // Validaciones
        if (!selectedTray) {
            toast.error('Debe seleccionar una balda');
            return;
        }
        
        if (quantity <= 0) {
            toast.error('La cantidad debe ser mayor que cero');
            return;
        }
        
        // Validar que no se exceda el stock disponible
        if (quantity > availableStock) {
            toast.error(`No hay suficiente stock disponible sin ubicar. Máximo: ${availableStock}`);
            return;
        }

        try {
            // Crear la ubicación con solo los campos necesarios
            const locationData = {
                material: material.id,
                tray: parseInt(selectedTray),
                quantity: parseInt(quantity),
                minimum_quantity: parseInt(minimumQuantity)
            };
            
            await createMaterialLocation(locationData);
            toast.success('Ubicación asignada correctamente');
            onClose(true);
        } catch (error) {
            console.error('Error al asignar ubicación:', error);
            
            // Mostrar mensaje de error detallado si está disponible
            const errorMsg = error.response?.data?.detail ||
                (typeof error.response?.data === 'object' ? 
                    JSON.stringify(error.response.data) : 
                    'Error al asignar ubicación');
            
            toast.error(errorMsg);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                Asignar ubicación para {material?.name}
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        {/* Información de stock */}
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2">Stock total:</Typography>
                                    <Typography variant="h6">{material?.quantity || 0}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2">Stock ya ubicado:</Typography>
                                    <Typography variant="h6">{totalAllocatedStock}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2">Stock disponible:</Typography>
                                    <Typography variant="h6" color={availableStock <= 0 ? 'error.main' : 'inherit'}>
                                        {availableStock}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                        
                        {/* Mostrar alerta si no hay stock disponible */}
                        {availableStock <= 0 && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                No hay stock disponible para ubicar. Todo el material ya está asignado a ubicaciones.
                            </Alert>
                        )}

                        {/* Ubicaciones existentes */}
                        {locations.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Ubicaciones actuales
                                </Typography>
                                {locations.map(location => (
                                    <Box key={location.id} sx={{ p: 1, mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {location.warehouse_name} &gt; {location.department_name} &gt; {location.shelf_name} &gt; {location.tray_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Cantidad: {location.quantity} | Mínimo: {location.minimum_quantity}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Formulario para nueva ubicación */}
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                            {locations.length > 0 ? 'Añadir nueva ubicación' : 'Asignar ubicación'}
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Almacén</InputLabel>
                                    <Select
                                        value={selectedWarehouse}
                                        label="Almacén *"
                                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                                        disabled={availableStock <= 0}
                                    >
                                        <MenuItem value="">Seleccione un almacén</MenuItem>
                                        {warehouses.map((warehouse) => (
                                            <MenuItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required disabled={!selectedWarehouse || availableStock <= 0}>
                                    <InputLabel>Dependencia</InputLabel>
                                    <Select
                                        value={selectedDepartment}
                                        label="Dependencia *"
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                    >
                                        <MenuItem value="">Seleccione una dependencia</MenuItem>
                                        {departments.map((department) => (
                                            <MenuItem key={department.id} value={department.id}>
                                                {department.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required disabled={!selectedDepartment || availableStock <= 0}>
                                    <InputLabel>Estantería</InputLabel>
                                    <Select
                                        value={selectedShelf}
                                        label="Estantería *"
                                        onChange={(e) => setSelectedShelf(e.target.value)}
                                    >
                                        <MenuItem value="">Seleccione una estantería</MenuItem>
                                        {shelves.map((shelf) => (
                                            <MenuItem key={shelf.id} value={shelf.id}>
                                                {shelf.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required disabled={!selectedShelf || availableStock <= 0}>
                                    <InputLabel>Balda</InputLabel>
                                    <Select
                                        value={selectedTray}
                                        label="Balda *"
                                        onChange={(e) => setSelectedTray(e.target.value)}
                                    >
                                        <MenuItem value="">Seleccione una balda</MenuItem>
                                        {trays.map((tray) => (
                                            <MenuItem key={tray.id} value={tray.id}>
                                                {tray.name} {tray.code ? `(${tray.code})` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Cantidad a ubicar"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    InputProps={{ 
                                        inputProps: { 
                                            min: 0,
                                            max: availableStock 
                                        }
                                    }}
                                    required
                                    disabled={availableStock <= 0}
                                    helperText={`Máximo disponible sin ubicar: ${availableStock}`}
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Cantidad mínima"
                                    type="number"
                                    value={minimumQuantity}
                                    onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 0)}
                                    InputProps={{ inputProps: { min: 0 } }}
                                    helperText="Para alertas de stock bajo"
                                    disabled={availableStock <= 0}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancelar</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    disabled={loading || !selectedTray || quantity <= 0 || quantity > availableStock}
                >
                    {loading ? 'Guardando...' : 'Asignar ubicación'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MaterialLocationAssign;