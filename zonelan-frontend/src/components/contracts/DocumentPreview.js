import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Paper,
    Button,
    Alert
} from '@mui/material';
import { Close, FileDownload, OpenInNew } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';

const DocumentPreview = ({ open, onClose, document }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [localBlobUrl, setLocalBlobUrl] = useState(null);

    // Determinar el tipo de archivo
    const getFileType = () => {
        if (!document || !document.file_url) return null;
        
        const fileName = document.file_url.toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
            fileName.endsWith('.png') || fileName.endsWith('.gif')) return 'image';
        return 'other';
    };

    const fileType = getFileType();
    
    // Abrir en una nueva pestaña
    const handleOpenInNewTab = () => {
        window.open(document?.file_url, '_blank');
    };
    
    // Función que descarga el documento directamente y crea un blob URL local
    const fetchDocumentBlob = async () => {
        if (!document?.file_url) {
            setError(true);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Usar axios para descargar el documento directamente con responseType blob
            const response = await axios.get(document.file_url, {
                responseType: 'blob',
                // Omitir las cabeceras de autenticación para archivos públicos si es necesario
                skipAuthRefresh: true,
                withCredentials: false
            });
            
            // Crear una URL de objeto blob
            const blob = new Blob([response.data], { 
                type: response.headers['content-type'] || getMimeType(document.file_url) 
            });
            const url = URL.createObjectURL(blob);
            
            // Guardar la URL del blob
            setLocalBlobUrl(url);
            setLoading(false);
            setError(false);
        } catch (error) {
            console.error('Error al cargar el documento:', error);
            setError(true);
            setLoading(false);
        }
    };

    // Función para adivinar el MIME type basado en la extensión del archivo
    const getMimeType = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    };

    // Cargar el documento cuando el componente se monte o cambie el documento
    useEffect(() => {
        if (document) {
            fetchDocumentBlob();
        }
        
        // Limpiar la URL del blob cuando el componente se desmonte
        return () => {
            if (localBlobUrl) {
                URL.revokeObjectURL(localBlobUrl);
                setLocalBlobUrl(null);
            }
        };
    }, [document]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { 
                    height: '80vh',
                    display: 'flex', 
                    flexDirection: 'column'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" component="div" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {document?.title || 'Vista previa del documento'}
                </Typography>
                <Box>
                    <IconButton 
                        onClick={handleOpenInNewTab}
                        title="Abrir en nueva pestaña"
                    >
                        <OpenInNew />
                    </IconButton>
                    <IconButton 
                        href={document?.file_url} 
                        download
                        title="Descargar"
                    >
                        <FileDownload />
                    </IconButton>
                    <IconButton onClick={onClose} title="Cerrar">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ flexGrow: 1, overflow: 'hidden', p: 0 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                )}
                
                {!loading && !error && fileType === 'pdf' && localBlobUrl && (
                    <object
                        data={localBlobUrl}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    >
                        <Alert severity="warning" sx={{ m: 2 }}>
                            Tu navegador no puede mostrar PDFs directamente. 
                            <Button 
                                onClick={handleOpenInNewTab}
                                variant="text" 
                                color="primary"
                                sx={{ ml: 1 }}
                            >
                                Abrir en nueva pestaña
                            </Button>
                        </Alert>
                    </object>
                )}
                
                {!loading && !error && fileType === 'image' && localBlobUrl && (
                    <Box 
                        sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            overflow: 'auto',
                            background: '#f5f5f5',
                            p: 2
                        }}
                    >
                        <img
                            src={localBlobUrl}
                            alt={document?.title}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain'
                            }}
                        />
                    </Box>
                )}
                
                {(error || fileType === 'other' || (!localBlobUrl && !loading)) && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexDirection: 'column',
                        height: '100%',
                        p: 3,
                        textAlign: 'center' 
                    }}>
                        <Paper sx={{ p: 4, maxWidth: '80%' }}>
                            <Typography variant="h6" gutterBottom>
                                {error ? 'Error al cargar el documento' : 'Vista previa no disponible'}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {error ? 
                                    'Ha ocurrido un error al intentar mostrar este documento.' : 
                                    'Este tipo de documento no se puede previsualizar directamente en el navegador.'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleOpenInNewTab}
                                    startIcon={<OpenInNew />}
                                >
                                    Abrir en nueva pestaña
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    href={document?.file_url} 
                                    download
                                    startIcon={<FileDownload />}
                                >
                                    Descargar
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreview;