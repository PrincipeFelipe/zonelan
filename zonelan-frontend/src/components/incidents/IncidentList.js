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
    CircularProgress,
    Chip,
    Divider,
    Grid,
    Card,
    CardContent,
    Tooltip // Añadir esta importación
} from '@mui/material';
import { Edit, Delete, Add, Visibility, Print, Close, KeyboardBackspace } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import incidentService from '../../services/incidentService'; // Añadir esta importación
import ReportDialog from '../reports/ReportDialog';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReportCreation } from '../../hooks/useReportCreation';

const IncidentList = () => {
    const { createReportFromIncident } = useReportCreation();
    
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
    const [openIncidentDetailDialog, setOpenIncidentDetailDialog] = useState(false);
    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [incidentReports, setIncidentReports] = useState([]);
    const navigate = useNavigate();

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

    // Usar React Router para detectar parámetros en la URL
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const editIncidentId = params.get('edit');

    useEffect(() => {
        fetchIncidents();
        fetchCustomers();
        
        // Si hay un ID de incidencia para editar en los parámetros
        if (editIncidentId) {
            const fetchIncidentToEdit = async () => {
                try {
                    const response = await axios.get(`/incidents/incidents/${editIncidentId}/`);
                    if (response.data) {
                        handleOpenDialog(response.data);
                    }
                } catch (error) {
                    console.error('Error al cargar incidencia para editar:', error);
                    toast.error('No se pudo cargar la incidencia para editar');
                }
            };
            
            fetchIncidentToEdit();
        }
    }, [editIncidentId]);

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

    const handleViewIncidentDetail = async (incident) => {
        try {
            setSelectedIncidentDetail(incident);
            setLoadingDetail(true);
            setOpenIncidentDetailDialog(true);
            
            // Obtener los reportes asociados a la incidencia
            const response = await axios.get(`/reports/reports/?incident=${incident.id}`);
            
            if (Array.isArray(response.data)) {
                setIncidentReports(response.data);
            } else if (response.data.results && Array.isArray(response.data.results)) {
                setIncidentReports(response.data.results);
            } else {
                setIncidentReports([]);
                console.error('Formato de respuesta inesperado:', response.data);
            }
        } catch (error) {
            console.error('Error al cargar los detalles de la incidencia:', error);
            toast.error('Error al cargar los detalles de la incidencia');
            setIncidentReports([]);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Actualizar las columnas para mejorar la presentación

const columns = [
    {
        field: 'id',
        headerName: 'ID',
        width: 70,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                <Typography variant="body2" fontWeight="500" color="primary">
                    #{params.value}
                </Typography>
            </Box>
        ),
    },
    { 
        field: 'title',
        headerName: 'Título',
        flex: 1,
        width: 200,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
                <Typography variant="body2" fontWeight="500">
                    {params.value}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'customer_name',
        headerName: 'Cliente',
        width: 300,
        renderCell: (params) => {
            const customer = customers.find(c => c.id === params.row.customer);
            
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
                    <Typography variant="body2">
                        {params.value}
                    </Typography>
                    {customer?.business_name && (
                        <Typography variant="caption" color="text.secondary">
                            {customer.business_name}
                        </Typography>
                    )}
                </Box>
            );
        },
    },
    {
        field: 'status',
        headerName: 'Estado',
        width: 120,
        renderCell: (params) => {
            const statusMap = {
                'PENDING': { label: 'Pendiente', color: '#ed6c02', border: '#ed6c02' },
                'IN_PROGRESS': { label: 'En Progreso', color: '#0288d1', border: '#0288d1' },
                'RESOLVED': { label: 'Resuelta', color: '#2e7d32', border: '#2e7d32' },
                'CLOSED': { label: 'Cerrada', color: '#616161', border: '#616161' }
            };
            
            const statusConfig = statusMap[params.value] || { label: params.value, color: '#757575', border: '#757575' };
            
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Chip
                        size="small"
                        label={statusConfig.label}
                        sx={{
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.border}`,
                            backgroundColor: 'transparent',
                            fontWeight: 500
                        }}
                        variant="outlined"
                    />
                </Box>
            );
        }
    },
    {
        field: 'priority',
        headerName: 'Prioridad',
        width: 120,
        renderCell: (params) => {
            const priorityMap = {
                'LOW': { label: 'Baja', color: '#2e7d32', border: '#2e7d32' },
                'MEDIUM': { label: 'Media', color: '#0288d1', border: '#0288d1' },
                'HIGH': { label: 'Alta', color: '#ed6c02', border: '#ed6c02' },
                'CRITICAL': { label: 'Crítica', color: '#d32f2f', border: '#d32f2f' }
            };
            
            const priorityConfig = priorityMap[params.value] || { label: params.value, color: '#757575', border: '#757575' };
            
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                    <Chip
                        size="small"
                        label={priorityConfig.label}
                        sx={{
                            color: priorityConfig.color,
                            border: `1px solid ${priorityConfig.border}`,
                            backgroundColor: 'transparent',
                            fontWeight: 500
                        }}
                        variant="outlined"
                    />
                </Box>
            );
        }
    },
    {
        field: 'created_at',
        headerName: 'Fecha',
        width: 120,
        renderCell: (params) => {
            if (!params.value) return '-';

            try {
                const date = new Date(params.value);
                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                // Determinar si la fecha es reciente (menos de 3 días)
                const isRecent = diffDays < 3;
                
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
                        <Typography variant="body2">
                            {format(date, 'dd/MM/yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {format(date, 'HH:mm')}
                        </Typography>
                    </Box>
                );
            } catch (error) {
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
                        <Typography variant="body2">Fecha inválida</Typography>
                    </Box>
                );
            }
        },
    },
    {
        field: 'actions',
        headerName: 'Acciones',
        width: 140,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                gap: '4px',
                '& .MuiIconButton-root': {
                    padding: '4px',
                    fontSize: '0.875rem',
                }
            }}>
                <Tooltip title="Editar">
                    <IconButton 
                        onClick={() => handleOpenDialog(params.row)} 
                        size="small"
                        sx={{ color: 'primary.main' }}
                    >
                        <Edit fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Ver detalle">
                    <IconButton 
                        onClick={() => handleViewIncidentDetail(params.row)} 
                        size="small"
                        sx={{ color: 'info.main' }}
                    >
                        <Visibility fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Imprimir">
                    <IconButton 
                        onClick={() => handlePrintIncident(params.row)} 
                        size="small"
                        sx={{ color: 'text.secondary' }}
                    >
                        <Print fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                    <IconButton 
                        onClick={() => handleDeleteIncident(params.row)} 
                        size="small"
                        sx={{ color: 'error.main' }}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
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

    // Función para determinar si se permite crear nuevos partes
    const canCreateNewReport = (status) => {
        return status !== 'RESOLVED' && status !== 'CLOSED';
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
                            // Actualizar el DataGrid para asegurar un centrado vertical consistente

<DataGrid
    rows={incidents}
    columns={columns}
    initialState={{
        pagination: {
            paginationModel: { pageSize: 10, page: 0 },
        },
        sorting: {
            sortModel: [{ field: 'created_at', sort: 'desc' }],
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
        border: '1px solid #E0E0E0',
        borderRadius: 1,
        '& .MuiDataGrid-row': {
            borderBottom: '1px solid #F5F5F5',
        },
        '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#F5F5F5',
            borderRight: '1px solid #E0E0E0',
            '&:last-child': {
                borderRight: 'none',
            },
        },
        '& .MuiDataGrid-cell': {
            borderRight: '1px solid #F5F5F5',
            '&:last-child': {
                borderRight: 'none',
            },
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center', // Centrado vertical para todas las celdas
            '& .MuiBox-root': {
                width: '100%' // Asegurar que todos los contenedores Box ocupen el ancho completo
            }
        },
        '& .MuiDataGrid-columnHeaders': {
            borderBottom: '2px solid #E0E0E0',
            fontSize: '0.875rem',
            fontWeight: 'bold',
        },
        '& .MuiDataGrid-toolbarContainer': {
            borderBottom: '1px solid #E0E0E0',
            padding: '8px 16px',
        },
        '& .MuiDataGrid-footerContainer': {
            borderTop: '2px solid #E0E0E0',
        },
        '& .MuiDataGrid-virtualScroller': {
            backgroundColor: '#FFFFFF',
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
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

            {/* Diálogo para mostrar el detalle de la incidencia */}
            <Dialog 
                open={openIncidentDetailDialog} 
                onClose={() => setOpenIncidentDetailDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                            <Typography variant="h6">
                                Incidencia #{selectedIncidentDetail?.id}: {selectedIncidentDetail?.title}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setOpenIncidentDetailDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {loadingDetail ? (
                        <Box display="flex" justifyContent="center" mt={3} mb={3}>
                            <CircularProgress />
                        </Box>
                    ) : selectedIncidentDetail ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={7}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">Detalles</Typography>
                                        <Box display="flex" gap={1}>
                                            {renderStatusChip(selectedIncidentDetail.status)}
                                            {renderPriorityChip(selectedIncidentDetail.priority)}
                                        </Box>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Cliente</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedIncidentDetail.customer_name}
                                                {customers.find(c => c.id === selectedIncidentDetail.customer)?.business_name && (
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        {customers.find(c => c.id === selectedIncidentDetail.customer)?.business_name}
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Fecha de creación</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {format(new Date(selectedIncidentDetail.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Reportada por</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedIncidentDetail.reported_by_name || 'No especificado'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Última actualización</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {format(new Date(selectedIncidentDetail.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    
                                    <Box mt={2}>
                                        <Typography variant="subtitle2">Descripción</Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                            <Typography variant="body1">{selectedIncidentDetail.description}</Typography>
                                        </Paper>
                                    </Box>
                                    
                                    {selectedIncidentDetail.resolution_notes && (
                                        <Box mt={2}>
                                            <Typography variant="subtitle2">Notas de resolución</Typography>
                                            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                                <Typography variant="body1">{selectedIncidentDetail.resolution_notes}</Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={5}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">Partes de trabajo ({incidentReports.length})</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    {incidentReports.length > 0 ? (
                                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                            {incidentReports.map((report) => (
                                                <Card key={report.id} sx={{ mb: 2 }}>
                                                    <CardContent>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                Parte #{report.id}
                                                            </Typography>
                                                            <Chip 
                                                                size="small" 
                                                                label={report.status === 'DRAFT' ? 'Borrador' : 'Completado'} 
                                                                color={report.status === 'DRAFT' ? 'warning' : 'success'} 
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Fecha: {format(new Date(report.date), 'dd/MM/yyyy', { locale: es })}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Horas trabajadas: {report.hours_worked || 'No especificado'}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Técnicos: {report.technicians?.map(t => t.technician_name).join(', ') || 'Sin asignar'}
                                                        </Typography>
                                                        <Box mt={1}>
                                                            <Button 
                                                                size="small" 
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    setOpenIncidentDetailDialog(false);
                                                                    navigate(`/dashboard/reports/${report.id}`);
                                                                }}
                                                            >
                                                                Ver parte
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body1" align="center" py={3}>
                                            No hay partes de trabajo registrados para esta incidencia.
                                        </Typography>
                                    )}
                                    
                                    {canCreateNewReport(selectedIncidentDetail.status) ? (
                                        <Box mt={2} display="flex" justifyContent="center">
                                            <Button 
                                                variant="contained" 
                                                onClick={() => {
                                                    setOpenIncidentDetailDialog(false);
                                                    createReportFromIncident(selectedIncidentDetail.id);
                                                }}
                                            >
                                                Crear nuevo parte
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box mt={2} p={2} bgcolor="rgba(0, 0, 0, 0.04)" borderRadius={1} textAlign="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No se pueden crear nuevos partes de trabajo para incidencias {selectedIncidentDetail.status === 'RESOLVED' ? 'resueltas' : 'cerradas'}.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography variant="body1" align="center" py={3}>
                            Error al cargar los detalles de la incidencia.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="outlined" 
                        startIcon={<Edit />}
                        onClick={() => {
                            setOpenIncidentDetailDialog(false);
                            handleOpenDialog(selectedIncidentDetail);
                        }}
                    >
                        Editar
                    </Button>
                    <Button 
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => {
                            setOpenIncidentDetailDialog(false);
                            handlePrintIncident(selectedIncidentDetail);
                        }}
                    >
                        Imprimir
                    </Button>
                    <Button onClick={() => setOpenIncidentDetailDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
    
    // Funciones de ayuda para renderizar chips de estado y prioridad
    function renderStatusChip(status) {
        const statusMap = {
            'PENDING': { label: 'Pendiente', color: '#ed6c02', border: '#ed6c02' },
            'IN_PROGRESS': { label: 'En Progreso', color: '#0288d1', border: '#0288d1' },
            'RESOLVED': { label: 'Resuelta', color: '#2e7d32', border: '#2e7d32' },
            'CLOSED': { label: 'Cerrada', color: '#616161', border: '#616161' }
        };
        
        const statusConfig = statusMap[status] || { label: status, color: '#757575', border: '#757575' };
        
        return (
            <Chip
                size="small"
                label={statusConfig.label}
                sx={{
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.border}`,
                    backgroundColor: 'transparent',
                    fontWeight: 500
                }}
                variant="outlined"
            />
        );
    }

    function renderPriorityChip(priority) {
        const priorityMap = {
            'LOW': { label: 'Baja', color: '#2e7d32', border: '#2e7d32' },
            'MEDIUM': { label: 'Media', color: '#0288d1', border: '#0288d1' },
            'HIGH': { label: 'Alta', color: '#ed6c02', border: '#ed6c02' },
            'CRITICAL': { label: 'Crítica', color: '#d32f2f', border: '#d32f2f' }
        };
        
        const priorityConfig = priorityMap[priority] || { label: priority, color: '#757575', border: '#757575' };
        
        return (
            <Chip
                size="small"
                label={priorityConfig.label}
                sx={{
                    color: priorityConfig.color,
                    border: `1px solid ${priorityConfig.border}`,
                    backgroundColor: 'transparent',
                    fontWeight: 500
                }}
                variant="outlined"
            />
        );
    }
};

export default IncidentList;