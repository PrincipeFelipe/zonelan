import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Cambiado desde react-toastify
import { useContracts } from '../../hooks/useContracts';
import axios from '../../utils/axiosConfig';
import {
    Button, Typography, Box, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, IconButton, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { formatDate } from '../../utils/formatters';
import MaintenanceForm from './MaintenanceForm';

const MaintenanceList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openForm, setOpenForm] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [users, setUsers] = useState([]);
    
    const { 
        fetchContract, 
        fetchMaintenanceRecords, 
        deleteMaintenanceRecord
    } = useContracts();

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar contrato
            const contractData = await fetchContract(id);
            setContract(contractData);
            
            // Cargar usuarios para mostrar nombres en lugar de IDs
            try {
                const response = await axios.get('/users/');
                setUsers(response.data);
            } catch (userError) {
                console.error('Error al cargar usuarios:', userError);
                // No mostrar toast para no interrumpir la UX
            }
            
            // Usar el ID directamente para evitar errores
            const records = await fetchMaintenanceRecords({ contract: id });
            console.log('Registros de mantenimiento recibidos:', records);
            
            // Asegurarse de que siempre sea un array, incluso si la API devuelve null o undefined
            setMaintenanceRecords(records || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar registros de mantenimiento');
            // En caso de error, inicializar con un array vacío
            setMaintenanceRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setSelectedRecord(null);
        setOpenForm(true);
    };

    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setOpenForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setDeleteId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        
        try {
            await deleteMaintenanceRecord(deleteId);
            toast.success('Registro eliminado correctamente');
            loadData(); // Recargar datos
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            toast.error('Error al eliminar el registro');
        } finally {
            setOpenDialog(false);
            setDeleteId(null);
        }
    };

    const handleFormClose = (refreshList = false) => {
        setOpenForm(false);
        setSelectedRecord(null);
        if (refreshList) {
            loadData();
        }
    };

    // Añadir estas funciones de ayuda justo después de las definiciones de estados
    const getMaintenanceTypeText = (type) => {
        switch (type) {
            case 'PREVENTIVE': return 'Preventivo';
            case 'CORRECTIVE': return 'Correctivo';
            case 'EMERGENCY': return 'Emergencia';
            case 'INSPECTION': return 'Inspección';
            default: return type || '-';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'IN_PROGRESS': return 'En Progreso';
            case 'COMPLETED': return 'Completado';
            case 'CANCELLED': return 'Cancelado';
            default: return status || '-';
        }
    };

    // Actualizar esta función:
    const getTechnicianName = (technicianId, usersList) => {
        if (!technicianId || !usersList || !usersList.length) return null;
        
        // Si technicianId es un número o string numérico, buscar por ID
        if (!isNaN(technicianId)) {
            const user = usersList.find(u => u.id === parseInt(technicianId));
            if (user) {
                // Devolver solo el nombre si existe, si no, el nombre de usuario
                return user.name || user.username;
            }
            return null;
        }
        
        // Si es un string, devolverlo directamente (asumiendo que es un nombre)
        return technicianId;
    };

    // Mostrar loading cuando se están cargando los datos
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Registros de Mantenimiento
                    {contract && ` - ${contract.title}`}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddClick}
                >
                    Nuevo Registro
                </Button>
            </Box>
            
            {/* Mostrar mensaje cuando no hay registros */}
            {(!maintenanceRecords || maintenanceRecords.length === 0) ? (
                <Box textAlign="center" py={4}>
                    <Typography variant="body1">
                        No hay registros de mantenimiento para este contrato.
                    </Typography>
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Técnico</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Observaciones</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {maintenanceRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{formatDate(record.date)}</TableCell>
                                    <TableCell>
                                        {/* Mostrar el valor de visualización si existe, sino el valor raw */}
                                        {record.maintenance_type_display || getMaintenanceTypeText(record.maintenance_type)}
                                    </TableCell>
                                    <TableCell>
                                        {/* Mostrar el nombre del técnico en lugar del ID */}
                                        {record.technician_name || 
                                         getTechnicianName(record.technician, users) || 
                                         record.performed_by_name || 
                                         record.technician || 
                                         '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={record.status_display || getStatusText(record.status)}
                                            color={
                                                record.status === 'COMPLETED' ? 'success' :
                                                record.status === 'PENDING' ? 'warning' : 
                                                record.status === 'IN_PROGRESS' ? 'info' : 'default'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{record.observations || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            color="primary"
                                            onClick={() => handleEditClick(record)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDeleteClick(record.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal de confirmación para eliminar */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar este registro de mantenimiento? 
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de formulario */}
            {openForm && (
                <MaintenanceForm
                    open={openForm}
                    onClose={handleFormClose}
                    record={selectedRecord}
                    contractId={id}
                />
            )}
        </Box>
    );
};

export default MaintenanceList;