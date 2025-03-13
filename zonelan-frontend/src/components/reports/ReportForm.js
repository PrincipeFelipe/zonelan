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
    Autocomplete
} from '@mui/material';
import { Add, Delete, Save, ArrowBack, CloudUpload, Close, NavigateNext, NavigateBefore, DeleteOutline, Restore as RestoreIcon } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios, { getMediaUrl } from '../../utils/axiosConfig';
import Swal from 'sweetalert2';
import LocationSelector from '../materials/LocationSelector';

const ReportForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const editMode = Boolean(id);

    const [report, setReport] = useState({
        date: new Date().toISOString().split('T')[0],
        incident: location.state?.incident?.id || '',
        description: '',
        hours_worked: '',
        status: 'DRAFT',
        technicians: [],
        materials_used: [],
        before_images: [],
        after_images: []
    });

    const [incidents, setIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState({ 
        material: '', 
        quantity: 1,
        materialObject: null // Para almacenar el objeto material completo
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

    useEffect(() => {
        fetchIncidents();
        fetchTechnicians();
        fetchMaterials();
        
        // Obtener parámetros de URL (para cuando se llama desde otra vista)
        const params = new URLSearchParams(location.search);
        const incidentId = params.get('incident');
        
        if (editMode) {
            fetchReport();
        } else if (incidentId) {
            // Si hay un ID de incidencia en los parámetros, pre-seleccionarlo
            fetchIncidentDetails(incidentId);
        }
    }, [id]);

    const fetchReport = async () => {
        try {
            const response = await axios.get(`/reports/reports/${id}/`);
            console.log('Datos recibidos:', response.data);

            if (response.data) {
                setReport({
                    date: response.data.date || new Date().toISOString().split('T')[0],
                    incident: response.data.incident || '',
                    description: response.data.description || '',
                    hours_worked: response.data.hours_worked || '',
                    status: response.data.status || 'DRAFT',
                    technicians: Array.isArray(response.data.technicians) 
                        ? response.data.technicians.map(tech => ({
                            technician: tech.technician
                        }))
                        : [],
                    materials_used: Array.isArray(response.data.materials_used)
                        ? response.data.materials_used.map(material => ({
                            material: material.material,
                            quantity: parseInt(material.quantity)
                        }))
                        : []
                });

                // Actualizar las imágenes según la estructura del backend
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
            console.error('Error fetching report:', error);
            toast.error('Error al cargar el parte');
        }
    };

    const fetchIncidentDetails = async (incidentId) => {
        try {
            const response = await axios.get(`/incidents/incidents/${incidentId}/`);
            const incident = response.data;
            
            if (incident) {
                // Pre-llenar el formulario con la incidencia seleccionada
                setReport(prev => ({
                    ...prev,
                    incident: incident.id,
                    title: `Parte para incidencia #${incident.id}`,
                    // Puedes pre-llenar otros campos según necesites
                }));
                
                // También podrías cargar el cliente asociado
                if (incident.customer) {
                    // Opcionalmente, cargar datos del cliente
                }
            }
        } catch (error) {
            console.error('Error al cargar detalles de incidencia:', error);
            toast.error('Error al cargar información de la incidencia');
        }
    };

    const fetchIncidents = async () => {
        try {
            // Obtener todas las incidencias
            const response = await axios.get('/incidents/incidents/');
            
            if (Array.isArray(response.data)) {
                // Filtrar solo las incidencias que están en estado PENDING o IN_PROGRESS
                const activeIncidents = response.data.filter(incident => 
                    incident.status === 'PENDING' || incident.status === 'IN_PROGRESS'
                );
                
                setIncidents(activeIncidents);
            } else {
                console.error('La respuesta de incidencias no es un array:', response.data);
                setIncidents([]);
            }
        } catch (error) {
            console.error('Error al cargar incidencias:', error);
            setIncidents([]);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get('/users/');
            setTechnicians(response.data);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await axios.get('/materials/materials/');
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
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

    const handleImageUpload = (type) => async (event) => {
        const files = Array.from(event.target.files);
        const formData = new FormData();

        // Añadir el tipo de imagen al formData
        formData.append('image_type', type);
        
        // Añadir cada archivo al formData
        files.forEach((file) => {
            formData.append('images', file);
        });

        try {
            const response = await axios.post('/reports/upload-images/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Respuesta del servidor:', response.data);

            if (Array.isArray(response.data) && response.data.length > 0) {
                const uploadedImages = response.data.map(img => ({
                    id: img.id,
                    image: img.image,
                    description: img.description || '',
                    image_type: type
                }));

                if (type === 'BEFORE') {
                    setSelectedBeforeImages(prev => [...prev, ...uploadedImages]);
                } else {
                    setSelectedAfterImages(prev => [...prev, ...uploadedImages]);
                }

                toast.success('Imágenes subidas correctamente');
            } else {
                throw new Error('No se recibieron datos de las imágenes');
            }
        } catch (error) {
            console.error('Error completo:', error);
            const errorMessage = error.response?.data?.error || 'Error al subir las imágenes';
            toast.error(errorMessage);
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

    const handleImageClick = (image, index, type) => {
        console.log('Imagen clickeada:', image);  // Para debugging
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
            // Validar todos los campos requeridos
            const validationErrors = [];

            if (!report.date) {
                validationErrors.push('La fecha es obligatoria');
            }
            if (!report.incident) {
                validationErrors.push('Debe seleccionar una incidencia');
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

            // Si hay errores, mostrarlos y detener el envío
            if (validationErrors.length > 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    html: validationErrors.map(error => `• ${error}`).join('<br>'),
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            // Informar al usuario si hay cambios en los materiales
            if (editMode) {
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

            // Preparar formData y continuar con el envío
            const formData = new FormData();
            
            // Añadir datos básicos
            formData.append('date', report.date);
            formData.append('incident', report.incident);
            formData.append('description', report.description);
            formData.append('hours_worked', report.hours_worked || '');
            formData.append('status', report.status);
            
            // Añadir técnicos y materiales
            formData.append('technicians', JSON.stringify(report.technicians));
            formData.append('materials_used', JSON.stringify(report.materials_used));

            // Añadir imágenes existentes (solo las que no están marcadas para eliminar)
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

            // Añadir el ID del usuario actual y motivo de uso de materiales
            const currentUser = JSON.parse(localStorage.getItem('user'));
            formData.append('user', currentUser.id);
            formData.append('material_reason', 'USO');  // Indicar que es uso en reporte

            console.log('Datos a enviar:', {
                ...Object.fromEntries(formData.entries()),
                existingImages,
                newBeforeImages: selectedBeforeImages.length,
                newAfterImages: selectedAfterImages.length
            });

            if (editMode) {
                await axios.put(`/reports/reports/${id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Parte actualizado correctamente');
            } else {
                await axios.post('/reports/reports/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Parte creado correctamente');
            }

            navigate(-1);
        } catch (error) {
            console.error('Error completo:', error);
            const errorMessage = error.response?.data?.error || 'Error al guardar el parte';
            toast.error(errorMessage);
        }
    };

    const handleRestoreImages = () => {
        // Recargar el reporte para restaurar las imágenes
        if (id) {
            fetchReport(); // Cambiar fetchReportDetails por fetchReport
            setImagesToDelete([]);
            toast.success('Imágenes restauradas');
        }
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
        
        // Limpiar material pendiente y cerrar el selector
        setPendingMaterial(null);
        setOpenLocationSelector(false);
    };

    // Verificar si hay materiales con stock disponible
    const materialsWithStock = materials.filter(m => m.quantity > 0);
    const noMaterialsAvailable = materialsWithStock.length === 0;

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                    {editMode ? 'Editar Parte' : 'Nuevo Parte'}
                </Typography>
                <Box>
                    <Button
                        sx={{ mr: 1 }}
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                    >
                        Volver
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                    >
                        Guardar
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
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            select
                            name="incident"
                            label="Incidencia"
                            value={report.incident}
                            onChange={handleInputChange}
                            disabled={editMode}
                        >
                            {incidents.map((incident) => (
                                <MenuItem key={incident.id} value={incident.id}>
                                    {incident.title} ({incident.customer_name})
                                    {' '}
                                    <span style={{
                                        display: 'inline-block',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        marginLeft: '5px',
                                        backgroundColor: incident.status === 'PENDING' ? '#ff9800' : '#4caf50'
                                    }}/>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                            name="description"
                            label="Descripción del trabajo"
                            value={report.description}
                            onChange={handleInputChange}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            type="number"
                            name="hours_worked"
                            label="Horas trabajadas"
                            value={report.hours_worked}
                            onChange={handleInputChange}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            select
                            name="status"
                            label="Estado"
                            value={report.status}
                            onChange={handleInputChange}
                        >
                            <MenuItem value="DRAFT">Borrador</MenuItem>
                            <MenuItem value="COMPLETED">Completado</MenuItem>
                        </TextField>
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
                                        <IconButton onClick={() => handleRemoveTechnician(tech.technician)}>
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
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleAddMaterial}
                                    disabled={!selectedMaterial.material || selectedMaterial.quantity < 1}
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
                                        secondary={`Cantidad: ${material.quantity}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton onClick={() => handleRemoveMaterial(material.material)}>
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
                            />
                            <label htmlFor="before-images">
                                <Button variant="outlined" component="span">
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
                            />
                            <label htmlFor="after-images">
                                <Button variant="outlined" component="span">
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