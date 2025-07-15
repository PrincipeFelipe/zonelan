import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Button,
    Box,
    IconButton,
    Tooltip,
    Chip,  // Añadir esta importación
    Switch,
    FormControlLabel,
    FormControl
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Delete, Visibility, Add, Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import Swal from 'sweetalert2';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ReportList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [isSuperuser, setIsSuperuser] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar permisos de superusuario
        const user = JSON.parse(localStorage.getItem('user'));
        setIsSuperuser(user?.type === 'SuperAdmin' || user?.type === 'Admin');
        
        fetchReports();
    }, []);

    // Modificar para cargar reportes según showDeleted
    useEffect(() => {
        fetchReports();
    }, [showDeleted]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            let url = '/reports/reports/';
            if (showDeleted) {
                url = '/reports/reports/deleted/';
            }
            
            // Añadir un timeout para evitar que la solicitud se quede colgada
            const response = await axios.get(url, { 
                timeout: 10000,  // 10 segundos
                validateStatus: function (status) {
                    return status < 500; // Resolver solo si el status es menor a 500
                }
            });
            
            // Si la respuesta es exitosa y contiene datos
            if (response.status === 200 && Array.isArray(response.data)) {
                setReports(response.data);
            } else {
                console.warn('Respuesta inesperada al cargar reportes:', response);
                // Si hay un error, mostrar mensaje y desactivar el modo "showDeleted"
                if (showDeleted) {
                    toast.error('Error al cargar reportes eliminados. Se mostrarán reportes activos.');
                    setShowDeleted(false);
                } else {
                    toast.error('Error al cargar los partes de trabajo');
                    setReports([]);
                }
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Error al cargar los partes de trabajo. Intente de nuevo más tarde.');
            setReports([]);
            
            // Si hay un error mientras se muestran eliminados, volver al modo normal
            if (showDeleted) {
                toast.error('No se pueden mostrar reportes eliminados. Volviendo a reportes activos.');
                setShowDeleted(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reportId) => {
        try {
            // Primero obtener los detalles del reporte para verificar si tiene materiales
            const reportResponse = await axios.get(`/reports/reports/${reportId}/`);
            const report = reportResponse.data;
            
            // Comprobar si el reporte tiene materiales usados
            const hasMaterials = report.materials_used && report.materials_used.length > 0;
            
            let returnMaterials = false;
            
            if (hasMaterials) {
                // Si hay materiales, preguntar qué hacer con ellos
                const materialNames = report.materials_used.map(m => `${m.material_name} (${m.quantity})`).join(", ");
                
                const result = await Swal.fire({
                    title: '¿Qué hacemos con los materiales?',
                    html: `Este reporte tiene los siguientes materiales utilizados:<br><br>` +
                          `<strong>${materialNames}</strong><br><br>` +
                          `¿Qué deseas hacer con estos materiales?`,
                    icon: 'question',
                    showDenyButton: true,
                    confirmButtonText: 'Devolver al stock',
                    denyButtonText: 'Mantener como utilizados',
                    confirmButtonColor: '#28a745',
                    denyButtonColor: '#dc3545',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar eliminación'
                });
                
                if (result.isDismissed) {
                    // El usuario canceló la operación
                    return;
                }
                
                // Si el usuario confirma, devolver los materiales al stock
                returnMaterials = result.isConfirmed;
            } else {
                // Si no hay materiales, solo confirmar la eliminación
                const confirmResult = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: "El reporte será marcado como eliminado",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                
                if (!confirmResult.isConfirmed) {
                    return;
                }
            }

            // Proceder con la eliminación, enviando el parámetro para devolver materiales si corresponde
            await axios.delete(`/reports/reports/${reportId}/?return_materials=${returnMaterials}`);
            
            // Mensaje según la acción realizada
            if (hasMaterials) {
                if (returnMaterials) {
                    toast.success('Parte eliminado y materiales devueltos al stock');
                } else {
                    toast.success('Parte eliminado manteniendo el uso de materiales');
                }
            } else {
                toast.success('Parte eliminado correctamente');
            }
            
            // Recargar la lista
            fetchReports();
        } catch (error) {
            console.error('Error en la eliminación del reporte:', error);
            toast.error(
                error.response?.data?.detail || 
                'Error al eliminar el parte de trabajo'
            );
        }
    };

    const handlePrint = async (reportId) => {
        try {
            // Obtener el reporte
            const response = await axios.get(`/reports/reports/${reportId}/`);
            const report = response.data;

            // Verificar que el reporte existe
            if (!report) {
                toast.error('No se pudo encontrar el parte de trabajo');
                return;
            }

            // Crear un iframe invisible para la impresión
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'absolute';
            printIframe.style.top = '-9999px';
            printIframe.style.left = '-9999px';
            printIframe.style.height = '0';
            printIframe.style.width = '0';
            document.body.appendChild(printIframe);

            // Esperar a que el iframe esté listo
            printIframe.onload = () => {
                try {
                    // Acceder al documento dentro del iframe y escribir contenido
                    const printDocument = printIframe.contentDocument || printIframe.contentWindow.document;
                    printDocument.open();
                    printDocument.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Parte de Trabajo #${report.id}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                h1 { font-size: 18px; margin-bottom: 10px; }
                                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                                .section { margin-bottom: 15px; }
                                .label { font-weight: bold; margin-right: 5px; }
                                .value { }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f2f2f2; }
                                .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                                .signature-line { width: 45%; border-top: 1px solid #000; padding-top: 5px; text-align: center; }
                                @media print {
                                    body { -webkit-print-color-adjust: exact; color-adjust: exact; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h1>Parte de Trabajo #${report.id}</h1>
                                <div>
                                    <span class="label">Fecha:</span>
                                    <span class="value">${new Date(report.date).toLocaleDateString('es-ES')}</span>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="label">Cliente:</div>
                                <div class="value">${report.customer_name || '-'}</div>
                            </div>
                            
                            <div class="section">
                                <div class="label">Incidencia:</div>
                                <div class="value">${report.incident_title || 'No asociada a incidencia'}</div>
                                ${report.incident ? `<div class="value">ID Incidencia: #${report.incident}</div>` : ''}
                            </div>
                            
                            <div class="section">
                                <div class="label">Descripción:</div>
                                <div class="value">${report.description || '-'}</div>
                            </div>
                            
                            <div class="section">
                                <div class="label">Trabajo realizado:</div>
                                <div class="value">${report.work_done || '-'}</div>
                            </div>
                            
                            <div class="section">
                                <div class="label">Horas trabajadas:</div>
                                <div class="value">${report.hours_worked || '-'}</div>
                            </div>
                            
                            <div class="section">
                                <div class="label">Estado:</div>
                                <div class="value">
                                    ${report.status === 'DRAFT' ? 'Borrador' : 
                                      report.status === 'COMPLETED' ? 'Completado' : 
                                      report.status === 'DELETED' ? 'Eliminado' : report.status || ''}
                                </div>
                            </div>
                            
                            ${report.materials_used && report.materials_used.length > 0 ? `
                            <div class="section">
                                <div class="label">Materiales utilizados:</div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th>Cantidad</th>
                                            <th>Precio unitario</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${report.materials_used.map(material => `
                                            <tr>
                                                <td>${material.material_name}</td>
                                                <td>${material.quantity}</td>
                                                <td>${material.unit_price ? material.unit_price.toFixed(2) + ' €' : '-'}</td>
                                                <td>${material.unit_price ? (material.unit_price * material.quantity).toFixed(2) + ' €' : '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ` : ''}
                            
                            ${report.technicians && report.technicians.length > 0 ? `
                            <div class="section">
                                <div class="label">Técnicos:</div>
                                <ul>
                                    ${report.technicians.map(tech => `
                                        <li>${tech.technician_name}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <div class="footer">
                                <div class="signature-line">Firma del técnico</div>
                                <div class="signature-line">Firma del cliente</div>
                            </div>
                        </body>
                        </html>
                    `);
                    printDocument.close();

                    // Esperar a que se carguen los estilos y contenidos
                    setTimeout(() => {
                        // Imprimir el iframe
                        printIframe.contentWindow.focus();
                        printIframe.contentWindow.print();
                        
                        // Eliminar el iframe después de la impresión
                        setTimeout(() => {
                            document.body.removeChild(printIframe);
                        }, 1000);
                    }, 500);
                    
                    // Notificar al usuario
                    toast.success('Preparando impresión...');
                    
                } catch (frameError) {
                    console.error('Error al preparar el documento de impresión:', frameError);
                    document.body.removeChild(printIframe);
                    toast.error('Error al preparar el documento para impresión');
                }
            };

            // Iniciar carga del iframe
            printIframe.src = 'about:blank';

        } catch (error) {
            console.error('Error al preparar la impresión:', error);
            toast.error('Error al preparar la impresión del parte de trabajo');
        }
    };

    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    #{params.value}
                </Typography>
            ),
        },
        { 
            field: 'incident_title', 
            headerName: 'Incidencia', 
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" fontWeight="500">
                        {params.value}
                    </Typography>
                    {params.row.incident && (
                        <Typography variant="caption" color="text.secondary">
                            Incidencia #{params.row.incident}
                        </Typography>
                    )}
                </Box>
            )
        },
        { 
            field: 'customer_name', 
            headerName: 'Cliente', 
            //width: 180,
            minWidth: 400,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {params.value || '-'}
                </Typography>
            )
        },
        { 
            field: 'date', 
            headerName: 'Fecha', 
            width: 120,
            renderCell: (params) => {
                if (!params.value) return (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>-</Typography>
                );
                
                try {
                    const date = new Date(params.value);
                    if (isNaN(date)) return (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            Fecha inválida
                        </Typography>
                    );
                    
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Typography variant="body2">
                                {date.toLocaleDateString('es-ES')}
                            </Typography>
                        </Box>
                    );
                } catch (error) {
                    return (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            Fecha inválida
                        </Typography>
                    );
                }
            }
        },
        { 
            field: 'status', 
            headerName: 'Estado', 
            width: 120,
            renderCell: (params) => {
                const status = params.row?.status;
                const isDeleted = Boolean(params.row?.is_deleted);
                
                let label, color, borderColor, variant = "outlined";
                
                if (isDeleted) {
                    label = 'Eliminado';
                    color = '#d32f2f';
                    borderColor = '#d32f2f';
                    variant = "filled";
                } else if (status === 'DRAFT') {
                    label = 'Borrador';
                    color = '#ed6c02';
                    borderColor = '#ed6c02';
                } else if (status === 'COMPLETED') {
                    label = 'Completado';
                    color = '#2e7d32';
                    borderColor = '#2e7d32';
                } else {
                    label = status || '';
                    color = '#757575';
                    borderColor = '#757575';
                }
                
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Chip
                            size="small"
                            label={label}
                            sx={{
                                color: isDeleted ? '#fff' : color,
                                border: `1px solid ${borderColor}`,
                                backgroundColor: isDeleted ? 'rgba(211, 47, 47, 0.8)' : 'transparent',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                            }}
                            variant={variant}
                            title={params.row.deleted_at && isDeleted ? 
                                `Eliminado el ${format(new Date(params.row.deleted_at), 'dd/MM/yyyy HH:mm', { locale: es })}` : 
                                undefined
                            }
                        />
                    </Box>
                );
            }
        },
        { 
            field: 'hours_worked', 
            headerName: 'Horas', 
            width: 100,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        height: '100%',
                        width: '100%'
                    }}
                >
                    {params.value || '-'}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 140,
            sortable: false,
            filterable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                    gap: '4px',
                    '& .MuiIconButton-root': {
                        padding: '4px',
                        fontSize: '0.875rem',
                    }
                }}>
                    <Tooltip title="Ver detalles">
                        <IconButton 
                            onClick={() => navigate(`/dashboard/reports/${params.row.id}`)}
                            size="small"
                            sx={{ color: 'info.main' }}
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Imprimir">
                        <IconButton 
                            onClick={() => handlePrint(params.row.id)}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                        >
                            <Print fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {!params.row.is_deleted && isSuperuser && (
                        <Tooltip title="Eliminar">
                            <IconButton 
                                onClick={() => handleDelete(params.row.id)}
                                size="small"
                                sx={{ color: 'error.main' }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )
        }
    ];

    const localeText = {
        // Toolbar
        toolbarDensity: 'Densidad',
        toolbarDensityLabel: 'Densidad',
        toolbarDensityCompact: 'Compacta',
        toolbarDensityStandard: 'Estándar',
        toolbarDensityComfortable: 'Cómoda',
        toolbarColumns: 'Columnas',
        toolbarFilters: 'Filtros',
        toolbarExport: 'Exportar',
        toolbarQuickFilterPlaceholder: 'Buscar...',
        toolbarQuickFilterLabel: 'Buscar',
        
        // Columnas
        columnMenuLabel: 'Menú',
        columnMenuShowColumns: 'Mostrar columnas',
        columnMenuFilter: 'Filtrar',
        columnMenuHideColumn: 'Ocultar',
        columnMenuUnsort: 'Desordenar',
        columnMenuSortAsc: 'Ordenar ASC',
        columnMenuSortDesc: 'Ordenar DESC',
        
        // Filtros
        filterPanelAddFilter: 'Añadir filtro',
        filterPanelDeleteIconLabel: 'Borrar',
        filterPanelOperators: 'Operadores',
        filterPanelOperatorAnd: 'Y',
        filterPanelOperatorOr: 'O',
        filterPanelColumns: 'Columnas',
        
        // Paginación
        footerTotalRows: 'Total de filas:',
        footerTotalVisibleRows: 'Filas visibles:',
        footerRowSelected: 'fila seleccionada',
        footerRowsSelected: 'filas seleccionadas',
        
        // Mensajes
        noRowsLabel: 'No hay partes de trabajo disponibles',
        errorOverlayDefaultLabel: 'Ha ocurrido un error.',
        
        // Exportar
        toolbarExportCSV: 'Descargar CSV',
        toolbarExportPrint: 'Imprimir',
    };

    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Partes de trabajo
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isSuperuser && (
                            <FormControl sx={{ minWidth: 150 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showDeleted}
                                            onChange={(e) => setShowDeleted(e.target.checked)}
                                            name="showDeleted"
                                        />
                                    }
                                    label="Mostrar eliminados"
                                />
                            </FormControl>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/dashboard/reports/create')}
                        >
                            Nuevo Parte
                        </Button>
                    </Box>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={reports}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                            sorting: {
                                sortModel: [{ field: 'date', sort: 'desc' }],
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        loading={loading}
                        autoHeight
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 500 },
                            },
                        }}
                        getRowId={(row) => row.id}
                        localeText={localeText}
                        sx={{
                            border: '1px solid #E0E0E0',
                            borderRadius: 1,
                            '& .MuiDataGrid-row': {
                                borderBottom: '1px solid #F5F5F5',
                            },
                            '& .MuiDataGrid-columnHeader': {
                                backgroundColor: '#F5F5F5',
                                borderRight: '1px solid #E0E0E0',
                                '&:last-child': {
                                    borderRight: 'none',
                                },
                            },
                            '& .MuiDataGrid-cell': {
                                borderRight: '1px solid #F5F5F5',
                                '&:last-child': {
                                    borderRight: 'none',
                                },
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center', // Centrado vertical para todas las celdas
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                borderBottom: '2px solid #E0E0E0',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                borderBottom: '1px solid #E0E0E0',
                                padding: '8px 16px',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '2px solid #E0E0E0',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                backgroundColor: '#FFFFFF',
                            },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                                outline: 'none',
                            },
                        }}
                    />
                </Paper>
            </Box>
        </>
    );
};

export default ReportList;