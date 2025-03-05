import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        contact_person: ''
    });

    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/customers/');
            setCustomers(response.data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los clientes'
            });
        }
    };

    const handleOpenDialog = (customer = null) => {
        if (customer) {
            setEditMode(true);
            setSelectedCustomer(customer);
            setNewCustomer({ ...customer });
        } else {
            setEditMode(false);
            setSelectedCustomer(null);
            setNewCustomer({
                name: '',
                address: '',
                phone: '',
                email: '',
                contact_person: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setSelectedCustomer(null);
    };

    const handleInputChange = (e) => {
        setNewCustomer({
            ...newCustomer,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            // Validar campos requeridos
            if (!newCustomer.name || !newCustomer.email || !newCustomer.phone || !newCustomer.address) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, completa todos los campos obligatorios'
                });
                return;
            }

            const dataToSend = {
                ...newCustomer,
                contact_person: newCustomer.contact_person || null // Aseguramos que se envíe null si está vacío
            };

            if (editMode) {
                await axios.put(`/customers/${selectedCustomer.id}/`, dataToSend);
                toast.success('Cliente actualizado correctamente');
            } else {
                await axios.post('/customers/', dataToSend);
                toast.success('Cliente creado correctamente');
            }
            handleCloseDialog();
            fetchCustomers();
        } catch (error) {
            console.error('Error details:', error.response?.data);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Error al procesar la operación'
            });
        }
    };

    const handleDeleteCustomer = async (customerId) => {
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
                await axios.delete(`/customers/${customerId}/`);
                toast.success('Cliente eliminado correctamente');
                fetchCustomers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el cliente'
                });
            }
        }
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Nombre',
            flex: 1,
        },
        {
            field: 'address',
            headerName: 'Dirección',
            flex: 1,
        },
        {
            field: 'phone',
            headerName: 'Teléfono',
            flex: 1,
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
        },
        {
            field: 'contact_person',
            headerName: 'Persona de Contacto',
            flex: 1,
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton 
                        onClick={() => handleOpenDialog(params.row)} 
                        size="small"
                        title="Editar"
                    >
                        <Edit />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleDeleteCustomer(params.row.id)} 
                        size="small"
                        title="Eliminar"
                    >
                        <Delete />
                    </IconButton>
                </Box>
            ),
        },
    ];

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
                        Clientes
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nuevo Cliente
                    </Button>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={customers}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
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
                    {editMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="name"
                        label="Nombre"
                        value={newCustomer.name}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="address"
                        label="Dirección"
                        value={newCustomer.address}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="phone"
                        label="Teléfono"
                        value={newCustomer.phone}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="email"
                        label="Email"
                        value={newCustomer.email}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="contact_person"
                        label="Persona de Contacto (Opcional)"
                        value={newCustomer.contact_person || ''}
                        onChange={handleInputChange}
                        helperText="Este campo es opcional"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CustomerList;