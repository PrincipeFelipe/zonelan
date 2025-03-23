import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, CircularProgress, Grid, Chip
} from '@mui/material';
import { Close } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ContractReportDetailModal = ({ open, onClose, reportId }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && reportId) {
            fetchReport();
        }
    }, [open, reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/contracts/reports/${reportId}/`);
            setReport(response.data);
        } catch (error) {
            console.error('Error al cargar el reporte de contrato:', error);
        } finally {
            setLoading(false);
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
                ) : report ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Contrato
                            </Typography>
                            <Typography variant="body1">
                                {report.contract_title || `#${report.contract}`}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Fecha
                            </Typography>
                            <Typography variant="body1">
                                {format(new Date(report.date), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Estado
                            </Typography>
                            <Chip 
                                label={report.status_display} 
                                color={report.status === 'COMPLETED' ? 'success' : 'default'}
                                size="small"
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