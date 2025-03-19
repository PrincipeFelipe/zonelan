import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Grid,
    TextField, CircularProgress, Alert,
    IconButton
} from '@mui/material';
import { 
    ArrowBack, CloudUpload, Clear
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useContracts } from '../../hooks/useContracts';
import { Toaster, toast } from 'react-hot-toast';

const DocumentUpload = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { contract, loadingContract, fetchContract, uploadContractDocument } = useContracts();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null
    });
    const [errors, setErrors] = useState({});
    const [filePreview, setFilePreview] = useState(null);
    
    useEffect(() => {
        loadContract();
    }, [id]);
    
    const loadContract = async () => {
        try {
            await fetchContract(id);
        } catch (error) {
            console.error('Error al cargar el contrato:', error);
            toast.error('Error al cargar información del contrato');
        }
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Limpiar errores al cambiar un valor
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                file
            });
            
            // Crear preview para el archivo si es una imagen
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
            
            // Limpiar error de archivo si existe
            if (errors.file) {
                setErrors({
                    ...errors,
                    file: null
                });
            }
        }
    };
    
    const clearFile = () => {
        setFormData({
            ...formData,
            file: null
        });
        setFilePreview(null);
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }
        
        if (!formData.file) {
            newErrors.file = 'Debe seleccionar un archivo';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const fileData = new FormData();
            fileData.append('title', formData.title);
            fileData.append('description', formData.description);
            fileData.append('file', formData.file);
            fileData.append('contract', id);
            
            await uploadContractDocument(fileData);
            toast.success('Documento subido correctamente');
            navigate(`/dashboard/contracts/${id}/documents`);
        } catch (error) {
            console.error('Error al subir el documento:', error);
            toast.error('Error al subir el documento');
        } finally {
            setLoading(false);
        }
    };
    
    if (loadingContract) {
        return (
            <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-right" />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate(`/dashboard/contracts/${id}/documents`)}
                    sx={{ mr: 2 }}
                >
                    Volver
                </Button>
                <Typography variant="h6">
                    Subir Documento para: {contract?.title}
                </Typography>
            </Box>
            
            <Paper sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Título del documento"
                                variant="outlined"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={handleChange}
                                error={Boolean(errors.title)}
                                helperText={errors.title}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Descripción"
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                error={Boolean(errors.description)}
                                helperText={errors.description}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<CloudUpload />}
                                    >
                                        Seleccionar Archivo
                                        <input
                                            type="file"
                                            hidden
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                    {formData.file && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                                {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
                                            </Typography>
                                            <IconButton color="error" onClick={clearFile} size="small">
                                                <Clear fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                
                                {errors.file && (
                                    <Alert severity="error" sx={{ mt: 1 }}>
                                        {errors.file}
                                    </Alert>
                                )}
                                
                                {filePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img
                                            src={filePreview}
                                            alt="Vista previa"
                                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/dashboard/contracts/${id}/documents`)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : null}
                                >
                                    {loading ? 'Subiendo...' : 'Subir Documento'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
};

export default DocumentUpload;