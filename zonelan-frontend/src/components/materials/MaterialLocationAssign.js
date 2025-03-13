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
    CircularProgress,
    Tabs,
    Tab,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { 
    getWarehouses, 
    getDepartments, 
    getShelves, 
    getTrays,
    createMaterialLocation,
    getMaterialLocations,
    updateMaterialLocation  // Añade esta importación si no existe
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

    // Añadir nuevo estado para controlar las pestañas
    const [tabValue, setTabValue] = useState(0);
    
    // Añadir estados para editar ubicaciones existentes
    const [editingLocation, setEditingLocation] = useState(null);
    const [editQuantity, setEditQuantity] = useState(0);

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

    // Función para cambiar de pestaña
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Función para iniciar la edición de una ubicación existente
    const handleEditLocation = (location) => {
        setEditingLocation(location);
        setEditQuantity(location.quantity); // Inicializar con la cantidad actual
    };

    // Función para guardar los cambios en una ubicación existente
    const handleUpdateLocation = async () => {
        if (!editingLocation) return;

        try {
            // Validar que no se exceda el stock total disponible
            const currentQuantity = editingLocation.quantity;
            const quantityDifference = editQuantity - currentQuantity;
            
            // Si estamos añadiendo más stock, verificar si hay suficiente disponible
            if (quantityDifference > 0 && quantityDifference > availableStock) {
                toast.error(`No hay suficiente stock disponible. Máximo incremento posible: ${availableStock}`);
                return;
            }

            // Actualizar la ubicación incluyendo TODOS los campos requeridos
            await updateMaterialLocation(editingLocation.id, {
                material: editingLocation.material, // Incluir el ID del material
                tray: editingLocation.tray,        // Incluir el ID de la balda
                quantity: editQuantity,
                minimum_quantity: editingLocation.minimum_quantity // Mantener el mínimo actual
            });

            // Actualizar la interfaz de usuario
            const updatedLocations = locations.map(loc => 
                loc.id === editingLocation.id ? {...loc, quantity: editQuantity} : loc
            );
            setLocations(updatedLocations);

            // Recalcular el stock disponible
            calculateAvailableStock();

            toast.success('Ubicación actualizada correctamente');
            setEditingLocation(null);
        } catch (error) {
            console.error('Error al actualizar ubicación:', error);
            
            // Mostrar mensaje de error más detallado
            let errorMessage = 'Error al actualizar la ubicación';
            if (error.response?.data) {
                const errors = error.response.data;
                if (typeof errors === 'object') {
                    errorMessage = Object.entries(errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('. ');
                }
            }
            
            toast.error(errorMessage);
        }
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setEditingLocation(null);
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
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                No hay stock disponible para ubicar. Todo el material ya está asignado a ubicaciones.
                            </Alert>
                        )}

                        {/* Pestañas para seleccionar tipo de operación */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="opciones de ubicación">
                                <Tab label="Nueva ubicación" />
                                {locations.length > 0 && <Tab label="Modificar ubicaciones existentes" />}
                            </Tabs>
                        </Box>

                        {/* Pestaña 1: Nueva ubicación */}
                        {tabValue === 0 && (
                            <>
                                {/* Ubicaciones existentes (vista informativa) */}
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
                            </>
                        )}

                        {/* Pestaña 2: Editar ubicaciones existentes */}
                        {tabValue === 1 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Modificar cantidades en ubicaciones existentes
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Stock disponible para asignar: <strong>{availableStock}</strong>
                                </Typography>
                                
                                <List>
                                    {locations.map((location) => (
                                        <Box key={location.id}>
                                            <ListItem 
                                                sx={{ 
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    backgroundColor: editingLocation?.id === location.id ? 'action.hover' : 'inherit'
                                                }}
                                            >
                                                {editingLocation?.id === location.id ? (
                                                    // Modo edición
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="subtitle2">
                                                                {location.warehouse_name} &gt; {location.department_name} &gt; {location.shelf_name} &gt; {location.tray_name}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} sm={2}>
                                                            <TextField
                                                                size="small"
                                                                label="Cantidad"
                                                                type="number"
                                                                fullWidth
                                                                value={editQuantity}
                                                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                                                InputProps={{ 
                                                                    inputProps: { 
                                                                        min: 0,
                                                                        // Máximo: cantidad actual + stock disponible
                                                                        max: location.quantity + availableStock
                                                                    }
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={6} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <Button 
                                                                variant="outlined" 
                                                                color="inherit" 
                                                                onClick={handleCancelEdit}
                                                                size="small"
                                                                sx={{ mr: 1 }}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button 
                                                                variant="contained" 
                                                                onClick={handleUpdateLocation}
                                                                size="small"
                                                                disabled={editQuantity === location.quantity}
                                                            >
                                                                Guardar
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                ) : (
                                                    // Modo visualización
                                                    <>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {location.warehouse_name} &gt; {location.department_name} &gt; {location.shelf_name} &gt; {location.tray_name}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Cantidad: {location.quantity} | Mínimo: {location.minimum_quantity}
                                                                </Typography>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton 
                                                                edge="end" 
                                                                aria-label="edit"
                                                                onClick={() => handleEditLocation(location)}
                                                                disabled={editingLocation !== null}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </>
                                                )}
                                            </ListItem>
                                        </Box>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancelar</Button>
                {tabValue === 0 && (
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={loading || !selectedTray || quantity <= 0 || quantity > availableStock}
                    >
                        {loading ? 'Guardando...' : 'Asignar ubicación'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default MaterialLocationAssign;