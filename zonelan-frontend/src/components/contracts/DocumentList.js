import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Grid,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Tooltip, IconButton, Divider, CircularProgress, Alert
} from '@mui/material';
import {
    ArrowBack, CloudUpload, FileDownload, Delete, Visibility
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import format from 'date-fns/format';
import es from 'date-fns/locale/es';
import { useContracts } from '../../hooks/useContracts';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import DocumentPreview from './DocumentPreview';

const DocumentList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    const { 
        contract, 
        loadingContract, 
        fetchContract, 
        fetchContractDocuments,
        deleteContractDocument 
    } = useContracts();
    
    useEffect(() => {
        loadData();
    }, [id]);
    
    const loadData = async () => {
        try {
            setLoadingDocuments(true);
            await fetchContract(id);
            const documentsData = await fetchContractDocuments(id);
            setDocuments(documentsData || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar documentos del contrato');
        } finally {
            setLoadingDocuments(false);
        }
    };
    
    const handleDeleteDocument = async (documentId) => {
        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Esta acción no se puede revertir",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });
            
            if (result.isConfirmed) {
                await deleteContractDocument(documentId);
                toast.success('Documento eliminado correctamente');
                const updatedDocuments = await fetchContractDocuments(id);
                setDocuments(updatedDocuments || []);
            }
        } catch (error) {
            console.error('Error al eliminar el documento:', error);
            toast.error('Error al eliminar el documento');
        }
    };
    
    const handlePreview = (document) => {
        setSelectedDocument(document);
        setPreviewOpen(true);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate(`/dashboard/contracts/${id}`)}
                        sx={{ mr: 2 }}
                    >
                        Volver
                    </Button>
                    <Typography variant="h6">
                        Documentos del Contrato: {contract?.title}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate(`/dashboard/contracts/${id}/documents/new`)}
                >
                    Subir Documento
                </Button>
            </Box>
            
            <Paper sx={{ p: 2 }}>
                {loadingDocuments ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : documents && documents.length > 0 ? (
                    <List>
                        {documents.map((document) => (
                            <ListItem key={document.id} divider>
                                <ListItemText
                                    primary={document.title}
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span">
                                                Subido el: {formatDate(document.uploaded_at)}
                                            </Typography>
                                            <br />
                                            <Typography variant="body2" component="span">
                                                Por: {document.uploaded_by_name || 'No especificado'}
                                            </Typography>
                                            {document.description && (
                                                <>
                                                    <br />
                                                    <Typography variant="body2" component="span">
                                                        {document.description}
                                                    </Typography>
                                                </>
                                            )}
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Tooltip title="Vista previa">
                                        <IconButton 
                                            edge="end" 
                                            color="primary"
                                            onClick={() => handlePreview(document)}
                                            sx={{ mr: 1 }}
                                        >
                                            <Visibility />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Descargar">
                                        <IconButton 
                                            edge="end" 
                                            href={document.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ mr: 1 }}
                                        >
                                            <FileDownload />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <IconButton 
                                            edge="end" 
                                            color="error"
                                            onClick={() => handleDeleteDocument(document.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Alert severity="info">
                        No hay documentos asociados a este contrato
                    </Alert>
                )}
            </Paper>
            
            {/* Componente de vista previa del documento */}
            <DocumentPreview 
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                document={selectedDocument}
            />
        </Box>
    );
};

export default DocumentList;