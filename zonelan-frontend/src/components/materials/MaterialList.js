import React, { useState, useEffect, useRef } from 'react';
import {
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    IconButton,
    MenuItem,
    FormHelperText,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    Grid
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Edit, Delete, Add, History, CloudUpload, Clear, PhotoCamera, Room } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import MaterialHistory from './MaterialHistory';
import { 
    createMaterialLocation
} from '../../services/storageService';
// Añadir el import
import MaterialLocationAssign from './MaterialLocationAssign';
// Primero añadir el import al inicio del archivo
import LocationSelector from './LocationSelector';

const MaterialList = () => {
    const [materials, setMaterials] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null); // Mantén esta primera declaración
    const [editMode, setEditMode] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        quantity: 0,
        price: 0
    });
    const [loading, setLoading] = useState(false);

    // Añadir nuevo estado para el manejo de la cantidad
    const [quantityChange, setQuantityChange] = useState({
        amount: 0,
        operation: 'add' // 'add' o 'subtract'
    });

    // Añadir estado para el motivo
    const [reasonType, setReasonType] = useState('COMPRA');

    // Añadir el estado para el tipo de retirada
    const [withdrawalType, setWithdrawalType] = useState('RETIRADA');

    const currentUser = authService.getCurrentUser();

    // Añadir estado para la imagen del albarán
    const [invoiceImage, setInvoiceImage] = useState(null);
    const [invoicePreview, setInvoicePreview] = useState('');
    const fileInputRef = useRef();

    // Conservar estos estados para el LocationSelector
    const [openLocationSelectorDialog, setOpenLocationSelectorDialog] = useState(false);
    const [pendingOperation, setPendingOperation] = useState(null);
    
    // Mantener estos estados para la asignación desde la grid
    const [openLocationDialog, setOpenLocationDialog] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const columns = [
        { 
            field: 'name', 
            headerName: 'Nombre', 
            flex: 1,
            minWidth: 200 
        },
        { 
            field: 'quantity', 
            headerName: 'Cantidad', 
            type: 'number',
            width: 130,
            align: 'right',
            headerAlign: 'right'
        },
        { 
            field: 'price', 
            headerName: 'Precio', 
            type: 'number',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 200, // Aumentar el ancho para acomodar el nuevo botón
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenDialog(params.row)} size="small" title="Editar">
                        <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteMaterial(params.row.id)} size="small" title="Eliminar">
                        <Delete />
                    </IconButton>
                    <IconButton 
                        onClick={() => {
                            setSelectedMaterial(params.row);
                            setOpenHistoryDialog(true);
                        }}
                        size="small"
                        title="Historial"
                    >
                        <History />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleAssignLocation(params.row)}
                        size="small"
                        title="Asignar ubicación"
                        color="secondary"
                    >
                        <Room />
                    </IconButton>
                </Box>
            )
        }
    ];

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/materials/materials/');
            const formattedData = response.data.map(material => ({
                ...material,
                // Asegurarnos de que el precio es un número válido
                price: parseFloat(material.price) || 0,
                quantity: parseInt(material.quantity) || 0
            }));
            setMaterials(formattedData);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los materiales'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (material = null) => {
        if (material) {
            setEditMode(true);
            setSelectedMaterial(material);
            setNewMaterial({ ...material });
            // Resetear el estado de quantityChange
            setQuantityChange({
                amount: 0,
                operation: 'add'
            });
        } else {
            setEditMode(false);
            setSelectedMaterial(null);
            setNewMaterial({
                name: '',
                quantity: 0,
                price: 0
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setSelectedMaterial(null);
        clearImage();
    };

    // Modificar handleInputChange para manejar los nuevos campos
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'quantity_change') {
            setQuantityChange(prev => ({
                ...prev,
                amount: value
            }));
        } else {
            setNewMaterial({
                ...newMaterial,
                [name]: value
            });
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInvoiceImage(file);
            setInvoicePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setInvoiceImage(null);
        setInvoicePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Modificar handleSubmit para incluir la implementación de creación de material
    const handleSubmit = async () => {
        try {
            if (!newMaterial.name || isNaN(parseFloat(newMaterial.price)) || parseFloat(newMaterial.price) < 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, completa todos los campos correctamente'
                });
                return;
            }

            // Variable para almacenar la respuesta
            let materialResponse;
            
            if (editMode) {
                // Solo validar quantityChange si se está modificando la cantidad
                if (quantityChange.amount !== 0 && quantityChange.amount !== '') {
                    const changeAmount = parseInt(quantityChange.amount);
                    
                    // Validar solo si se está realizando un cambio de cantidad
                    if (changeAmount <= 0) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'La cantidad debe ser un número positivo'
                        });
                        return;
                    }
                    
                    // Si es una resta, verificar ubicaciones
                    if (quantityChange.operation === 'subtract') {
                        // Guardar operación pendiente y abrir selector de ubicación
                        setPendingOperation({
                            type: 'edit',
                            material: selectedMaterial,
                            quantity: changeAmount,
                            operation: quantityChange.operation,
                            reason: withdrawalType
                        });
                        setOpenLocationSelectorDialog(true);
                        return;
                    }
                    
                    // Preparar el FormData para enviar datos
                    const formData = new FormData();
                    formData.append('name', newMaterial.name);
                    formData.append('price', parseFloat(newMaterial.price));
                    formData.append('operation', quantityChange.operation === 'add' ? 'ADD' : 'REMOVE');
                    formData.append('quantity_change', changeAmount);
                    formData.append('reason', reasonType);
                    
                    // Añadir imagen de albarán si existe y es una compra
                    if (invoiceImage && quantityChange.operation === 'add' && reasonType === 'COMPRA') {
                        formData.append('invoice_image', invoiceImage);
                    }
                    
                    // Actualizar el material
                    await axios.put(`/materials/materials/${selectedMaterial.id}/`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    toast.success('Material actualizado correctamente');
                } else {
                    // Actualizar solo los datos básicos sin cambiar cantidad
                    const formData = new FormData();
                    formData.append('name', newMaterial.name);
                    formData.append('price', parseFloat(newMaterial.price));
                    
                    await axios.put(`/materials/materials/${selectedMaterial.id}/`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    toast.success('Material actualizado correctamente');
                }
            } else {
                // Código para crear un nuevo material
                const formData = new FormData();
                formData.append('name', newMaterial.name);
                formData.append('quantity', parseInt(newMaterial.quantity) || 0);
                formData.append('price', parseFloat(newMaterial.price) || 0);
                formData.append('reason', 'COMPRA'); // Razón por defecto para nuevos materiales
                
                // Añadir imagen de albarán si existe
                if (invoiceImage) {
                    formData.append('invoice_image', invoiceImage);
                }
                
                // Crear el material
                const response = await axios.post('/materials/materials/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                toast.success('Material creado correctamente');
            }

            handleCloseDialog();
            fetchMaterials();
        } catch (error) {
            console.error('Error al guardar material:', error);
            const errorMessage = error.response?.data?.detail || 'Error al guardar el material';
            toast.error(errorMessage);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/materials/materials/${materialId}/`);
                toast.success('Material eliminado correctamente');
                fetchMaterials();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el material'
                });
            }
        }
    };

    // Añadir esta nueva función al componente MaterialList
    const handleAssignLocation = (material) => {
        setSelectedMaterial(material);
        setOpenLocationDialog(true);
    };

    // Añadir esta función para manejar la selección de ubicación
    const handleLocationSelected = async (location) => {
        try {
            setOpenLocationSelectorDialog(false);
            
            if (!pendingOperation) return;
            
            const { type, material, quantity, operation, reason } = pendingOperation;
            
            // Preparar el FormData para enviar datos
            const formData = new FormData();
            
            if (type === 'edit') {
                // Usar los datos del material seleccionado
                formData.append('name', material.name);
                formData.append('price', parseFloat(material.price));
                formData.append('operation', 'REMOVE');
                formData.append('quantity_change', quantity);
                formData.append('reason', reason);
                formData.append('location_id', location.id);
                
                // Actualizar el material
                await axios.put(`/materials/materials/${material.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                toast.success('Material actualizado correctamente');
            }
            
            // Limpiar la operación pendiente
            setPendingOperation(null);
            
            // Cerrar diálogos y recargar datos
            handleCloseDialog();
            fetchMaterials();
        } catch (error) {
            console.error('Error al procesar la operación:', error);
            toast.error('Error al procesar la operación');
        }
    };

    // Definir la localización en español
    const localeText = {
        // Toolbar
        toolbarDensity: 'Densidad',
        toolbarDensityLabel: 'Densidad',
        toolbarDensityCompact: 'Compacta',
        toolbarDensityStandard: 'Estándar',
        toolbarDensityComfortable: 'Cómoda',
        toolbarColumns: 'Columnas',
        toolbarFilters: 'Filtros',
        toolbarExport: 'Exportar',
        toolbarQuickFilterPlaceholder: 'Buscar...',
        toolbarQuickFilterLabel: 'Buscar',
        
        // Columnas
        columnMenuLabel: 'Menú',
        columnMenuShowColumns: 'Mostrar columnas',
        columnMenuFilter: 'Filtrar',
        columnMenuHideColumn: 'Ocultar',
        columnMenuUnsort: 'Desordenar',
        columnMenuSortAsc: 'Ordenar ASC',
        columnMenuSortDesc: 'Ordenar DESC',
        
        // Filtros
        filterPanelAddFilter: 'Añadir filtro',
        filterPanelDeleteIconLabel: 'Borrar',
        filterPanelOperators: 'Operadores',
        filterPanelOperatorAnd: 'Y',
        filterPanelOperatorOr: 'O',
        filterPanelColumns: 'Columnas',
        
        // Paginación
        footerTotalRows: 'Total de filas:',
        footerTotalVisibleRows: 'Filas visibles:',
        footerRowSelected: 'fila seleccionada',
        footerRowsSelected: 'filas seleccionadas',
        
        // Mensajes
        noRowsLabel: 'No hay datos',
        errorOverlayDefaultLabel: 'Ha ocurrido un error.',
        
        // Exportar
        toolbarExportCSV: 'Descargar CSV',
        toolbarExportPrint: 'Imprimir',
    };

    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Materiales
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nuevo Material
                    </Button>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={materials}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        loading={loading}
                        autoHeight
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 500 },
                            },
                        }}
                        getRowId={(row) => row.id}
                        localeText={localeText}
                        sx={{
                            '& .MuiDataGrid-toolbarContainer': {
                                borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                padding: '8px 16px',
                            },
                        }}
                    />
                </Paper>
            </Box>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editMode ? 'Editar Material' : 'Crear Nuevo Material'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="name"
                        label="Nombre"
                        value={newMaterial.name}
                        onChange={handleInputChange}
                    />
                    
                    {editMode ? (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Cantidad actual: {newMaterial.quantity}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    sx={{ flexGrow: 1 }}
                                    margin="normal"
                                    name="quantity_change"
                                    label="Cambio de cantidad"
                                    type="number"
                                    value={quantityChange.amount}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 0 }}
                                />
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant={quantityChange.operation === 'add' ? 'contained' : 'outlined'}
                                        onClick={() => setQuantityChange(prev => ({ ...prev, operation: 'add' }))}
                                        color="success"
                                        sx={{ mr: 1 }}
                                    >
                                        Añadir
                                    </Button>
                                    <Button
                                        variant={quantityChange.operation === 'subtract' ? 'contained' : 'outlined'}
                                        onClick={() => setQuantityChange(prev => ({ ...prev, operation: 'subtract' }))}
                                        color="error"
                                    >
                                        Restar
                                    </Button>
                                </Box>
                            </Box>

                            {/* Selector de motivo para operación de añadir */}
                            {quantityChange.operation === 'add' && (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    select
                                    label="Motivo de entrada"
                                    value={reasonType}
                                    onChange={(e) => setReasonType(e.target.value)}
                                >
                                    <MenuItem value="COMPRA">Compra</MenuItem>
                                    <MenuItem value="DEVOLUCION">Devolución</MenuItem>
                                </TextField>
                            )}

                            {/* Añadir subida de imagen de albarán para COMPRA */}
                            {quantityChange.operation === 'add' && reasonType === 'COMPRA' && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Albarán de compra (opcional)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                startIcon={<CloudUpload />}
                                            >
                                                Subir Albarán
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                            </Button>
                                            {invoiceImage && (
                                                <IconButton color="error" onClick={clearImage}>
                                                    <Clear />
                                                </IconButton>
                                            )}
                                        </Box>
                                        
                                        {invoicePreview && (
                                            <Box 
                                                sx={{ 
                                                    mt: 1, 
                                                    width: '100%', 
                                                    maxHeight: '200px',
                                                    overflow: 'hidden',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <img 
                                                    src={invoicePreview} 
                                                    alt="Vista previa del albarán" 
                                                    style={{ 
                                                        maxWidth: '100%',
                                                        maxHeight: '200px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Selector de motivo para operación de restar */}
                            {quantityChange.operation === 'subtract' && (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    select
                                    label="Motivo de salida"
                                    value={withdrawalType}
                                    onChange={(e) => setWithdrawalType(e.target.value)}
                                >
                                    <MenuItem value="VENTA">Venta</MenuItem>
                                    <MenuItem value="RETIRADA">Retirada</MenuItem>
                                </TextField>
                            )}
                        </>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                margin="normal"
                                name="quantity"
                                label="Cantidad inicial"
                                type="number"
                                value={newMaterial.quantity}
                                onChange={handleInputChange}
                                inputProps={{ min: 0 }}
                            />
                            
                            {/* Añadir subida de imagen de albarán para nuevo material */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Albarán de compra (opcional)
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<CloudUpload />}
                                        >
                                            Subir Albarán
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </Button>
                                        {invoiceImage && (
                                            <IconButton color="error" onClick={clearImage}>
                                                <Clear />
                                            </IconButton>
                                        )}
                                    </Box>
                                    
                                    {invoicePreview && (
                                        <Box 
                                            sx={{ 
                                                mt: 1, 
                                                width: '100%', 
                                                maxHeight: '200px',
                                                overflow: 'hidden',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <img 
                                                src={invoicePreview} 
                                                alt="Vista previa del albarán" 
                                                style={{ 
                                                    maxWidth: '100%',
                                                    maxHeight: '200px',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </>
                    )}
                    
                    <TextField
                        fullWidth
                        margin="normal"
                        name="price"
                        label="Precio"
                        type="number"
                        value={newMaterial.price}
                        onChange={handleInputChange}
                        inputProps={{ min: 0, step: "0.01" }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            <MaterialHistory
                open={openHistoryDialog}
                onClose={() => setOpenHistoryDialog(false)}
                material={selectedMaterial}
            />
            <MaterialLocationAssign
                open={openLocationDialog}
                onClose={(refresh) => {
                    setOpenLocationDialog(false);
                    if (refresh) fetchMaterials();
                }}
                material={selectedMaterial}
            />
            {/* Agregar el selector de ubicación */}
            <LocationSelector
                open={openLocationSelectorDialog}
                onClose={() => setOpenLocationSelectorDialog(false)}
                materialId={pendingOperation?.material?.id}
                materialName={pendingOperation?.material?.name}
                quantity={pendingOperation?.quantity || 0}
                onSelectLocation={handleLocationSelected}
            />
        </>
    );
};

export default MaterialList;