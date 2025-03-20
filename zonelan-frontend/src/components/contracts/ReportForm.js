import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Dialog,
    DialogContent,
    IconButton as MuiIconButton,
    Autocomplete,
    Chip,
    CircularProgress
} from '@mui/material';
import { Add, Delete, Save, ArrowBack, Close, NavigateNext, NavigateBefore, DeleteOutline, Restore as RestoreIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import axios, { getMediaUrl } from '../../utils/axiosConfig';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';
import LocationSelector from '../materials/LocationSelector';

const ReportForm = () => {
    const { id, reportId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = Boolean(reportId);
    
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState({
        date: new Date().toISOString().split('T')[0],
        contract: id,
        description: '',
        hours_worked: '',
        status: 'DRAFT',
        technicians: [],
        materials_used: [],
        before_images: [],
        after_images: []
    });

    const [technicians, setTechnicians] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState({ 
        material: '', 
        quantity: 1,
        materialObject: null
    });
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [beforeImages, setBeforeImages] = useState([]);
    const [afterImages, setAfterImages] = useState([]);
    const [selectedBeforeImages, setSelectedBeforeImages] = useState([]);
    const [selectedAfterImages, setSelectedAfterImages] = useState([]);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [originalReport, setOriginalReport] = useState(null);
    const [openLocationSelector, setOpenLocationSelector] = useState(false);
    const [pendingMaterial, setPendingMaterial] = useState(null);

    const isReportDeleted = Boolean(report?.is_deleted || originalReport?.is_deleted);

    useEffect(() => {
        fetchTechnicians();
        fetchMaterials();
        
        if (isEditMode) {
            fetchReport();
        }
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/contracts/reports/${reportId}/`, {
                params: { include_deleted: true }
            });
            
            if (response.data) {
                // Asegurar correcta interpretación de is_deleted
                const isDeleted = response.data.is_deleted === true || 
                                response.data.is_deleted === "true" || 
                                response.data.is_deleted === 1 || 
                                response.data.is_deleted === "1";
                
                // IMPORTANTE: Asegúrate de que todos los arrays existen
                setReport({
                    date: response.data.date || new Date().toISOString().split('T')[0],
                    contract: response.data.contract || id,
                    description: response.data.description || '',
                    hours_worked: response.data.hours_worked || '',
                    status: response.data.status || 'DRAFT',
                    is_deleted: isDeleted,
                    // IMPORTANTE: Asegúrate de que estos sean arrays incluso si son undefined en response.data
                    technicians: Array.isArray(response.data.technicians) ? response.data.technicians : [],
                    materials_used: Array.isArray(response.data.materials_used) ? response.data.materials_used : []
                });
                
                // Actualizar las imágenes - asegúrate de que siempre son arrays
                setBeforeImages(Array.isArray(response.data.before_images) 
                    ? response.data.before_images 
                    : []
                );
                setAfterImages(Array.isArray(response.data.after_images) 
                    ? response.data.after_images 
                    : []
                );
                
                // Guardar el reporte original para comparar cambios
                setOriginalReport(response.data);
            }
        } catch (error) {
            console.error('Error al cargar el reporte:', error);
            toast.error('Error al cargar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get('/users/');
            setTechnicians(response.data);
        } catch (error) {
            console.error('Error al cargar técnicos:', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await axios.get('/materials/materials/');
            setMaterials(response.data);
        } catch (error) {
            console.error('Error al cargar materiales:', error);
        }
    };

    const handleInputChange = (e) => {
        setReport({
            ...report,
            [e.target.name]: e.target.value
        });
    };

    const handleAddMaterial = () => {
        if (!selectedMaterial.material || selectedMaterial.quantity < 1) {
            toast.error('Seleccione un material y una cantidad válida');
            return;
        }

        const materialExists = report.materials_used.some(
            m => m.material === selectedMaterial.material
        );

        if (materialExists) {
            toast.error('Este material ya ha sido añadido');
            return;
        }

        // Verificar stock disponible
        const materialObject = materials.find(m => m.id === selectedMaterial.material);
        if (materialObject && selectedMaterial.quantity > materialObject.quantity) {
            toast.error(`Stock insuficiente. Disponible: ${materialObject.quantity}`);
            return;
        }

        // Guardar el material pendiente y abrir selector de ubicación
        setPendingMaterial({
            material: selectedMaterial.material,
            quantity: selectedMaterial.quantity,
            materialObject
        });
        setOpenLocationSelector(true);
    };

    const handleLocationSelected = (location) => {
        if (!pendingMaterial) return;
        
        // Actualizar el estado con el nuevo material y la ubicación seleccionada
        setReport(prev => ({
            ...prev,
            materials_used: [...prev.materials_used, {
                material: pendingMaterial.material,
                quantity: pendingMaterial.quantity,
                location_id: location.id,
                location_name: `${location.warehouse_name} > ${location.department_name} > ${location.shelf_name} > ${location.tray_name}`
            }]
        }));
        
        // Resetear el selector de materiales
        setSelectedMaterial({ 
            material: '', 
            quantity: 1,
            materialObject: null
        });
        
        // Limpiar material pendiente y cerrar selector
        setPendingMaterial(null);
        setOpenLocationSelector(false);
    };

    const handleRemoveMaterial = (materialId) => {
        setReport({
            ...report,
            materials_used: report.materials_used.filter(m => m.material !== materialId)
        });
    };

    const handleAddTechnician = () => {
        if (!selectedTechnician) {
            toast.error('Seleccione un técnico');
            return;
        }

        const technicianExists = report.technicians.some(
            t => t.technician === selectedTechnician
        );

        if (technicianExists) {
            toast.error('Este técnico ya ha sido añadido');
            return;
        }

        // Actualizar el estado con el nuevo técnico
        setReport(prev => ({
            ...prev,
            technicians: [...prev.technicians, { technician: selectedTechnician }]
        }));
        setSelectedTechnician('');
    };

    const handleRemoveTechnician = (technicianId) => {
        setReport({
            ...report,
            technicians: report.technicians.filter(t => t.technician !== technicianId)
        });
    };

    const handleImageSelect = (type) => (event) => {
        const files = Array.from(event.target.files);
        const imageFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: type
        }));

        if (type === 'BEFORE') {
            setSelectedBeforeImages(prev => [...prev, ...imageFiles]);
        } else {
            setSelectedAfterImages(prev => [...prev, ...imageFiles]);
        }
    };

    const handleRemoveSelectedImage = (type, index) => {
        if (type === 'BEFORE') {
            setSelectedBeforeImages(prev => {
                const newImages = [...prev];
                URL.revokeObjectURL(newImages[index].preview);
                newImages.splice(index, 1);
                return newImages;
            });
        } else {
            setSelectedAfterImages(prev => {
                const newImages = [...prev];
                URL.revokeObjectURL(newImages[index].preview);
                newImages.splice(index, 1);
                return newImages;
            });
        }
    };

    const handleRemoveImage = (type, imageId) => {
        // Marcar la imagen para eliminación al guardar
        setImagesToDelete([...imagesToDelete, imageId]);
        
        // Ocultar la imagen de la interfaz, pero sin eliminarla del servidor aún
        if (type === 'BEFORE') {
            setBeforeImages(prevImages => prevImages.filter(img => img.id !== imageId));
        } else {
            setAfterImages(prevImages => prevImages.filter(img => img.id !== imageId));
        }
        
        // Mostrar notificación de que la imagen será eliminada al guardar
        toast.success('La imagen será eliminada cuando guardes el reporte', {
            duration: 3000,
            icon: '🗑️'
        });
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
        const images = type === 'BEFORE' ? beforeImages : afterImages;
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setSelectedImage(images[(currentImageIndex + 1) % images.length]);
    };

    const handlePreviousImage = (type) => {
        const images = type === 'BEFORE' ? beforeImages : afterImages;
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        setSelectedImage(images[(currentImageIndex - 1 + images.length) % images.length]);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Validaciones
            const validationErrors = [];
            
            if (!report.date) {
                validationErrors.push('La fecha es obligatoria');
            }
            
            if (!report.description) {
                validationErrors.push('La descripción es obligatoria');
            }
            
            // Validaciones específicas para estado COMPLETED
            if (report.status === 'COMPLETED') {
                if (!report.hours_worked || report.hours_worked <= 0) {
                    validationErrors.push('Debe especificar las horas trabajadas');
                }
                if (!report.technicians || report.technicians.length === 0) {
                    validationErrors.push('Debe asignar al menos un técnico');
                }
            }
            
            if (validationErrors.length > 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    html: validationErrors.map(error => `• ${error}`).join('<br>'),
                    confirmButtonText: 'Entendido'
                });
                setLoading(false);
                return;
            }

            // Informar al usuario si hay cambios en los materiales en caso de edición
            if (isEditMode) {
                const originalMaterials = originalReport?.materials_used || [];
                const currentMaterials = report.materials_used;
                
                // Verificar si hay cambios en los materiales
                const materialsAdded = currentMaterials.filter(m => 
                    !originalMaterials.some(om => om.material === m.material)
                );
                
                const materialsRemoved = originalMaterials.filter(m => 
                    !currentMaterials.some(cm => cm.material === m.material)
                );
                
                if (materialsAdded.length > 0 || materialsRemoved.length > 0) {
                    // Mostrar información sobre los cambios
                    let message = '';
                    
                    if (materialsAdded.length > 0) {
                        const addedNames = materialsAdded.map(m => 
                            materials.find(mat => mat.id === m.material)?.name
                        ).filter(Boolean);
                        
                        message += `Se añadirán como USO: ${addedNames.join(', ')}\n`;
                    }
                    
                    if (materialsRemoved.length > 0) {
                        const removedNames = materialsRemoved.map(m => 
                            materials.find(mat => mat.id === m.material)?.name
                        ).filter(Boolean);
                        
                        message += `Se devolverán al inventario: ${removedNames.join(', ')}`;
                    }
                    
                    await Swal.fire({
                        title: 'Cambios en materiales',
                        text: message,
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: 'Continuar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (!result.isConfirmed) {
                            throw new Error('Envío cancelado por el usuario');
                        }
                    });
                }
            }
            
            // Preparar formData
            const formData = new FormData();
            
            formData.append('date', report.date);
            formData.append('contract', report.contract);
            formData.append('description', report.description);
            formData.append('hours_worked', report.hours_worked || '');
            formData.append('status', report.status);
            
            // Añadir técnicos y materiales
            formData.append('technicians', JSON.stringify(report.technicians));
            formData.append('materials_used', JSON.stringify(report.materials_used));
            
            // Añadir imágenes existentes
            const existingImages = [
                ...beforeImages.map(img => ({
                    id: img.id,
                    description: img.description || '',
                    image_type: 'BEFORE'
                })),
                ...afterImages.map(img => ({
                    id: img.id,
                    description: img.description || '',
                    image_type: 'AFTER'
                }))
            ];
            formData.append('existing_images', JSON.stringify(existingImages));
            
            // Añadir lista de imágenes a eliminar
            formData.append('images_to_delete', JSON.stringify(imagesToDelete));
            
            // Añadir nuevas imágenes
            selectedBeforeImages.forEach((img, index) => {
                formData.append(`new_before_images_${index}`, img.file);
            });
            
            selectedAfterImages.forEach((img, index) => {
                formData.append(`new_after_images_${index}`, img.file);
            });
            
            // Añadir el ID del usuario actual
            formData.append('user', user.id);
            formData.append('material_reason', 'USO');
            
            if (isEditMode) {
                await axios.put(`/contracts/reports/${reportId}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Reporte actualizado correctamente');
            } else {
                await axios.post('/contracts/reports/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Reporte creado correctamente');
            }
            
            navigate(`/dashboard/contracts/${id}/reports`);
        } catch (error) {
            console.error('Error al guardar el reporte:', error);
            
            // Mejorar la captura y visualización del error
            let errorMessage = 'Error al guardar el reporte';
            
            if (error.response) {
                // El servidor respondió con un status fuera del rango 2xx
                if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                    console.error('Detalle del error:', error.response.data.detail);
                    
                    // Mostrar detalle del error en consola para depuración
                    if (error.response.data.detail) {
                        console.error('Stacktrace del error:');
                        console.error(error.response.data.detail);
                    }
                } else {
                    errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
                }
            } else if (error.request) {
                // La petición fue realizada pero no se recibió respuesta
                errorMessage = 'No se recibió respuesta del servidor';
            }
            
            // Mostrar mensaje de error al usuario
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: errorMessage,
                confirmButtonText: 'Entendido'
            });
            
        } finally {
            setLoading(false);
        }
    };

    // Verificar si hay materiales con stock disponible
    const materialsWithStock = materials.filter(m => m.quantity > 0);
    const noMaterialsAvailable = materialsWithStock.length === 0;

    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-right" />
            
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
                            REPORTE ELIMINADO - No se puede editar
                            {originalReport?.deleted_at && (
                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                    el {new Date(originalReport.deleted_at).toLocaleString('es-ES')}
                                </Typography>
                            )}
                        </Typography>
                    </Box>
                    <Button 
                        variant="outlined" 
                        color="error"
                        size="small" 
                        onClick={() => navigate(`/dashboard/contracts/${id}/reports`)}
                    >
                        Volver a la lista
                    </Button>
                </Paper>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate(`/dashboard/contracts/${id}/reports`)}
                        sx={{ mr: 2 }}
                    >
                        Volver
                    </Button>
                    <Typography variant="h6">
                        {isEditMode ? `Editar Reporte #${reportId}` : 'Nuevo Reporte'}
                    </Typography>
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={isReportDeleted || loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                        {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
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
                        
                        <TextField
                            fullWidth
                            margin="normal"
                            type="date"
                            name="date"
                            label="Fecha"
                            value={report.date}
                            onChange={handleInputChange}
                            InputLabelProps={{ shrink: true }}
                            disabled={isReportDeleted}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                            name="description"
                            label="Descripción del trabajo"
                            value={report.description}
                            onChange={handleInputChange}
                            disabled={isReportDeleted}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            type="number"
                            name="hours_worked"
                            label="Horas trabajadas"
                            value={report.hours_worked}
                            onChange={handleInputChange}
                            disabled={isReportDeleted}
                        />

                        {isReportDeleted ? (
                            <Box sx={{ mt: 2, mb: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>Estado:</Typography>
                                <Chip 
                                    label="Eliminado" 
                                    color="error" 
                                    variant="outlined" 
                                    icon={<Delete fontSize="small" />}
                                />
                            </Box>
                        ) : (
                            <TextField
                                fullWidth
                                margin="normal"
                                select
                                name="status"
                                label="Estado"
                                value={report.status || ''}
                                onChange={handleInputChange}
                                disabled={isReportDeleted}
                            >
                                <MenuItem value="DRAFT">Borrador</MenuItem>
                                <MenuItem value="COMPLETED">Completado</MenuItem>
                            </TextField>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Técnicos asignados
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                select
                                label="Técnico"
                                value={selectedTechnician}
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                                disabled={isReportDeleted}
                            >
                                {technicians.map((tech) => (
                                    <MenuItem key={tech.id} value={tech.id}>
                                        {tech.username}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleAddTechnician}
                                disabled={isReportDeleted || !selectedTechnician}
                            >
                                Añadir
                            </Button>
                        </Box>

                        <List>
                            {report.technicians.map((tech) => (
                                <ListItem key={tech.technician}>
                                    <ListItemText 
                                        primary={technicians.find(t => t.id === tech.technician)?.username}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton 
                                            onClick={() => handleRemoveTechnician(tech.technician)}
                                            disabled={isReportDeleted}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
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

                        {noMaterialsAvailable ? (
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                No hay materiales disponibles en stock.
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Autocomplete
                                    sx={{ flexGrow: 1 }}
                                    options={materialsWithStock}
                                    getOptionLabel={(option) => `${option.name} (Stock: ${option.quantity})`}
                                    renderInput={(params) => <TextField {...params} label="Buscar material" />}
                                    onChange={(event, newValue) => {
                                        setSelectedMaterial({
                                            material: newValue ? newValue.id : '',
                                            quantity: 1,
                                            materialObject: newValue
                                        });
                                    }}
                                    value={selectedMaterial.materialObject}
                                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                                    disabled={isReportDeleted}
                                />
                                <TextField
                                    sx={{ width: '100px' }}
                                    type="number"
                                    label="Cantidad"
                                    value={selectedMaterial.quantity}
                                    onChange={(e) => setSelectedMaterial({
                                        ...selectedMaterial,
                                        quantity: parseInt(e.target.value) || 0
                                    })}
                                    inputProps={{ min: 1, max: selectedMaterial.materialObject?.quantity || 9999 }}
                                    disabled={isReportDeleted}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleAddMaterial}
                                    disabled={isReportDeleted || !selectedMaterial.material || selectedMaterial.quantity < 1}
                                >
                                    Añadir
                                </Button>
                            </Box>
                        )}

                        <List>
                            {report.materials_used.map((material) => (
                                <ListItem key={material.material}>
                                    <ListItemText 
                                        primary={materials.find(m => m.id === material.material)?.name}
                                        secondary={`Cantidad: ${material.quantity}${material.location_name ? ` - ${material.location_name}` : ''}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton 
                                            onClick={() => handleRemoveMaterial(material.material)}
                                            disabled={isReportDeleted}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Imágenes
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Imágenes antes
                            </Typography>
                            {beforeImages.length > 0 && (
                                <ImageList cols={3} rowHeight={150} sx={{ mb: 2 }}>
                                    {beforeImages.map((image, index) => (
                                        <ImageListItem 
                                            key={image.id} 
                                            onClick={() => handleImageClick(image, index, 'BEFORE')}
                                            sx={{ 
                                                position: 'relative',
                                                cursor: 'pointer',
                                                width: '150px !important',
                                                height: '150px !important',
                                                '&:hover': {
                                                    '& .MuiImageListItemBar-root': {
                                                        opacity: 1
                                                    }
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
                                            <ImageListItemBar
                                                sx={{
                                                    background: 'rgba(0,0,0,0.5)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }}
                                                actionIcon={
                                                    <IconButton
                                                        sx={{ color: 'white' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage('BEFORE', image.id);
                                                        }}
                                                        disabled={isReportDeleted}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                }
                                            />
                                        </ImageListItem>
                                    ))}
                                    {selectedBeforeImages.map((img, index) => (
                                        <ImageListItem key={`new-${index}`}>
                                            <img src={img.preview} alt={`Nueva antes ${index + 1}`} />
                                            <ImageListItemBar
                                                actionIcon={
                                                    <IconButton
                                                        onClick={() => handleRemoveSelectedImage('BEFORE', index)}
                                                        color="error"
                                                        disabled={isReportDeleted}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                }
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            )}
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="before-images"
                                multiple
                                type="file"
                                onChange={handleImageSelect('BEFORE')}
                                disabled={isReportDeleted}
                            />
                            <label htmlFor="before-images">
                                <Button 
                                    variant="outlined" 
                                    component="span"
                                    disabled={isReportDeleted}
                                >
                                    Subir imágenes antes
                                </Button>
                            </label>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Imágenes después
                            </Typography>
                            {afterImages.length > 0 && (
                                <ImageList cols={3} rowHeight={150} sx={{ mb: 2 }}>
                                    {afterImages.map((image, index) => (
                                        <ImageListItem 
                                            key={image.id} 
                                            onClick={() => handleImageClick(image, index, 'AFTER')}
                                            sx={{ 
                                                position: 'relative',
                                                cursor: 'pointer',
                                                width: '150px !important',
                                                height: '150px !important',
                                                '&:hover': {
                                                    '& .MuiImageListItemBar-root': {
                                                        opacity: 1
                                                    }
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
                                            <ImageListItemBar
                                                sx={{
                                                    background: 'rgba(0,0,0,0.5)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }}
                                                actionIcon={
                                                    <IconButton
                                                        sx={{ color: 'white' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage('AFTER', image.id);
                                                        }}
                                                        disabled={isReportDeleted}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                }
                                            />
                                        </ImageListItem>
                                    ))}
                                    {selectedAfterImages.map((img, index) => (
                                        <ImageListItem key={`new-${index}`}>
                                            <img src={img.preview} alt={`Nueva después ${index + 1}`} />
                                            <ImageListItemBar
                                                actionIcon={
                                                    <IconButton
                                                        onClick={() => handleRemoveSelectedImage('AFTER', index)}
                                                        color="error"
                                                        disabled={isReportDeleted}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                }
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            )}
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="after-images"
                                multiple
                                type="file"
                                onChange={handleImageSelect('AFTER')}
                                disabled={isReportDeleted}
                            />
                            <label htmlFor="after-images">
                                <Button 
                                    variant="outlined" 
                                    component="span"
                                    disabled={isReportDeleted}
                                >
                                    Subir imágenes después
                                </Button>
                            </label>
                        </Box>
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

            <LocationSelector
                open={openLocationSelector}
                onClose={() => {
                    setOpenLocationSelector(false);
                    setPendingMaterial(null);
                }}
                materialId={pendingMaterial?.material}
                materialName={pendingMaterial?.materialObject?.name}
                quantity={pendingMaterial?.quantity || 0}
                onSelectLocation={handleLocationSelected}
            />
        </Box>
    );
};

export default ReportForm;