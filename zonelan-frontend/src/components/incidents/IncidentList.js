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
    MenuItem,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Visibility, Print } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import incidentService from '../../services/incidentService'; // Añadir esta importación
import ReportDialog from '../reports/ReportDialog';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const IncidentList = () => {
    const [incidents, setIncidents] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [newIncident, setNewIncident] = useState({
        title: '',
        description: '',
        customer: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        resolution_notes: ''
    });
    const [loading, setLoading] = useState(true);

    const STATUS_CHOICES = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'IN_PROGRESS', label: 'En Progreso' },
        { value: 'RESOLVED', label: 'Resuelta' },
        { value: 'CLOSED', label: 'Cerrada' }
    ];

    const PRIORITY_CHOICES = [
        { value: 'LOW', label: 'Baja' },
        { value: 'MEDIUM', label: 'Media' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'CRITICAL', label: 'Crítica' }
    ];

    useEffect(() => {
        fetchIncidents();
        fetchCustomers();
    }, []);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/incidents/incidents/');
            setIncidents(response.data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar las incidencias'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/customers/');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleOpenDialog = (incident = null) => {
        if (incident) {
            setEditMode(true);
            setSelectedIncident(incident);
            setNewIncident({ ...incident });
        } else {
            setEditMode(false);
            setSelectedIncident(null);
            setNewIncident({
                title: '',
                description: '',
                customer: '',
                priority: 'MEDIUM',
                status: 'PENDING',
                resolution_notes: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setSelectedIncident(null);
    };

    const handleInputChange = (e) => {
        setNewIncident({
            ...newIncident,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            // Validación de campos requeridos
            const requiredFields = {
                title: 'Título',
                description: 'Descripción',
                customer: 'Cliente',
                status: 'Estado',
                priority: 'Prioridad'
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([key]) => !newIncident[key])
                .map(([_, label]) => label);

            if (missingFields.length > 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Campos requeridos',
                    text: `Por favor, complete los siguientes campos: ${missingFields.join(', ')}`
                });
                return;
            }

            // Obtener el ID del usuario actual
            const currentUser = authService.getCurrentUser();

            // Formatear los datos antes de enviar
            const incidentData = {
                title: newIncident.title.trim(),
                description: newIncident.description.trim(),
                customer: parseInt(newIncident.customer),
                status: newIncident.status,
                priority: newIncident.priority,
                resolution_notes: newIncident.resolution_notes?.trim() || null,
                reported_by: currentUser.id // Añadir el ID del usuario actual
            };

            console.log('Datos a enviar:', incidentData);

            let result;
            
            // Guardar el estado anterior si estamos editando
            const oldStatus = editMode ? selectedIncident.status : null;

            if (editMode) {
                result = await axios.put(`/incidents/incidents/${selectedIncident.id}/`, incidentData);
                toast.success('Incidencia actualizada correctamente');
            } else {
                result = await axios.post('/incidents/incidents/', incidentData);
                toast.success('Incidencia creada correctamente');
            }
            
            handleCloseDialog();
            fetchIncidents();
            
            // Actualizar el contador de incidencias pendientes
            await updateIncidentCounter(oldStatus, incidentData.status);
            
        } catch (error) {
            console.error('Error detallado:', error.response?.data);
            const errorMessage = error.response?.data?.detail || 
                               Object.values(error.response?.data || {}).flat().join('\n') ||
                               'Error al procesar la operación';
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    const handleViewReports = (incident) => {
        setSelectedIncident(incident);
        setOpenReportDialog(true);
    };

    const handlePrintIncident = async (incident) => {
        try {
            const response = await axios.get(`/reports/reports/?incident=${incident.id}`);
            const reports = response.data;

            const result = await Swal.fire({
                title: 'Seleccione el tipo de informe',
                text: "¿Qué tipo de informe desea generar?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Unificado',
                cancelButtonText: 'Segregado',
                showCloseButton: true
            });

            // Si se cierra el diálogo sin seleccionar una opción
            if (result.isDismissed && !result.dismiss === Swal.DismissReason.cancel) {
                return;
            }

            // Informe Unificado
            if (result.isConfirmed) {
                // Calcular totales
                const totalHours = reports.reduce((sum, report) => sum + (Number(report.hours_worked) || 0), 0);
                
                // Agrupar técnicos únicos
                const uniqueTechnicians = [...new Set(reports.flatMap(report => 
                    report.technicians.map(tech => tech.technician_name)
                ))];

                // Agrupar materiales
                const materialsMap = new Map();
                reports.forEach(report => {
                    report.materials_used.forEach(material => {
                        const current = materialsMap.get(material.material_name) || 0;
                        materialsMap.set(material.material_name, current + material.quantity);
                    });
                });

                const unifiedContent = `
                    <html>
                        <head>
                            <title>Informe Unificado - Incidencia #${incident.id}</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif;
                                    padding: 20px;
                                }
                                .section {
                                    margin-bottom: 20px;
                                    break-inside: avoid;
                                }
                                .section-title {
                                    font-size: 16px;
                                    font-weight: bold;
                                    border-bottom: 1px solid #ccc;
                                    padding-bottom: 5px;
                                    margin-bottom: 10px;
                                }
                                .info-row {
                                    margin: 5px 0;
                                }
                                .info-label {
                                    font-weight: bold;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 10px 0;
                                }
                                th, td {
                                    border: 1px solid #ccc;
                                    padding: 8px;
                                    text-align: left;
                                }
                                @media print {
                                    @page { margin: 2cm; }
                                }
                            </style>
                        </head>
                        <body>
                            <h1>Informe Unificado - Incidencia #${incident.id}</h1>
                            
                            <div class="section">
                                <div class="section-title">Información de la Incidencia</div>
                                <div class="info-row"><span class="info-label">Título:</span> ${incident.title}</div>
                                <div class="info-row"><span class="info-label">Cliente:</span> ${incident.customer_name}</div>
                                <div class="info-row"><span class="info-label">Estado:</span> ${STATUS_CHOICES.find(s => s.value === incident.status)?.label}</div>
                                <div class="info-row"><span class="info-label">Prioridad:</span> ${PRIORITY_CHOICES.find(p => p.value === incident.priority)?.label}</div>
                                <div class="info-row"><span class="info-label">Fecha creación:</span> ${new Date(incident.created_at).toLocaleDateString()}</div>
                                <div class="info-row"><span class="info-label">Descripción:</span> ${incident.description}</div>
                                ${incident.resolution_notes ? `<div class="info-row"><span class="info-label">Notas de resolución:</span> ${incident.resolution_notes}</div>` : ''}
                            </div>

                            <div class="section">
                                <div class="section-title">Resumen del Trabajo</div>
                                <div class="info-row"><span class="info-label">Total Horas Trabajadas:</span> ${totalHours}</div>
                                <div class="info-row"><span class="info-label">Número de Partes:</span> ${reports.length}</div>
                                <div class="info-row"><span class="info-label">Técnicos Involucrados:</span> ${uniqueTechnicians.join(', ')}</div>
                            </div>

                            ${materialsMap.size > 0 ? `
                                <div class="section">
                                    <div class="section-title">Total Materiales Utilizados</div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Material</th>
                                                <th>Cantidad Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${Array.from(materialsMap).map(([material, quantity]) => `
                                                <tr>
                                                    <td>${material}</td>
                                                    <td>${quantity}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </body>
                    </html>
                `;

                const printWindow = window.open('', '_blank');
                printWindow.document.write(unifiedContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            } else {
                // Informe Segregado (el existente)
                const printContent = `
                    <html>
                        <head>
                            <title>Informe de Incidencia #${incident.id}</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif;
                                    padding: 20px;
                                }
                                .section {
                                    margin-bottom: 20px;
                                    break-inside: avoid;
                                }
                                .section-title {
                                    font-size: 16px;
                                    font-weight: bold;
                                    border-bottom: 1px solid #ccc;
                                    padding-bottom: 5px;
                                    margin-bottom: 10px;
                                }
                                .info-row {
                                    margin: 5px 0;
                                }
                                .info-label {
                                    font-weight: bold;
                                }
                                .report {
                                    border: 1px solid #ccc;
                                    padding: 10px;
                                    margin: 10px 0;
                                    break-inside: avoid;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 10px 0;
                                }
                                th, td {
                                    border: 1px solid #ccc;
                                    padding: 8px;
                                    text-align: left;
                                }
                                @media print {
                                    @page { margin: 2cm; }
                                    .report { page-break-inside: avoid; }
                                }
                            </style>
                        </head>
                        <body>
                            <h1>Informe de Incidencia #${incident.id}</h1>
                            
                            <div class="section">
                                <div class="section-title">Información de la Incidencia</div>
                                <div class="info-row"><span class="info-label">Título:</span> ${incident.title}</div>
                                <div class="info-row"><span class="info-label">Cliente:</span> ${incident.customer_name}</div>
                                <div class="info-row"><span class="info-label">Estado:</span> ${STATUS_CHOICES.find(s => s.value === incident.status)?.label}</div>
                                <div class="info-row"><span class="info-label">Prioridad:</span> ${PRIORITY_CHOICES.find(p => p.value === incident.priority)?.label}</div>
                                <div class="info-row"><span class="info-label">Fecha creación:</span> ${new Date(incident.created_at).toLocaleDateString()}</div>
                                <div class="info-row"><span class="info-label">Descripción:</span> ${incident.description}</div>
                                ${incident.resolution_notes ? `<div class="info-row"><span class="info-label">Notas de resolución:</span> ${incident.resolution_notes}</div>` : ''}
                            </div>

                            <div class="section">
                                <div class="section-title">Partes de Trabajo (${reports.length})</div>
                                ${reports.map(report => `
                                    <div class="report">
                                        <div class="info-row"><span class="info-label">Fecha:</span> ${new Date(report.date).toLocaleDateString()}</div>
                                        <div class="info-row"><span class="info-label">Estado:</span> ${report.status === 'DRAFT' ? 'Borrador' : 'Completado'}</div>
                                        <div class="info-row"><span class="info-label">Horas trabajadas:</span> ${report.hours_worked || 'No especificadas'}</div>
                                        <div class="info-row"><span class="info-label">Técnicos:</span> ${report.technicians.map(tech => tech.technician_name).join(', ') || 'Sin asignar'}</div>
                                        <div class="info-row"><span class="info-label">Descripción:</span> ${report.description}</div>
                                        ${report.materials_used.length > 0 ? `
                                            <div class="info-row">
                                                <span class="info-label">Materiales utilizados:</span>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Material</th>
                                                            <th>Cantidad</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${report.materials_used.map(material => `
                                                            <tr>
                                                                <td>${material.material_name}</td>
                                                                <td>${material.quantity}</td>
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </body>
                    </html>
                `;

                const printWindow = window.open('', '_blank');
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        } catch (error) {
            console.error('Error al imprimir:', error);
            toast.error('Error al generar el informe');
        }
    };

    const handleDeleteIncident = async (incident) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "Esta acción no se puede deshacer",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                await axios.delete(`/incidents/incidents/${incident.id}/`);
                toast.success('Incidencia eliminada correctamente');
                fetchIncidents();
                
                // Si la incidencia estaba pendiente o en progreso, actualizar contador
                if (incident.status === 'PENDING' || incident.status === 'IN_PROGRESS') {
                    await incidentService.forceUpdate();
                }
            }
        } catch (error) {
            console.error('Error al eliminar la incidencia:', error);
            toast.error('Error al eliminar la incidencia');
        }
    };

    const columns = [
        {
            field: 'title',
            headerName: 'Título',
            flex: 1,
        },
        {
            field: 'customer_name',
            headerName: 'Cliente',
            flex: 1,
            // Añadir renderCell para manejar posibles valores nulos
            renderCell: (params) => params.value || '-',
        },
        {
            field: 'status',
            headerName: 'Estado',
            flex: 1,
            renderCell: (params) => {
                const status = STATUS_CHOICES.find(s => s.value === params.value);
                return status ? status.label : params.value || '-';
            },
        },
        {
            field: 'priority',
            headerName: 'Prioridad',
            flex: 1,
            renderCell: (params) => {
                const priority = PRIORITY_CHOICES.find(p => p.value === params.value);
                return priority ? priority.label : params.value || '-';
            },
        },
        {
            field: 'created_at',
            headerName: 'Fecha',
            flex: 1,
            renderCell: (params) => {
                if (!params.value) return '-';

                try {
                    const date = new Date(params.value);
                    if (isNaN(date)) return 'Fecha inválida';

                    return date.toLocaleDateString();
                } catch (error) {
                    return 'Fecha inválida';
                }
            },
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 180,
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
                        onClick={() => handleViewReports(params.row)} 
                        size="small"
                        title="Ver reportes"
                    >
                        <Visibility />
                    </IconButton>
                    <IconButton 
                        onClick={() => handlePrintIncident(params.row)} 
                        size="small"
                        title="Imprimir"
                    >
                        <Print />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleDeleteIncident(params.row)} 
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

    // Añadir esta función dentro del componente IncidentList
    const updateIncidentCounter = async (oldStatus, newStatus) => {
        try {
            // Si es una nueva incidencia o si el estado cambia entre pendiente/en progreso y otros estados
            const wasPending = oldStatus === 'PENDING' || oldStatus === 'IN_PROGRESS';
            const isPending = newStatus === 'PENDING' || newStatus === 'IN_PROGRESS';
            
            // Si hay un cambio que afecte al contador, actualizarlo
            if (!oldStatus || wasPending !== isPending) {
                // Actualizar el contador en el Navbar utilizando el servicio
                const newCounts = await incidentService.getPendingIncidentsCount();
                
                // Emitir un evento personalizado que el Navbar pueda escuchar
                const event = new CustomEvent('incidentCountUpdated', { 
                    detail: newCounts 
                });
                window.dispatchEvent(event);
                
                // Opcional: mostrar un toast informativo si todas las incidencias están resueltas
                if (newCounts.total === 0 && (oldStatus === 'PENDING' || oldStatus === 'IN_PROGRESS')) {
                    toast.success('¡Felicidades! Todas las incidencias han sido resueltas.');
                }
            }
        } catch (error) {
            console.error('Error al actualizar el contador de incidencias:', error);
        }
    };

    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Incidencias
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nueva Incidencia
                    </Button>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <Box sx={{ height: 400, width: '100%' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <DataGrid
                                rows={incidents}
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
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Dialog for Incident Create/Edit */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editMode ? 'Editar Incidencia' : 'Crear Nueva Incidencia'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="title"
                        label="Título"
                        value={newIncident.title}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="description"
                        label="Descripción"
                        multiline
                        rows={4}
                        value={newIncident.description}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        select
                        name="customer"
                        label="Cliente"
                        value={newIncident.customer}
                        onChange={handleInputChange}
                    >
                        {customers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        margin="normal"
                        select
                        name="status"
                        label="Estado"
                        value={newIncident.status}
                        onChange={handleInputChange}
                    >
                        {STATUS_CHOICES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                                {status.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        margin="normal"
                        select
                        name="priority"
                        label="Prioridad"
                        value={newIncident.priority}
                        onChange={handleInputChange}
                    >
                        {PRIORITY_CHOICES.map((priority) => (
                            <MenuItem key={priority.value} value={priority.value}>
                                {priority.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    {editMode && (
                        <TextField
                            fullWidth
                            margin="normal"
                            name="resolution_notes"
                            label="Notas de resolución"
                            multiline
                            rows={4}
                            value={newIncident.resolution_notes || ''}
                            onChange={handleInputChange}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Reports */}
            {selectedIncident && (
                <ReportDialog
                    open={openReportDialog}
                    onClose={() => setOpenReportDialog(false)}
                    incident={selectedIncident}
                    onReportSelect={(report) => {
                        setSelectedReport(report);
                        setOpenReportDialog(false);
                    }}
                />
            )}
        </>
    );
};

export default IncidentList;