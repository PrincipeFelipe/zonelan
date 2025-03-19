import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Paper,
    Divider
} from '@mui/material';
import { Close, FileDownload, OpenInNew } from '@mui/icons-material';

const DocumentPreview = ({ open, onClose, document }) => {
    const [loading, setLoading] = useState(false);

    // Determinar el tipo de archivo para elegir el visualizador adecuado
    const getFileType = () => {
        if (!document || !document.file_url) return null;
        
        const fileName = document.file_url.toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
            fileName.endsWith('.png') || fileName.endsWith('.gif')) return 'image';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'office';
        if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'office';
        if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'office';
        return 'other';
    };

    const fileType = getFileType();
    
    // Abrir en una nueva pestaña
    const handleOpenInNewTab = () => {
        window.open(document?.file_url, '_blank');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
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
            
            <DialogContent>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    textAlign: 'center',
                    minHeight: '300px'
                }}>
                    {fileType === 'image' ? (
                        // Las imágenes sí pueden verse directamente
                        <img
                            src={document?.file_url}
                            alt={document?.title}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '400px', 
                                objectFit: 'contain'
                            }}
                            onLoad={() => setLoading(false)}
                            onError={() => setLoading(false)}
                        />
                    ) : (
                        <Paper elevation={0} sx={{ p: 4, maxWidth: '100%', bgcolor: 'background.default' }}>
                            <Typography variant="h6" gutterBottom>
                                El documento no se puede previsualizar directamente
                            </Typography>
                            
                            <Typography variant="body1" paragraph color="text.secondary">
                                Debido a restricciones de seguridad del navegador, este documento no puede 
                                mostrarse dentro de la aplicación.
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
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
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreview;