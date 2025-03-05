import React, { useState, useEffect } from 'react';
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
    IconButton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Edit, Delete, Add, History } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import MaterialHistory from './MaterialHistory';

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

    const currentUser = authService.getCurrentUser();

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
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenDialog(params.row)} size="small">
                        <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteMaterial(params.row.id)} size="small">
                        <Delete />
                    </IconButton>
                    <IconButton 
                        onClick={() => {
                            setSelectedMaterial(params.row);
                            setOpenHistoryDialog(true);
                        }}
                        size="small"
                    >
                        <History />
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

            if (editMode) {
                // Calculamos la nueva cantidad basada en la operación
                const changeAmount = parseInt(quantityChange.amount);
                const currentQuantity = parseInt(newMaterial.quantity);
                let newQuantity;

                if (quantityChange.operation === 'add') {
                    newQuantity = currentQuantity + changeAmount;
                } else {
                    newQuantity = currentQuantity - changeAmount;
                    // Validar que no quede negativo
                    if (newQuantity < 0) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No hay suficiente cantidad disponible para esta operación'
                        });
                        return;
                    }
                }

                const materialData = {
                    name: newMaterial.name,
                    price: parseFloat(newMaterial.price),
                    quantity: newQuantity,
                    // Enviamos estos campos solo para el historial
                    operation: quantityChange.operation === 'add' ? 'ADD' : 'REMOVE',
                    quantity_change: changeAmount
                };
                
                console.log('Datos a enviar:', materialData);
                
                await axios.put(`/materials/materials/${selectedMaterial.id}/`, materialData);
                toast.success('Material actualizado correctamente');
            } else {
                // En modo creación, enviamos todos los datos incluyendo la cantidad inicial
                const materialData = {
                    name: newMaterial.name,
                    price: parseFloat(newMaterial.price),
                    quantity: parseInt(newMaterial.quantity)
                };
                
                await axios.post('/materials/materials/', materialData);
                toast.success('Material creado correctamente');
            }
            
            handleCloseDialog();
            fetchMaterials();
        } catch (error) {
            console.error('Error:', error.response?.data || error);
            const errorMessage = error.response?.data?.quantity?.[0] || 
                               error.response?.data?.detail || 
                               'Error al procesar la operación';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
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
                        </>
                    ) : (
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
        </>
    );
};

export default MaterialList;