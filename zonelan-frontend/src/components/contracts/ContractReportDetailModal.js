import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, CircularProgress, Grid, Chip,
    Alert, AlertTitle // Añadir estas importaciones
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material'; // Añadir Delete a las importaciones
import axios from '../../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ContractReportDetailModal = ({ open, onClose, reportId }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // Añadir estado para manejo de errores

    useEffect(() => {
        if (open && reportId) {
            fetchReport();
        }
    }, [open, reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null); // Resetear errores al iniciar

            // Añadir parámetro para incluir reportes eliminados
            const response = await axios.get(`/contracts/reports/${reportId}/`, {
                params: { include_deleted: true }
            });

            // Si la respuesta tiene datos, asegurar que is_deleted se interprete correctamente
            if (response.data) {
                const isDeleted = response.data.is_deleted === true || 
                                 response.data.is_deleted === "true" || 
                                 response.data.is_deleted === 1 || 
                                 response.data.is_deleted === "1";
                            
                const reportData = {
                    ...response.data,
                    is_deleted: isDeleted
                };
                setReport(reportData);
            }
        } catch (err) {
            console.error('Error al cargar el reporte de contrato:', err);
            setError('No se pudieron cargar los detalles del reporte de contrato');
        } finally {
            setLoading(false);
        }
    };

    // Función para formatear fechas de manera consistente
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>Detalles del Reporte de Contrato</Typography>
                    <Button 
                        variant="text" 
                        color="inherit" 
                        onClick={onClose}
                        startIcon={<Close />}
                    >
                        Cerrar
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : report ? (
                    <>
                        {/* Mostrar alerta cuando el reporte está eliminado */}
                        {report.is_deleted && (
                            <Alert 
                                severity="warning" 
                                sx={{ mb: 2 }}
                                icon={<Delete color="error" />}
                            >
                                <AlertTitle>Reporte eliminado</AlertTitle>
                                Este reporte de contrato ha sido eliminado
                                {report.deleted_at && (
                                    <> el {formatDate(report.deleted_at)}</>
                                )}.
                            </Alert>
                        )}
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Reporte #{report.id}
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {report.contract_title || `Contrato #${report.contract}`}
                                </Typography>
                            </Grid>
                        
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Fecha
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(report.date)}
                                </Typography>
                            </Grid>
                        
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Estado
                                </Typography>
                                <Chip 
                                    label={report.status_display || (report.status === 'COMPLETED' ? 'Completado' : 'Borrador')} 
                                    color={report.is_deleted ? 'error' : (report.status === 'COMPLETED' ? 'success' : 'default')}
                                    size="small"
                                    variant={report.is_deleted ? "outlined" : "filled"}
                                />
                            </Grid>
                        
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Realizado por
                                </Typography>
                                <Typography variant="body1">
                                    {report.performed_by_name || '-'}
                                </Typography>
                            </Grid>
                        
                            {report.hours_worked && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Horas trabajadas
                                    </Typography>
                                    <Typography variant="body1">
                                        {report.hours_worked}
                                    </Typography>
                                </Grid>
                            )}
                        
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Descripción
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {report.description}
                                </Typography>
                            </Grid>
                        
                            {report.technicians && report.technicians.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Técnicos asignados
                                    </Typography>
                                    {report.technicians.map((tech, index) => (
                                        <Box key={index} sx={{ mb: 1, display: 'flex' }}>
                                            <Typography variant="body1">
                                                {tech.technician_name || `Técnico #${tech.technician}`}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            )}
                        
                            {report.materials_used && report.materials_used.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Materiales utilizados
                                    </Typography>
                                    {report.materials_used.map((material, index) => (
                                        <Box key={index} sx={{ mb: 1, display: 'flex' }}>
                                            <Typography variant="body1">
                                                {material.material_name}: {material.quantity} unidad(es)
                                            </Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                    </>
                ) : (
                    <Typography>No se pudo cargar la información del reporte de contrato</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContractReportDetailModal;