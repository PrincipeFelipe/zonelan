import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton,
    Tooltip, CircularProgress, Alert
} from '@mui/material';
import {
    ArrowBack, Add, Visibility, Delete, Print
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import es from 'date-fns/locale/es';
import { useContracts } from '../../hooks/useContracts';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const ReportList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { 
        contract, 
        loadingContract, 
        fetchContract,
        fetchContractReports,
        deleteContractReport 
    } = useContracts();
    
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);
    
    const loadData = async () => {
        try {
            await fetchContract(id);
            const reportData = await fetchContractReports(id);
            setReports(reportData || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar reportes del contrato');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteReport = async (reportId) => {
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
                await deleteContractReport(reportId);
                toast.success('Reporte eliminado correctamente');
                await fetchContractReports({ contract: id });
            }
        } catch (error) {
            console.error('Error al eliminar el reporte:', error);
            toast.error('Error al eliminar el reporte');
        }
    };
    
    const printReport = async (report) => {
        try {
            const printWindow = window.open('', '_blank');
            
            if (!printWindow) {
                toast.error('Por favor, permita las ventanas emergentes para imprimir');
                return;
            }
            
            const printContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Reporte de Contrato #${report.id}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            margin: 20px;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .section {
                            margin-bottom: 15px;
                        }
                        .section-title {
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .footer {
                            margin-top: 30px;
                            display: flex;
                            justify-content: space-between;
                        }
                        .signature {
                            width: 45%;
                            border-top: 1px solid #333;
                            padding-top: 10px;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Reporte de Trabajo #${report.id}</h1>
                        <div>
                            <p>Fecha: ${format(parseISO(report.date), 'dd/MM/yyyy', { locale: es })}</p>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Título:</div>
                        <p>${report.title}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Contrato:</div>
                        <p>${contract.title}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Descripción:</div>
                        <p>${report.description}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Estado:</div>
                        <p>${report.is_completed ? 'Completado' : 'Pendiente'}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Horas trabajadas:</div>
                        <p>${report.hours_worked || 'No especificadas'}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Realizado por:</div>
                        <p>${report.performed_by_name || 'No especificado'}</p>
                    </div>
                    
                    ${report.observations ? `
                        <div class="section">
                            <div class="section-title">Observaciones:</div>
                            <p>${report.observations}</p>
                        </div>
                    ` : ''}
                    
                    <div class="footer">
                        <div class="signature">
                            <p>Firma del técnico</p>
                        </div>
                        <div class="signature">
                            <p>Firma del cliente</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Esperar a que se cargue el contenido
            setTimeout(() => {
                printWindow.print();
            }, 500);
            
        } catch (error) {
            console.error('Error al imprimir:', error);
            toast.error('Error al preparar la impresión');
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    };
    
    const getStatusChip = (report) => {
        if (report.is_completed) {
            return <Chip label="Completado" color="success" size="small" />;
        } else {
            return <Chip label="Pendiente" color="warning" size="small" />;
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
                        Reportes del Contrato: {contract?.title}
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={() => navigate(`/dashboard/contracts/${id}/reports/new`)}
                >
                    Nuevo Reporte
                </Button>
            </Box>
            
            {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : reports && reports.length > 0 ? (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Título</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Realizado por</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>{report.id}</TableCell>
                                    <TableCell>{report.title}</TableCell>
                                    <TableCell>{formatDate(report.date)}</TableCell>
                                    <TableCell>{report.performed_by_name || '-'}</TableCell>
                                    <TableCell>{getStatusChip(report)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver/Editar">
                                            <IconButton 
                                                size="small"
                                                onClick={() => navigate(`/dashboard/contracts/${id}/reports/${report.id}`)}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton 
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteReport(report.id)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Imprimir">
                                            <IconButton 
                                                size="small"
                                                onClick={() => printReport(report)}
                                            >
                                                <Print fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="info">
                    No hay reportes registrados para este contrato. Haga clic en "Nuevo Reporte" para crear uno.
                </Alert>
            )}
        </Box>
    );
};

export default ReportList;