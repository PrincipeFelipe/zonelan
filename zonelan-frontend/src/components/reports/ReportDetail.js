import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ImageList,
    ImageListItem,
    Dialog,
    DialogContent,
    IconButton as MuiIconButton,
    Chip
} from '@mui/material';
import { Delete, Edit, ArrowBack, Close, NavigateNext, NavigateBefore, Print } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { getMediaUrl } from '../../utils/axiosConfig';
import { toast, Toaster } from 'react-hot-toast';

const ReportDetail = () => {
    const [report, setReport] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            const response = await axios.get(`/reports/reports/${id}/`, {
                params: { include_deleted: true }
            });
            
            if (response.data) {
                // Asegurar que is_deleted se interprete correctamente
                const reportData = {
                    ...response.data,
                    is_deleted: Boolean(response.data.is_deleted)
                };
                setReport(reportData);
            } else {
                navigate('/dashboard/reports');
                toast.error('Parte no encontrado');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            navigate('/dashboard/reports');
            toast.error('Error al cargar el parte');
        }
    };

    const handleImageClick = (image, index, type) => {
        setSelectedImage(image);
        setCurrentImageIndex(index);
        setOpenImageDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenImageDialog(false);
        setSelectedImage(null);
    };

    const handleNextImage = (type) => {
        const images = type === 'BEFORE' ? report.before_images : report.after_images;
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setSelectedImage(images[(currentImageIndex + 1) % images.length]);
    };

    const handlePreviousImage = (type) => {
        const images = type === 'BEFORE' ? report.before_images : report.after_images;
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        setSelectedImage(images[(currentImageIndex - 1 + images.length) % images.length]);
    };

    const handlePrint = () => {
        const printContent = `
            <html>
                <head>
                    <title>Parte de trabajo #${report.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .section { margin-bottom: 20px; }
                        .section-title { 
                            font-size: 16px; 
                            font-weight: bold;
                            border-bottom: 1px solid #ccc;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .info-row { margin: 5px 0; }
                        .info-label { font-weight: bold; }
                        @media print {
                            @page { margin: 2cm; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Parte de trabajo #${report.id}</h1>
                    
                    <div class="section">
                        <div class="section-title">Información general</div>
                        <div class="info-row"><span class="info-label">Incidencia:</span> ${report.incident_title}</div>
                        <div class="info-row"><span class="info-label">Cliente:</span> ${report.customer_name}</div>
                        <div class="info-row"><span class="info-label">Fecha:</span> ${new Date(report.date).toLocaleDateString()}</div>
                        <div class="info-row"><span class="info-label">Estado:</span> ${report.status === 'DRAFT' ? 'Borrador' : 'Completado'}</div>
                        <div class="info-row"><span class="info-label">Horas trabajadas:</span> ${report.hours_worked || 'No especificadas'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">Descripción del trabajo</div>
                        <div>${report.description}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">Técnicos asignados</div>
                        ${report.technicians.map(tech => `
                            <div class="info-row">${tech.technician_name}</div>
                        `).join('')}
                    </div>

                    <div class="section">
                        <div class="section-title">Materiales utilizados</div>
                        ${report.materials_used.map(material => `
                            <div class="info-row">
                                ${material.material_name} - Cantidad: ${material.quantity}
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
    };

    // Si tienes la funcionalidad de eliminar imágenes desde la vista detalle
    const handleDeleteImage = async (type, imageId) => {
        try {
            // Eliminar la imagen del servidor
            await axios.delete(`/reports/delete-image/${imageId}/`);
            
            // Actualizar el estado local
            if (type === 'BEFORE') {
                setReport(prev => ({
                    ...prev,
                    before_images: prev.before_images.filter(img => img.id !== imageId)
                }));
            } else {
                setReport(prev => ({
                    ...prev,
                    after_images: prev.after_images.filter(img => img.id !== imageId)
                }));
            }
            
            toast.success('Imagen eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            toast.error('Error al eliminar la imagen');
        }
    };

    const isReportDeleted = Boolean(report?.is_deleted);

    if (!report) return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Cargando parte de trabajo...</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 2 }}>
            <Toaster position="top-right" />
            
            {/* Banner para reportes eliminados */}
            {isReportDeleted && (
                <Paper 
                    sx={{ 
                        p: 1.5, 
                        mb: 3, 
                        backgroundColor: '#ffebee', 
                        borderLeft: '5px solid #d32f2f',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Delete color="error" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="error">
                            REPORTE ELIMINADO
                            {report.deleted_at && (
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                    el {new Date(report.deleted_at).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Typography>
                            )}
                        </Typography>
                    </Box>
                    <Button 
                        variant="outlined" 
                        color="error"
                        size="small" 
                        onClick={() => navigate('/dashboard/reports')}
                    >
                        Volver a la lista
                    </Button>
                </Paper>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/dashboard/reports')}
                    >
                        Volver
                    </Button>
                    <Typography variant="h6">
                        Parte #{report.id}
                    </Typography>
                    <Chip 
                        label={report.status === 'DRAFT' ? 'Borrador' : 'Completado'} 
                        color={report.status === 'DRAFT' ? 'warning' : 'success'}
                        size="small"
                    />
                    {isReportDeleted && (
                        <Chip 
                            label="Eliminado" 
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
                
                <Box>
                    {!isReportDeleted && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/dashboard/reports/edit/${report.id}`)}
                            sx={{ mr: 1 }}
                        >
                            Editar
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                    >
                        Imprimir
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Información general
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography><strong>Incidencia:</strong> {report.incident_title}</Typography>
                        <Typography><strong>Cliente:</strong> {report.customer_name}</Typography>
                        <Typography><strong>Fecha:</strong> {new Date(report.date).toLocaleDateString()}</Typography>
                        <Typography><strong>Estado:</strong> {report.status === 'DRAFT' ? 'Borrador' : 'Completado'}</Typography>
                        <Typography><strong>Horas trabajadas:</strong> {report.hours_worked || 'No especificadas'}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Descripción del trabajo
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography>{report.description}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Técnicos asignados
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <List>
                            {report.technicians.map((tech) => (
                                <ListItem key={tech.id}>
                                    <ListItemText primary={tech.technician_name} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Materiales utilizados
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <List>
                            {report.materials_used.map((material) => (
                                <ListItem key={material.id}>
                                    <ListItemText 
                                        primary={material.material_name}
                                        secondary={`Cantidad: ${material.quantity}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Imágenes
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                            Antes
                        </Typography>
                        <ImageList 
                            cols={3} 
                            rowHeight={150}
                            sx={{
                                mb: 2,
                                gap: '8px !important',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, 150px) !important'
                            }}
                        >
                            {report.before_images && report.before_images.map((image, index) => (
                                <ImageListItem 
                                    key={image.id}
                                    onClick={() => handleImageClick(image, index, 'BEFORE')}
                                    sx={{ 
                                        cursor: 'pointer',
                                        width: '150px !important',
                                        height: '150px !important',
                                        '&:hover': {
                                            opacity: 0.8,
                                            transition: 'opacity 0.2s'
                                        }
                                    }}
                                >
                                    <img
                                        src={getMediaUrl(image.image)}
                                        alt={image.description || 'Imagen antes'}
                                        loading="lazy"
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            Después
                        </Typography>
                        <ImageList 
                            cols={3} 
                            rowHeight={150}
                            sx={{
                                mb: 2,
                                gap: '8px !important',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, 150px) !important'
                            }}
                        >
                            {report.after_images && report.after_images.map((image, index) => (
                                <ImageListItem 
                                    key={image.id}
                                    onClick={() => handleImageClick(image, index, 'AFTER')}
                                    sx={{ 
                                        cursor: 'pointer',
                                        width: '150px !important',
                                        height: '150px !important',
                                        '&:hover': {
                                            opacity: 0.8,
                                            transition: 'opacity 0.2s'
                                        }
                                    }}
                                >
                                    <img
                                        src={getMediaUrl(image.image)}
                                        alt={image.description || 'Imagen después'}
                                        loading="lazy"
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog
                open={openImageDialog}
                onClose={handleCloseDialog}
                maxWidth={false}
                fullScreen
            >
                <DialogContent 
                    sx={{ 
                        position: 'relative', 
                        p: 0, 
                        bgcolor: 'black',
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <MuiIconButton
                        onClick={handleCloseDialog}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)'
                            },
                            zIndex: 1
                        }}
                    >
                        <Close />
                    </MuiIconButton>

                    <MuiIconButton
                        onClick={() => handlePreviousImage(selectedImage?.image_type)}
                        sx={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)'
                            },
                            zIndex: 1
                        }}
                    >
                        <NavigateBefore />
                    </MuiIconButton>

                    <MuiIconButton
                        onClick={() => handleNextImage(selectedImage?.image_type)}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)'
                            },
                            zIndex: 1
                        }}
                    >
                        <NavigateNext />
                    </MuiIconButton>

                    {selectedImage && (
                        <img
                            src={getMediaUrl(selectedImage.image)}
                            alt={selectedImage.description || 'Imagen a pantalla completa'}
                            style={{
                                maxWidth: '90%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                userSelect: 'none'
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ReportDetail;