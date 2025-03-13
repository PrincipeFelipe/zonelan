import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
    Typography, Box, Grid, Chip, Divider, List, ListItem, ListItemText,
    ImageList, ImageListItem, CircularProgress, Tab, Tabs
} from '@mui/material';
import { Close, Person, Assignment, DateRange } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from '../../utils/axiosConfig';
import { getMediaUrl } from '../../utils/helpers';

const ReportDetailModal = ({ open, onClose, reportId }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [openImageDialog, setOpenImageDialog] = useState(false);

    useEffect(() => {
        if (open && reportId) {
            fetchReportDetails(reportId);
        }
    }, [open, reportId]);

    const fetchReportDetails = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/reports/reports/${id}/`);
            setReport(response.data);
        } catch (err) {
            console.error('Error al cargar los detalles del reporte:', err);
            setError('No se pudieron cargar los detalles del reporte');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setOpenImageDialog(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return 'warning';
            case 'COMPLETED': return 'success';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'DRAFT': return 'Borrador';
            case 'COMPLETED': return 'Completado';
            default: return status;
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Detalles del Parte de Trabajo</Typography>
                        <IconButton onClick={onClose}>
                            <Close />
                        </IconButton>
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
                            <Grid container spacing={3} mb={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Assignment fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Parte #{report.id}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <DateRange fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="body2">
                                            {formatDate(report.date)}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={getStatusLabel(report.status)} 
                                        color={getStatusColor(report.status)} 
                                        size="small" 
                                        sx={{ mt: 1 }} 
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Incidencia asociada
                                    </Typography>
                                    {report.incident ? (
                                        <Typography variant="body2" component="div">
                                            #{report.incident} - {report.incident_title || 'Sin título'}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Sin incidencia asociada
                                        </Typography>
                                    )}
                                    
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                        Cliente
                                    </Typography>
                                    <Typography variant="body2">
                                        {report.customer_name || 'No especificado'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />
                            
                            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                                <Tab label="Descripción" />
                                <Tab label="Técnicos" />
                                <Tab label="Materiales" />
                                <Tab label="Imágenes" />
                            </Tabs>

                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Descripción del trabajo
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {report.description || 'Sin descripción'}
                                    </Typography>

                                    <Grid container spacing={2} mt={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Horas trabajadas
                                            </Typography>
                                            <Typography variant="body1">
                                                {report.hours_worked || '0'} h
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Creado por
                                            </Typography>
                                            <Typography variant="body1">
                                                {report.created_by_username || 'No especificado'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Técnicos asignados
                                    </Typography>
                                    
                                    {report.technicians && report.technicians.length > 0 ? (
                                        <List>
                                            {report.technicians.map((tech) => (
                                                <ListItem key={tech.technician}>
                                                    <Box display="flex" alignItems="center">
                                                        <Person fontSize="small" sx={{ mr: 1 }} />
                                                        <ListItemText 
                                                            primary={tech.technician_name || `Técnico ID: ${tech.technician}`} 
                                                        />
                                                    </Box>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay técnicos asignados
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Materiales utilizados
                                    </Typography>
                                    
                                    {report.materials_used && report.materials_used.length > 0 ? (
                                        <List>
                                            {report.materials_used.map((material) => (
                                                <ListItem key={`${material.material}-${material.id}`} divider>
                                                    <ListItemText 
                                                        primary={material.material_name || `Material ID: ${material.material}`}
                                                        secondary={`Cantidad: ${material.quantity}`} 
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No se utilizaron materiales
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {tabValue === 3 && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Imágenes antes
                                    </Typography>
                                    
                                    {report.before_images && report.before_images.length > 0 ? (
                                        <ImageList cols={3} rowHeight={150} sx={{ mb: 2 }}>
                                            {report.before_images.map((image) => (
                                                <ImageListItem 
                                                    key={image.id} 
                                                    onClick={() => handleImageClick(image)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <img
                                                        src={getMediaUrl(image.image)}
                                                        alt={image.description || 'Imagen antes'}
                                                        loading="lazy"
                                                        style={{
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </ImageListItem>
                                            ))}
                                        </ImageList>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            No hay imágenes antes
                                        </Typography>
                                    )}

                                    <Typography variant="subtitle1" gutterBottom>
                                        Imágenes después
                                    </Typography>
                                    
                                    {report.after_images && report.after_images.length > 0 ? (
                                        <ImageList cols={3} rowHeight={150}>
                                            {report.after_images.map((image) => (
                                                <ImageListItem 
                                                    key={image.id} 
                                                    onClick={() => handleImageClick(image)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <img
                                                        src={getMediaUrl(image.image)}
                                                        alt={image.description || 'Imagen después'}
                                                        loading="lazy"
                                                        style={{
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </ImageListItem>
                                            ))}
                                        </ImageList>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay imágenes después
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </>
                    ) : (
                        <Typography color="text.secondary">
                            No se ha encontrado información del reporte
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                    <Button 
                        color="primary" 
                        variant="contained" 
                        href={`/dashboard/reports/${reportId}`}
                    >
                        Consultar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para mostrar imagen ampliada */}
            <Dialog 
                open={openImageDialog} 
                onClose={() => setOpenImageDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent sx={{ p: 0, textAlign: 'center' }}>
                    <IconButton 
                        onClick={() => setOpenImageDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                    >
                        <Close />
                    </IconButton>
                    {selectedImage && (
                        <img
                            src={getMediaUrl(selectedImage.image)}
                            alt={selectedImage.description || 'Imagen ampliada'}
                            style={{ maxWidth: '100%', maxHeight: '90vh' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReportDetailModal;