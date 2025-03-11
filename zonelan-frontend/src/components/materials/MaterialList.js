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
    Accordion, 
    AccordionSummary, 
    AccordionDetails,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
    getWarehouses, 
    getDepartments, 
    getShelves, 
    getTrays,
    createMaterialLocation
} from '../../services/storageService';
// Añadir el import
import MaterialLocationAssign from './MaterialLocationAssign';

const MaterialList = () => {
    const [materials, setMaterials] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
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

    const [assignLocation, setAssignLocation] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [trays, setTrays] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedShelf, setSelectedShelf] = useState('');
    const [selectedTray, setSelectedTray] = useState('');
    const [locationQuantity, setLocationQuantity] = useState(1);
    const [minimumQuantity, setMinimumQuantity] = useState(0);

    // Añadir el estado para el diálogo de ubicación
    const [openLocationDialog, setOpenLocationDialog] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        fetchWarehouses();
    }, []);

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

    const fetchWarehouses = async () => {
        try {
            const data = await getWarehouses();
            setWarehouses(data);
        } catch (error) {
            console.error('Error al cargar almacenes:', error);
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
        setAssignLocation(false);
        setSelectedWarehouse('');
        setSelectedDepartment('');
        setSelectedShelf('');
        setSelectedTray('');
        setLocationQuantity(1);
        setMinimumQuantity(0);
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

    // Modificar handleSubmit para manejar la cantidad correctamente
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

            // Preparar el FormData para enviar datos
            const formData = new FormData();

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
                    
                    // Resto del código para procesar el cambio de cantidad...
                    const currentQuantity = parseInt(newMaterial.quantity);
                    let operationReason;

                    if (quantityChange.operation === 'add') {
                        // Si es add, el motivo puede ser COMPRA o DEVOLUCION según lo seleccionado
                        operationReason = reasonType;
                        
                        // Solo permitir imagen para compras
                        if (reasonType === 'COMPRA' && invoiceImage) {
                            formData.append('invoice_image', invoiceImage);
                        }
                    } else {
                        // Si es subtract, el motivo será VENTA o RETIRADA según lo seleccionado
                        operationReason = withdrawalType;
                        
                        // Validar que no quede negativo
                        if (currentQuantity - changeAmount < 0) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No hay suficiente cantidad disponible para esta operación'
                            });
                            return;
                        }
                    }

                    // Añadir campos al FormData
                    formData.append('name', newMaterial.name);
                    formData.append('price', parseFloat(newMaterial.price));
                    formData.append('operation', quantityChange.operation === 'add' ? 'ADD' : 'REMOVE');
                    formData.append('quantity_change', changeAmount);
                    formData.append('reason', operationReason);
                } else {
                    // Si no hay cambio de cantidad, solo actualizar nombre y precio
                    formData.append('name', newMaterial.name);
                    formData.append('price', parseFloat(newMaterial.price));
                }
                
                // Actualizar el material
                materialResponse = await axios.put(`/materials/materials/${selectedMaterial.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Material actualizado correctamente');
            } else {
                // Código existente para crear nuevo material...
            }

            // Procesar la asignación de ubicación INDEPENDIENTEMENTE del cambio de cantidad
            if (assignLocation && selectedTray) {
                try {
                    const locationData = {
                        material: editMode ? selectedMaterial.id : materialResponse.data.id,
                        tray: parseInt(selectedTray),
                        quantity: parseInt(locationQuantity),
                        minimum_quantity: parseInt(minimumQuantity)
                    };
                    
                    if (locationQuantity <= 0) {
                        toast.error('La cantidad para la ubicación debe ser mayor que cero');
                        return;
                    }
                    
                    await createMaterialLocation(locationData);
                    toast.success('Material ubicado correctamente');
                } catch (locationError) {
                    console.error('Error al crear ubicación:', locationError);
                    toast.error('Error al asignar ubicación. Revise las ubicaciones en el módulo de almacenamiento');
                }
            }
            
            handleCloseDialog();
            fetchMaterials();
        } catch (error) {
            // Manejar errores...
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

                    <Accordion 
                        sx={{ mt: 2 }}
                        expanded={assignLocation}
                        onChange={(e, expanded) => setAssignLocation(expanded)}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Asignar ubicación</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Almacén</InputLabel>
                                        <Select
                                            value={selectedWarehouse}
                                            label="Almacén *"
                                            onChange={(e) => setSelectedWarehouse(e.target.value)}
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
                                
                                <Grid item xs={12}>
                                    <FormControl fullWidth required disabled={!selectedWarehouse}>
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
                                
                                <Grid item xs={12}>
                                    <FormControl fullWidth required disabled={!selectedDepartment}>
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
                                
                                <Grid item xs={12}>
                                    <FormControl fullWidth required disabled={!selectedShelf}>
                                        <InputLabel>Balda</InputLabel>
                                        <Select
                                            value={selectedTray}
                                            label="Balda *"
                                            onChange={(e) => setSelectedTray(e.target.value)}
                                        >
                                            <MenuItem value="">Seleccione una balda</MenuItem>
                                            {trays.map((tray) => (
                                                <MenuItem key={tray.id} value={tray.id}>
                                                    {tray.name} {tray.full_code ? `(${tray.full_code})` : ''}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Cantidad en ubicación"
                                        type="number"
                                        value={locationQuantity}
                                        onChange={(e) => setLocationQuantity(parseInt(e.target.value) || 0)}
                                        InputProps={{ inputProps: { min: 1 } }}
                                        helperText={editMode ? "Esta cantidad se añadirá/restará del stock total" : ""}
                                    />
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Cantidad mínima"
                                        type="number"
                                        value={minimumQuantity}
                                        onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 0)}
                                        InputProps={{ inputProps: { min: 0 } }}
                                        helperText="Para alertas de stock bajo"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
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
        </>
    );
};

export default MaterialList;