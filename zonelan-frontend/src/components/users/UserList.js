import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
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
    MenuItem,
    Box,
    Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        cod_worker: '',
        type: 'User'
    });
    const [loading, setLoading] = useState(false);

    const currentUser = authService.getCurrentUser();

    const userTypes = [
        { value: 'Admin', label: 'Administrador' },
        { value: 'Gestor', label: 'Gestor' },
        { value: 'User', label: 'Usuario' }
    ];

    const canManageAdmin = currentUser?.type === 'SuperAdmin';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/users/');
            // Filtrar el usuario con ID 1 (superadmin)
            const filteredUsers = response.data.filter(user => user.id !== 1);
            setUsers(filteredUsers);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los usuarios'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (user = null) => {
        // Verificar permisos para editar administradores
        if (user?.type === 'Admin' && !canManageAdmin) {
            Swal.fire({
                icon: 'warning',
                title: 'Permiso Denegado',
                text: 'No tienes permisos para modificar administradores'
            });
            return;
        }

        if (user) {
            setEditMode(true);
            setSelectedUser(user);
            setNewUser({
                ...user,
                password: '' // No mostramos la contraseña actual
            });
        } else {
            setEditMode(false);
            setSelectedUser(null);
            setNewUser({
                username: '',
                password: '',
                name: '',
                email: '',
                phone: '',
                cod_worker: '',
                type: 'User'
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setError('');
        setEditMode(false);
        setSelectedUser(null);
    };

    const handleInputChange = (e) => {
        setNewUser({
            ...newUser,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            if (editMode) {
                const dataToSend = {
                    username: newUser.username,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    type: newUser.type
                };
                
                // Solo incluimos la contraseña si se ha proporcionado una nueva
                if (newUser.password) {
                    dataToSend.password = newUser.password;
                }

                // Eliminamos campos vacíos
                Object.keys(dataToSend).forEach(key => {
                    if (dataToSend[key] === '' || dataToSend[key] === null) {
                        delete dataToSend[key];
                    }
                });

                // Eliminamos el campo cod_worker ya que no debe modificarse
                delete dataToSend.cod_worker;

                await axios.put(`/users/${selectedUser.id}/`, dataToSend);
                toast.success('Usuario actualizado correctamente');
            } else {
                await axios.post('/users/', newUser);
                toast.success('Usuario creado correctamente');
            }
            handleCloseDialog();
            fetchUsers();
        } catch (error) {
            console.error('Error details:', error.response?.data);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Error al procesar la operación'
            });
        }
    };

    const handleDeleteUser = async (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        
        // Verificar permisos para eliminar administradores
        if (userToDelete.type === 'Admin' && !canManageAdmin) {
            Swal.fire({
                icon: 'warning',
                title: 'Permiso Denegado',
                text: 'No tienes permisos para eliminar administradores'
            });
            return;
        }

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
                await axios.delete(`/users/${userId}/`);
                toast.success('Usuario eliminado correctamente');
                fetchUsers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el usuario'
                });
            }
        }
    };

    // Añadir el objeto de traducción de tipos de usuario
    const userTypeTranslations = {
        'Admin': 'Administrador',
        'Gestor': 'Gestor',
        'User': 'Usuario'
    };

    // Modificar las columnas
    const columns = [
        {
            field: 'username',
            headerName: 'Usuario',
            flex: 1,
        },
        {
            field: 'name',
            headerName: 'Nombre',
            flex: 1,
        },
        {
            field: 'email',
            headerName: 'Correo',
            flex: 1,
        },
        {
            field: 'phone',
            headerName: 'Teléfono',
            flex: 1,
        },
        {
            field: 'cod_worker',
            headerName: 'Código',
            flex: 1,
        },
        {
            field: 'type',
            headerName: 'Tipo',
            flex: 1,
            valueFormatter: (params) => userTypeTranslations[params.value] || params.value,
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
                        onClick={() => handleDeleteUser(params.row.id)} 
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
                        Usuarios
                    </Typography>
                    {(currentUser?.type === 'Admin' || currentUser?.type === 'SuperAdmin') && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                        >
                            Nuevo Usuario
                        </Button>
                    )}
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={users}
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
                    {editMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        margin="normal"
                        name="username"
                        label="Usuario"
                        value={newUser.username}
                        onChange={handleInputChange}
                        disabled={editMode}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="password"
                        label={editMode ? "Nueva Contraseña (opcional)" : "Contraseña"}
                        type="password"
                        value={newUser.password}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="name"
                        label="Nombre"
                        value={newUser.name}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="email"
                        label="Email"
                        value={newUser.email}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="phone"
                        label="Teléfono"
                        value={newUser.phone}
                        onChange={handleInputChange}
                    />
                    {!editMode && (
                        <TextField
                            fullWidth
                            margin="normal"
                            name="cod_worker"
                            label="Código de trabajador"
                            value={newUser.cod_worker}
                            disabled={true}
                        />
                    )}
                    <TextField
                        fullWidth
                        margin="normal"
                        select
                        name="type"
                        label="Tipo de usuario"
                        value={newUser.type}
                        onChange={handleInputChange}
                    >
                        {userTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
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

export default UserList;