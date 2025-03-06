import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Button,
    Box,
    IconButton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Delete, Visibility, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import Swal from 'sweetalert2';
import { Toaster, toast } from 'react-hot-toast';

const ReportList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // El backend ya filtra los reportes eliminados
            const response = await axios.get('/reports/reports/');
            setReports(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Error al cargar los partes de trabajo');
            setReports([]);
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

    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70 
        },
        { 
            field: 'incident_title', 
            headerName: 'Incidencia', 
            flex: 1 
        },
        { 
            field: 'customer_name', 
            headerName: 'Cliente', 
            flex: 1 
        },
        { 
            field: 'date', 
            headerName: 'Fecha', 
            flex: 1,
            type: 'date',
            valueGetter: (params) => {
                try {
                    return params.row?.date ? new Date(params.row.date) : null;
                } catch {
                    return null;
                }
            }
        },
        { 
            field: 'status', 
            headerName: 'Estado', 
            width: 120,
            valueGetter: (params) => 
                params.row?.status === 'DRAFT' ? 'Borrador' : 'Completado'
        },
        { 
            field: 'hours_worked', 
            headerName: 'Horas', 
            width: 100,
            type: 'number'
        },
        { 
            field: 'description', 
            headerName: 'Descripción', 
            flex: 1 
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton 
                        onClick={() => navigate(`/dashboard/reports/${params.row.id}`)}
                        size="small"
                        title="Ver detalles"
                    >
                        <Visibility />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleDelete(params.row.id)}
                        size="small"
                        color="error"
                        title="Eliminar parte"
                    >
                        <Delete />
                    </IconButton>
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/dashboard/reports/create')}
                    >
                        Nuevo Parte
                    </Button>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={reports}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
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
                            '& .MuiDataGrid-toolbarContainer': {
                                borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                padding: '8px 16px',
                            },
                        }}
                    />
                </Paper>
            </Box>
        </>
    );
};

export default ReportList;