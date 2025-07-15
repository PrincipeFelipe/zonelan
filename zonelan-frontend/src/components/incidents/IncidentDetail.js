import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Paper, Button, Chip, Grid, Divider, IconButton, 
    CircularProgress, Card, CardContent, useTheme, useMediaQuery 
} from '@mui/material';
import { KeyboardBackspace, Print, Edit } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; // Añadir esta importación
import axios from '../../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReportDialog from '../reports/ReportDialog';
import { useReportCreation } from '../../hooks/useReportCreation';

const IncidentDetail = () => {
    const { createReportFromIncident } = useReportCreation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    
    // Añadir los valores constantes para poder utilizarlos en la función de impresión
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
        fetchIncident();
    }, [id]);

    const fetchIncident = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/incidents/incidents/${id}/`);
            setIncident(response.data);
        } catch (error) {
            console.error('Error al cargar la incidencia:', error);
            toast.error('Error al cargar los datos de la incidencia');
            navigate('/dashboard/incidents');
        } finally {
            setLoading(false);
        }
    };

    const handleViewReports = () => {
        setOpenReportDialog(true);
    };

    // Reemplazar la función handleEditIncident para que coincida con el comportamiento del listado
    const handleEditIncident = () => {
        navigate(`/dashboard/incidents?edit=${id}`);
    };

    // Reemplaza la función handlePrintIncident actual
    const handlePrintIncident = async () => {
        try {
            const response = await axios.get(`/reports/reports/?incident=${id}`);
            const reports = response.data;

            // Preguntar al usuario qué tipo de informe desea generar
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

            // Preparar el contenido HTML según el tipo de informe seleccionado
            let htmlContent = '';

            // Informe Unificado
            if (result.isConfirmed) {
                // Calcular totales
                const totalHours = reports.reduce((sum, report) => sum + (Number(report.hours_worked) || 0), 0);
                
                // Agrupar técnicos únicos
                const uniqueTechnicians = [...new Set(reports.flatMap(report => 
                    report.technicians?.map(tech => tech.technician_name) || []
                ))];

                // Agrupar materiales
                const materialsMap = new Map();
                reports.forEach(report => {
                    report.materials_used?.forEach(material => {
                        const current = materialsMap.get(material.material_name) || 0;
                        materialsMap.set(material.material_name, current + material.quantity);
                    });
                });

                htmlContent = `
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
            } else {
                // Informe Segregado
                htmlContent = `
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
                                        <div class="info-row"><span class="info-label">Observaciones:</span> ${report.observations || 'No especificadas'}</div>
                                        <div class="info-row"><span class="info-label">Técnicos:</span> ${report.technicians?.map(tech => tech.technician_name).join(', ') || 'No especificados'}</div>
                                        
                                        ${report.materials_used?.length > 0 ? `
                                            <div class="info-row"><span class="info-label">Materiales utilizados:</span></div>
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
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </body>
                    </html>
                `;
            }

            // Crear un iframe oculto
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Escribir el contenido HTML en el iframe
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();
            
            // Esperar a que se cargue el contenido
            setTimeout(() => {
                // Lanzar el diálogo de impresión del navegador
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Eliminar el iframe después de un tiempo
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        } catch (error) {
            console.error('Error al imprimir:', error);
            toast.error('Error al generar el informe');
        }
    };

    const getStatusChip = (status) => {
        let label = '';
        let color = '';
        
        switch (status) {
            case 'PENDING':
                label = 'Pendiente';
                color = 'warning';
                break;
            case 'IN_PROGRESS':
                label = 'En Progreso';
                color = 'info';
                break;
            case 'RESOLVED':
                label = 'Resuelta';
                color = 'success';
                break;
            case 'CLOSED':
                label = 'Cerrada';
                color = 'default';
                break;
            default:
                label = status;
                color = 'default';
        }
        
        return <Chip size="small" label={label} color={color} />;
    };

    const getPriorityChip = (priority) => {
        let label = '';
        let color = '';
        
        switch (priority) {
            case 'LOW':
                label = 'Baja';
                color = 'success';
                break;
            case 'MEDIUM':
                label = 'Media';
                color = 'info';
                break;
            case 'HIGH':
                label = 'Alta';
                color = 'warning';
                break;
            case 'CRITICAL':
                label = 'Crítica';
                color = 'error';
                break;
            default:
                label = priority;
                color = 'default';
        }
        
        return <Chip size="small" label={label} color={color} />;
    };

    // Función para determinar si se permite crear nuevos partes
    const canCreateNewReport = (status) => {
        return status !== 'RESOLVED' && status !== 'CLOSED';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!incident) {
        return (
            <Box p={3}>
                <Typography variant="h6">No se encontró la incidencia solicitada</Typography>
                <Button 
                    startIcon={<KeyboardBackspace />} 
                    onClick={() => navigate('/dashboard/incidents')} 
                    sx={{ mt: 2 }}
                >
                    Volver al listado
                </Button>
            </Box>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 2,
                    gap: 1
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 0.5, sm: 1 }
                    }}>
                        <Typography variant={isMobile ? "h6" : "h5"}>
                            Incidencia #{id}
                        </Typography>
                        {incident && (
                            <Chip 
                                label={getStatusLabel(incident.status)} 
                                color={getStatusColor(incident.status)}
                                size={isMobile ? "small" : "medium"}
                            />
                        )}
                    </Box>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        width: { xs: '100%', sm: 'auto' }
                    }}>
                        {/* Botones con fullWidth en móvil */}
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate('/dashboard/incidents')}
                            fullWidth={isMobile}
                            size={isMobile ? "small" : "medium"}
                        >
                            Volver
                        </Button>
                        
                        <Button 
                            startIcon={<Edit />}
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={handleEditIncident}  // Uso de la función actualizada
                        >
                            Editar
                        </Button>
                        <Button 
                            startIcon={<Print />}
                            variant="contained"
                            onClick={handlePrintIncident}  // Uso de la función nueva en lugar de navigate
                        >
                            Imprimir
                        </Button>
                    </Box>
                </Box>
                
                {/* Grid container con dirección de columna en móvil */}
                <Grid container spacing={2} direction={isMobile ? 'column-reverse' : 'row'}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Detalles</Typography>
                                <Box display="flex" gap={1}>
                                    {getStatusChip(incident.status)}
                                    {getPriorityChip(incident.priority)}
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Cliente</Typography>
                                    <Typography variant="body1" gutterBottom>{incident.customer_name}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Fecha de creación</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {format(new Date(incident.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Reportada por</Typography>
                                    <Typography variant="body1" gutterBottom>{incident.reported_by_name || 'No especificado'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Última actualización</Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {format(new Date(incident.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </Typography>
                                </Grid>
                            </Grid>
                            
                            <Box mt={2}>
                                <Typography variant="subtitle2">Descripción</Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                    <Typography variant="body1">{incident.description}</Typography>
                                </Paper>
                            </Box>
                            
                            {incident.resolution_notes && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">Notas de resolución</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                        <Typography variant="body1">{incident.resolution_notes}</Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Partes de trabajo</Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={handleViewReports}
                                >
                                    Ver todos
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            {canCreateNewReport(incident.status) ? (
                                <Box mt={2} display="flex" justifyContent="center">
                                    <Button 
                                        variant="contained" 
                                        onClick={() => createReportFromIncident(id)}
                                    >
                                        Crear nuevo parte
                                    </Button>
                                </Box>
                            ) : (
                                <Box mt={2} p={2} bgcolor="rgba(0, 0, 0, 0.04)" borderRadius={1} textAlign="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No se pueden crear nuevos partes de trabajo para incidencias {incident.status === 'RESOLVED' ? 'resueltas' : 'cerradas'}.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {incident && (
                <ReportDialog
                    open={openReportDialog}
                    onClose={() => setOpenReportDialog(false)}
                    incident={incident}
                    onReportSelect={(reportId) => navigate(`/dashboard/reports/${reportId}`)}
                />
            )}
        </>
    );
};

export default IncidentDetail;