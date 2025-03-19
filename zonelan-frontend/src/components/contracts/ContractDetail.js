import React, { useState, useEffect } from 'react';
import { 
    Box, Tabs, Tab, Typography, Button, Grid, Paper, Chip,
    Divider, IconButton, List, ListItem, ListItemText, 
    ListItemSecondaryAction, Tooltip, CircularProgress, Alert
} from '@mui/material';
import { 
    Edit, Delete, Warning, Assignment, CalendarToday, 
    CloudUpload, Description, Add, Visibility, FileDownload
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import differenceInDays from 'date-fns/differenceInDays';
import es from 'date-fns/locale/es';
import { useContracts } from '../../hooks/useContracts';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import MaintenanceForm from './MaintenanceForm';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DocumentPreview from './DocumentPreview';

const ContractDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { 
        fetchContract, 
        fetchMaintenanceRecords, 
        fetchContractDocuments, 
        fetchContractReports,
        deleteContract,
        completeContractMaintenance,
        loading: contractsLoading 
    } = useContracts();
    
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [reports, setReports] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
    const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    useEffect(() => {
        loadContractData();
    }, [id]);
    
    const loadContractData = async () => {
        try {
            setLoading(true);
            
            // Cargar detalles del contrato
            const contractData = await fetchContract(id);
            setContract(contractData);
            
            // Usa el ID directamente, no el objeto completo
            const maintenanceData = await fetchMaintenanceRecords({ contract: id });
            setMaintenanceRecords(maintenanceData || []);
            
            // Cargar documentos
            const documentsData = await fetchContractDocuments(id);
            setDocuments(documentsData || []);
            
            // Cargar reportes
            const reportsData = await fetchContractReports(id);
            setReports(reportsData || []);
            
        } catch (error) {
            console.error('Error al cargar los datos del contrato:', error);
            toast.error('Error al cargar la información del contrato');
        } finally {
            setLoading(false);
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    const handleDeleteClick = async () => {
        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "No podrá revertir esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });
            
            if (result.isConfirmed) {
                await deleteContract(id);
                toast.success('Contrato eliminado correctamente');
                navigate('/dashboard/contracts/list');
            }
        } catch (error) {
            console.error('Error al eliminar el contrato:', error);
            toast.error('Error al eliminar el contrato');
        }
    };
    
    const handleMaintenanceDialogOpen = () => {
        setOpenMaintenanceDialog(true);
    };
    
    const handleMaintenanceDialogClose = () => {
        setOpenMaintenanceDialog(false);
    };
    
    const handleMaintenanceSubmit = async (formData) => {
        try {
            await completeContractMaintenance(id, formData);
            toast.success('Mantenimiento registrado correctamente');
            loadContractData(); // Recargar datos para reflejar el cambio
        } catch (error) {
            console.error('Error al registrar el mantenimiento:', error);
            toast.error('Error al registrar el mantenimiento');
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'No especificado';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    const handlePreviewDocument = (document) => {
        setSelectedDocument(document);
        setPreviewOpen(true);
    };
    
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }
    
    if (!contract) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    No se encontró el contrato solicitado
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/dashboard/contracts/list')}
                    sx={{ mt: 2 }}
                >
                    Volver a la lista
                </Button>
            </Box>
        );
    }
    
    const maintenancePending = contract.is_maintenance_pending;
    
    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-right" />
            
            {/* Header y acciones principales */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {contract.title}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Cliente: {contract.customer_name}
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        variant="outlined"
                        onClick={() => navigate('/dashboard/contracts/list')}
                    >
                        Volver
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/dashboard/contracts/${id}/edit`)}
                    >
                        Editar
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleDeleteClick}
                    >
                        Eliminar
                    </Button>
                </Box>
            </Box>
            
            {/* Información principal y pestañas */}
            <Grid container spacing={3}>
                {/* Panel izquierdo con información del contrato */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Información del contrato
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Estado:
                                </Typography>
                                <Chip 
                                    label={contract.status_display} 
                                    color={contract.status === 'ACTIVE' ? 'success' : contract.status === 'INACTIVE' ? 'default' : 'error'}
                                />
                            </Grid>
                            
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mantenimiento:
                                </Typography>
                                <Chip 
                                    label={contract.requires_maintenance ? 'Requiere' : 'No requiere'} 
                                    color={contract.requires_maintenance ? 'primary' : 'default'}
                                    variant={contract.requires_maintenance ? 'filled' : 'outlined'}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Fecha de inicio:
                                </Typography>
                                <Typography>
                                    {formatDate(contract.start_date)}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Fecha de fin:
                                </Typography>
                                <Typography>
                                    {formatDate(contract.end_date) || 'Sin definir'}
                                </Typography>
                            </Grid>
                            
                            {contract.requires_maintenance && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Frecuencia de mantenimiento:
                                        </Typography>
                                        <Typography>
                                            {contract.maintenance_frequency_display}
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Próximo mantenimiento:
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>
                                                {formatDate(contract.next_maintenance_date)}
                                            </Typography>
                                            
                                            {maintenancePending && (
                                                <Chip
                                                    size="small"
                                                    label="Pendiente"
                                                    color="warning"
                                                    icon={<Warning fontSize="small" />}
                                                />
                                            )}
                                        </Box>
                                    </Grid>
                                    
                                    <Grid item xs={12} sx={{ mt: 1 }}>
                                        <Button
                                            variant="contained"
                                            color={maintenancePending ? "warning" : "primary"}
                                            startIcon={<Assignment />}
                                            fullWidth
                                            onClick={handleMaintenanceDialogOpen}
                                        >
                                            Registrar Mantenimiento
                                        </Button>
                                    </Grid>
                                </>
                            )}
                            
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Descripción:
                                </Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                    {contract.description || 'Sin descripción'}
                                </Typography>
                            </Grid>
                            
                            {contract.observations && (
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Observaciones:
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {contract.observations}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>
                </Grid>
                
                {/* Panel derecho con pestañas */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 0 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="contract tabs">
                                <Tab label="Mantenimientos" />
                                <Tab label="Documentos" />
                                <Tab label="Reportes" />
                            </Tabs>
                        </Box>
                        
                        {/* Pestaña de Mantenimientos */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Historial de Mantenimientos
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={handleMaintenanceDialogOpen}
                                >
                                    Registrar
                                </Button>
                            </Box>
                            
                            {maintenanceRecords.length === 0 ? (
                                <Alert severity="info">
                                    No hay registros de mantenimiento para este contrato
                                </Alert>
                            ) : (
                                <List>
                                    {maintenanceRecords.map((record) => (
                                        <ListItem key={record.id} divider>
                                            <ListItemText
                                                primary={`Mantenimiento del ${formatDate(record.date)}`}
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span">
                                                            Estado: {record.status_display}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="body2" component="span">
                                                            Realizado por: {record.performed_by_name || 'No especificado'}
                                                        </Typography>
                                                        {record.notes && (
                                                            <>
                                                                <br />
                                                                <Typography variant="body2" component="span">
                                                                    Observaciones: {record.notes}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            
                            {maintenanceRecords.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="text"
                                        onClick={() => navigate(`/dashboard/contracts/${id}/maintenances`)}
                                    >
                                        Ver todos los mantenimientos
                                    </Button>
                                </Box>
                            )}
                        </TabPanel>
                        
                        {/* Pestaña de Documentos */}
                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Documentos del Contrato
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<CloudUpload />}
                                    onClick={() => navigate(`/dashboard/contracts/${id}/documents/new`)}
                                >
                                    Subir Documento
                                </Button>
                            </Box>
                            
                            {documents.length === 0 ? (
                                <Alert severity="info">
                                    No hay documentos asociados a este contrato
                                </Alert>
                            ) : (
                                <List>
                                    {documents.map((document) => (
                                        <ListItem key={document.id} divider>
                                            <ListItemText
                                                primary={document.title}
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span">
                                                            Subido el: {formatDate(document.uploaded_at)}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="body2" component="span">
                                                            Por: {document.uploaded_by_name || 'No especificado'}
                                                        </Typography>
                                                        {document.description && (
                                                            <>
                                                                <br />
                                                                <Typography variant="body2" component="span">
                                                                    {document.description}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Vista previa">
                                                    <IconButton 
                                                        edge="end" 
                                                        color="primary"
                                                        onClick={() => handlePreviewDocument(document)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Descargar">
                                                    <IconButton 
                                                        edge="end" 
                                                        href={document.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <FileDownload />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            
                            {documents.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="text"
                                        onClick={() => navigate(`/dashboard/contracts/${id}/documents`)}
                                    >
                                        Ver todos los documentos
                                    </Button>
                                </Box>
                            )}
                        </TabPanel>
                        
                        {/* Pestaña de Reportes */}
                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Reportes de Trabajo
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={() => navigate(`/dashboard/contracts/${id}/reports/new`)}
                                >
                                    Nuevo Reporte
                                </Button>
                            </Box>
                            
                            {reports.length === 0 ? (
                                <Alert severity="info">
                                    No hay reportes de trabajo para este contrato
                                </Alert>
                            ) : (
                                <List>
                                    {reports.map((report) => (
                                        <ListItem key={report.id} divider>
                                            <ListItemText
                                                primary={report.title}
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span">
                                                            Fecha: {formatDate(report.date)}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="body2" component="span">
                                                            Estado: {report.is_completed ? 'Completado' : 'Pendiente'}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="body2" component="span">
                                                            Realizado por: {report.performed_by_name || 'No especificado'}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Ver detalle">
                                                    <IconButton 
                                                        edge="end" 
                                                        onClick={() => navigate(`/dashboard/contracts/${id}/reports/${report.id}`)}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            
                            {reports.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="text"
                                        onClick={() => navigate(`/dashboard/contracts/${id}/reports`)}
                                    >
                                        Ver todos los reportes
                                    </Button>
                                </Box>
                            )}
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
            
            {/* Diálogo de Mantenimiento */}
            {openMaintenanceDialog && (
                <MaintenanceForm
                    open={openMaintenanceDialog}
                    onClose={handleMaintenanceDialogClose}
                    contractId={id}
                    onFormSubmit={(formData) => {
                        // Actualizar datos después de guardar el registro
                        loadContractData();
                        setOpenMaintenanceDialog(false);
                    }}
                />
            )}

            {/* Componente de vista previa del documento */}
            <DocumentPreview 
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                document={selectedDocument}
            />
        </Box>
    );
};

// Componente auxiliar para las pestañas
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`contract-tabpanel-${index}`}
            aria-labelledby={`contract-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default ContractDetail;
