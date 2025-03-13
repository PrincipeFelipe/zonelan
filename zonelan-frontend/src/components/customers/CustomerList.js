import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    CircularProgress,
    Chip,
    MenuItem,
    Tooltip,
    Card,
    CardContent,
    Divider,
    Grid
} from '@mui/material';
import { Edit, Delete, Add, Print, Visibility, AssessmentOutlined, Close } from '@mui/icons-material';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import axios from '../../utils/axiosConfig';
import authService from '../../services/authService';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import ReportDialog from '../reports/ReportDialog';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        business_name: '',  // Nuevo campo
        tax_id: '',         // Nuevo campo
        address: '',
        phone: '',
        email: '',
        contact_person: ''
    });

    const [openIncidencesDialog, setOpenIncidencesDialog] = useState(false);
    const [selectedCustomerIncidences, setSelectedCustomerIncidences] = useState(null);
    const [customerIncidences, setCustomerIncidences] = useState([]);
    const [loadingIncidences, setLoadingIncidences] = useState(false);

    const [incidentToEdit, setIncidentToEdit] = useState(null);
    const [openEditIncidentDialog, setOpenEditIncidentDialog] = useState(false);

    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
    const [openIncidentDetailDialog, setOpenIncidentDetailDialog] = useState(false);
    const [loadingIncidentDetail, setLoadingIncidentDetail] = useState(false);
    const [incidentReports, setIncidentReports] = useState([]);
    const [openReportDialog, setOpenReportDialog] = useState(false);

    const currentUser = authService.getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/customers/');
            setCustomers(response.data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los clientes'
            });
        }
    };

    const handleOpenDialog = (customer = null) => {
        if (customer) {
            setEditMode(true);
            setSelectedCustomer(customer);
            setNewCustomer({ ...customer });
        } else {
            setEditMode(false);
            setSelectedCustomer(null);
            setNewCustomer({
                name: '',
                business_name: '',  // Nuevo campo
                tax_id: '',         // Nuevo campo
                address: '',
                phone: '',
                email: '',
                contact_person: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setSelectedCustomer(null);
    };

    const handleInputChange = (e) => {
        setNewCustomer({
            ...newCustomer,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            // Validar campos requeridos
            if (!newCustomer.name || !newCustomer.email || !newCustomer.phone || !newCustomer.address) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, completa todos los campos obligatorios'
                });
                return;
            }

            const dataToSend = {
                ...newCustomer,
                business_name: newCustomer.business_name || null,  // Asegurar que se envía null si está vacío
                tax_id: newCustomer.tax_id || null,                // Asegurar que se envía null si está vacío
                contact_person: newCustomer.contact_person || null // Asegurar que se envía null si está vacío
            };

            if (editMode) {
                await axios.put(`/customers/${selectedCustomer.id}/`, dataToSend);
                toast.success('Cliente actualizado correctamente');
            } else {
                await axios.post('/customers/', dataToSend);
                toast.success('Cliente creado correctamente');
            }
            handleCloseDialog();
            fetchCustomers();
        } catch (error) {
            console.error('Error details:', error.response?.data);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Error al procesar la operación'
            });
        }
    };

    const handleDeleteCustomer = async (customerId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/customers/${customerId}/`);
                toast.success('Cliente eliminado correctamente');
                fetchCustomers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el cliente'
                });
            }
        }
    };

    const handlePrintCustomerReport = async (customer) => {
        try {
            // Obtener la fecha actual en formato YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            // Fecha de hace 3 meses como valor por defecto
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const defaultStartDate = threeMonthsAgo.toISOString().split('T')[0];

            // Estilos CSS para el cuadro de diálogo
            const dialogStyles = `
                <style>
                    .date-selector-container {
                        margin: 15px 0;
                    }
                    .date-field-container {
                        margin-bottom: 15px;
                    }
                    .date-field-label {
                        display: block;
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #333;
                    }
                    .date-field-input {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .dialog-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #333;
                    }
                </style>
            `;

            // Mostrar formulario para seleccionar fechas con estilos mejorados
            const { value: formValues, isConfirmed } = await Swal.fire({
                title: `Informe de ${customer.name}`,
                html: `
                    ${dialogStyles}
                    <div class="dialog-title">Seleccione el rango de fechas</div>
                    <div class="date-selector-container">
                        <div class="date-field-container">
                            <label class="date-field-label" for="swal-start-date">Fecha inicio:</label>
                            <input id="swal-start-date" type="date" class="date-field-input" value="${defaultStartDate}">
                        </div>
                        <div class="date-field-container">
                            <label class="date-field-label" for="swal-end-date">Fecha fin:</label>
                            <input id="swal-end-date" type="date" class="date-field-input" value="${today}">
                        </div>
                    </div>
                `,
                customClass: {
                    confirmButton: 'swal-confirm-button',
                    cancelButton: 'swal-cancel-button',
                    container: 'swal-container'
                },
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Generar informe',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const startDate = document.getElementById('swal-start-date').value;
                    const endDate = document.getElementById('swal-end-date').value;
                    
                    if (!startDate || !endDate) {
                        Swal.showValidationMessage('Ambas fechas son requeridas');
                        return false;
                    }
                    
                    if (startDate > endDate) {
                        Swal.showValidationMessage('La fecha de inicio no puede ser posterior a la fecha de fin');
                        return false;
                    }
                    
                    return { startDate, endDate };
                }
            });

            if (!isConfirmed) return;

            // Pedir al usuario que seleccione el tipo de informe
            const { isConfirmed: reportTypeConfirmed, value: reportType } = await Swal.fire({
                title: 'Tipo de informe',
                html: `
                    ${dialogStyles}
                    <div class="dialog-title">¿Qué tipo de informe desea generar?</div>
                    <div style="margin-top: 15px; text-align: left;">
                        <p><strong>Informe Unificado:</strong> Muestra todas las incidencias y sus reportes en un único documento.</p>
                        <p><strong>Informe Segregado:</strong> Muestra un resumen general seguido de detalles por incidencia.</p>
                    </div>
                `,
                icon: 'question',
                showDenyButton: true,
                confirmButtonText: 'Unificado',
                denyButtonText: 'Segregado',
                confirmButtonColor: '#3085d6',
                denyButtonColor: '#6c757d'
            });

            if (!reportTypeConfirmed && reportType !== false) return;

            const isUnified = reportTypeConfirmed;
            
            // Generar el informe con los datos seleccionados
            await generateCustomerReport(customer, formValues.startDate, formValues.endDate, isUnified);
            
        } catch (error) {
            console.error('Error al generar informe:', error);
            toast.error('Error al generar el informe');
        }
    };

    // Actualizar la función generateCustomerReport
    const generateCustomerReport = async (customer, startDate, endDate, isUnified) => {
        try {
            // Mostrar loading mientras obtiene datos
            const loadingToast = toast.loading('Generando informe...');
            
            // Obtener todas las incidencias del cliente en el rango de fechas
            const incidentsResponse = await axios.get(`/incidents/incidents/?customer=${customer.id}&start_date=${startDate}&end_date=${endDate}`);
            const incidents = Array.isArray(incidentsResponse.data) ? incidentsResponse.data : [];

            if (incidents.length === 0) {
                toast.dismiss(loadingToast);
                toast.error(`No hay incidencias registradas para ${customer.name} en el período seleccionado`);
                return;
            }

            // Obtener todos los reportes para las incidencias encontradas
            const reportPromises = incidents.map(incident => 
                axios.get(`/reports/reports/?incident=${incident.id}`)
            );
            
            const reportResponses = await Promise.all(reportPromises.map(p => 
                p.catch(error => ({ data: [] })) // Manejar errores individuales
            ));
            
            const reportsMap = new Map();
            
            reportResponses.forEach((response, index) => {
                if (Array.isArray(response.data) && response.data.length > 0) {
                    reportsMap.set(incidents[index].id, response.data);
                }
            });

            // Calcular estadísticas
            let totalIncidents = incidents.length;
            let openIncidents = incidents.filter(inc => inc.status === 'PENDING' || inc.status === 'IN_PROGRESS').length;
            let resolvedIncidents = incidents.filter(inc => inc.status === 'RESOLVED' || inc.status === 'CLOSED').length;
            
            let totalReports = 0;
            let totalHours = 0;
            let allTechnicians = new Set();
            let allMaterials = new Map();
            
            // Procesar todos los reportes para obtener estadísticas
            reportsMap.forEach((reports) => {
                totalReports += reports.length;
                
                reports.forEach(report => {
                    totalHours += Number(report.hours_worked) || 0;
                    
                    if (report.technicians && Array.isArray(report.technicians)) {
                        report.technicians.forEach(tech => {
                            allTechnicians.add(tech.technician_name);
                        });
                    }
                    
                    if (report.materials_used && Array.isArray(report.materials_used)) {
                        report.materials_used.forEach(material => {
                            const current = allMaterials.get(material.material_name) || 0;
                            allMaterials.set(material.material_name, current + material.quantity);
                        });
                    }
                });
            });

            // Crear un resumen de incidencias por estado
            const statusSummary = {
                PENDING: 0,
                IN_PROGRESS: 0,
                RESOLVED: 0,
                CLOSED: 0
            };

            incidents.forEach(incident => {
                statusSummary[incident.status] = (statusSummary[incident.status] || 0) + 1;
            });

            // Crear un resumen de incidencias por prioridad
            const prioritySummary = {};
            incidents.forEach(incident => {
                prioritySummary[incident.priority] = (prioritySummary[incident.priority] || 0) + 1;
            });

            // Completar proceso de generación del informe
            toast.dismiss(loadingToast);

            // Crear el contenido HTML para el informe
            let reportContent = '';

            if (isUnified) {
                // Informe unificado
                reportContent = createUnifiedReport(customer, startDate, endDate, incidents, reportsMap, {
                    totalIncidents, openIncidents, resolvedIncidents, totalReports, 
                    totalHours, allTechnicians, allMaterials
                });
            } else {
                // Informe segregado
                reportContent = createSegregatedReport(customer, startDate, endDate, incidents, reportsMap, {
                    totalIncidents, openIncidents, resolvedIncidents, totalReports, 
                    totalHours, allTechnicians, allMaterials
                });
            }

            // Añadir los estilos optimizados para impresión
            reportContent = reportContent.replace('</head>', `<style>${printStyles}</style></head>`);

            // Crear un iframe oculto en la página actual
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Escribir el contenido del informe en el iframe
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(reportContent);
            doc.close();
            
            // Esperar a que se carguen las imágenes y contenido
            setTimeout(() => {
                try {
                    // Imprimir el contenido del iframe
                    iframe.contentWindow.print();
                    
                    // Eliminar el iframe después de la impresión (con retraso para asegurar que termine)
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                } catch (e) {
                    console.error('Error al imprimir:', e);
                    toast.error('Error al imprimir el informe');
                    document.body.removeChild(iframe);
                }
            }, 1000);

        } catch (error) {
            console.error('Error al generar el informe:', error);
            toast.error('Error al generar el informe');
        }
    };

    // Añadir estos estilos adicionales para mejorar la impresión
    const printStyles = `
        @media print {
            @page {
                size: A4 portrait;
                margin: 1.5cm;
            }
            body {
                font-size: 11pt;
                line-height: 1.3;
            }
            h1 {
                font-size: 18pt;
            }
            h2 {
                font-size: 16pt;
                page-break-before: always;
            }
            .incident {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .report-row {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .no-break {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            table {
                font-size: 9pt;
            }
            .pagebreak {
                page-break-before: always;
            }
            .first-page {
                page-break-after: always;
            }
            .chart-table {
                page-break-inside: avoid;
            }
            .pie-chart-svg {
                display: block !important;
                margin: 0 auto !important;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .chart-cell, .legend-cell {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
    `;

    // Función para crear el informe unificado
    const createUnifiedReport = (customer, startDate, endDate, incidents, reportsMap, stats) => {
        const { totalIncidents, openIncidents, resolvedIncidents, totalReports, 
                totalHours, allTechnicians, allMaterials } = stats;

        // Formatear las fechas para mostrar
        const formattedStartDate = format(parseISO(startDate), 'dd/MM/yyyy', { locale: es });
        const formattedEndDate = format(parseISO(endDate), 'dd/MM/yyyy', { locale: es });
        
        // Crear el HTML para los materiales
        let materialsHtml = '';
        if (allMaterials.size > 0) {
            materialsHtml = `
                <div class="section">
                    <div class="section-title">Materiales Utilizados (Total)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Cantidad Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from(allMaterials).map(([material, quantity]) => `
                                <tr>
                                    <td>${material}</td>
                                    <td>${quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            materialsHtml = `
                <div class="section">
                    <div class="section-title">Materiales Utilizados (Total)</div>
                    <p><em>No se han utilizado materiales en este período</em></p>
                </div>
            `;
        }
        
        // Si no hay técnicos involucrados
        const techniciansList = allTechnicians.size > 0 
            ? Array.from(allTechnicians).map(tech => `<span>${tech}</span>`).join(', ')
            : '<em>No hay técnicos asignados</em>';
        
        // Crear un resumen de incidencias por estado
        const statusSummary = {
            PENDING: 0,
            IN_PROGRESS: 0,
            RESOLVED: 0,
            CLOSED: 0
        };
        
        incidents.forEach(incident => {
            statusSummary[incident.status] = (statusSummary[incident.status] || 0) + 1;
        });
        
        // Crear un resumen de incidencias por prioridad
        const prioritySummary = {};
        incidents.forEach(incident => {
            prioritySummary[incident.priority] = (prioritySummary[incident.priority] || 0) + 1;
        });
        
        // Crear HTML para el informe completo - VERSIÓN UNIFICADA/RESUMIDA
        return `
            <html>
                <head>
                    <title>Informe de Cliente: ${customer.name} (${formattedStartDate} - ${formattedEndDate})</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            line-height: 1.6;
                        }
                        h1 { 
                            text-align: center; 
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .date-range {
                            text-align: center;
                            font-size: 14px;
                            margin-bottom: 30px;
                            color: #666;
                        }
                        .section {
                            margin-bottom: 30px;
                            break-inside: avoid;
                        }
                        .section-title {
                            font-size: 18px;
                            font-weight: bold;
                            border-bottom: 1px solid #ccc;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .summary-box {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            gap: 15px;
                            margin-bottom: 20px;
                        }
                        .summary-item {
                            background-color: #f9f9f9;
                            border: 1px solid #ddd;
                            padding: 15px;
                            text-align: center;
                            border-radius: 5px;
                        }
                        .summary-value {
                            font-size: 24px;
                            font-weight: bold;
                            color: #333;
                        }
                        .summary-label {
                            font-size: 14px;
                            color: #666;
                        }
                        .incident-box {
                            border: 1px solid #ddd;
                            padding: 15px;
                            margin-bottom: 15px;
                            background-color: #fff;
                            border-radius: 5px;
                        }
                        .technicians-list {
                            margin-top: 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        th, td {
                            border: 1px solid #ccc;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .chart {
                            width: 100%;
                            margin: 20px 0;
                        }
                        .status-bar {
                            display: flex;
                            height: 30px;
                            width: 100%;
                            margin-bottom: 10px;
                            border-radius: 4px;
                            overflow: hidden;
                        }
                        .status-segment {
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                        }
                        .status-pending { background-color: #ff9800; }
                        .status-in-progress { background-color: #2196f3; }
                        .status-resolved { background-color: #4caf50; }
                        .status-closed { background-color: #9e9e9e; }
                        .status-label {
                            display: inline-block;
                            width: 12px;
                            height: 12px;
                            margin-right: 5px;
                            border-radius: 2px;
                        }
                        .legend {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            margin-top: 10px;
                        }
                        .legend-item {
                            display: flex;
                            align-items: center;
                        }
                        @media print {
                            @page { margin: 2cm; }
                        }
                    </style>
                    <style>${printStyles}</style>
                    <style>
                        .chart-container {
                            display: flex;
                            flex-direction: row;  /* Esto fuerza la disposición horizontal */
                            align-items: center;
                            justify-content: flex-start;  /* Alineación al inicio */
                            gap: 30px;
                            flex-wrap: nowrap;  /* Evita que los elementos se envuelvan */
                            margin: 20px 0;
                            width: 100%;
                        }
                        .pie-chart-wrapper {
                            flex: 0 0 250px;  /* Ancho fijo */
                            margin: 0;
                        }
                        .pie-chart-wrapper {
                            flex: 0 0 250px;
                            margin: 0 auto;
                        }
                        .pie-chart {
                            width: 250px;
                            height: 250px;
                            border-radius: 50%;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        .pie-segment {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: conic-gradient(var(--bg) var(--start), var(--bg) var(--end), transparent var(--end));
                        }
                        .pie-chart-center {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 120px;
                            height: 120px;
                            background-color: white;
                            border-radius: 50%;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            box-shadow: 0 0 8px rgba(0,0,0,0.1);
                            z-index: 1;
                        }
                        .pie-chart-total {
                            font-size: 32px;
                            font-weight: bold;
                            color: #333;
                        }
                        .pie-chart-label {
                            font-size: 14px;
                            color: #666;
                        }
                        .chart-legend {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                            padding-left: 15px;
                            border-left: 1px solid #eee;
                            margin-left: 15px;
                        }
                        .legend-item {
                            display: flex;
                            align-items: center;
                            font-size: 14px;
                            padding: 5px 0;
                        }
                        .status-label {
                            display: inline-block;
                            width: 16px;
                            height: 16px;
                            margin-right: 8px;
                            border-radius: 3px;
                        }
                        @media (max-width: 768px) {
                            .chart-container {
                                flex-direction: column;
                            }
                            .pie-chart-wrapper {
                                margin-bottom: 20px;
                            }
                        }
                        @media print {
                            .pie-chart {
                                page-break-inside: avoid;
                            }
                            .chart-container {
                                page-break-inside: avoid;
                            }
                        }
                        @media (max-width: 600px) {  /* Reducir el punto de quiebre */
                            .chart-container {
                                flex-direction: column;
                                align-items: center;
                            }
                            .chart-legend {
                                padding-left: 0;
                                border-left: none;
                                margin-left: 0;
                                margin-top: 20px;
                                width: 100%;  /* Ocupar todo el ancho disponible */
                            }
                            .pie-chart-wrapper {
                                margin-bottom: 20px;
                            }
                        }
                    </style>
                    <style>
                        .chart-table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            border: none;
                            margin: 20px 0;
                        }

                        .chart-table td {
                            border: none;
                            padding: 0;
                        }

                        .chart-table .chart-cell {
                            width: 250px;
                            text-align: center;
                            vertical-align: middle;
                        }

                        .chart-table .legend-cell {
                            vertical-align: middle;
                            padding-left: 20px;
                            border-left: 1px solid #eee;
                        }

                        .pie-chart-svg {
                            display: block;
                            margin: 0 auto;
                            transform: rotate(-90deg);
                        }

                        @media print {
                            .chart-table {
                                page-break-inside: avoid;
                            }
                        }
                    </style>
                    <style>
                        .customer-business-name {
                            text-align: center;
                            font-size: 16px;
                            margin-bottom: 5px;
                            color: #555;
                        }
                        .customer-tax-id {
                            text-align: center;
                            font-size: 14px;
                            margin-bottom: 15px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <h1>Informe de Cliente: ${customer.name}</h1>
                    ${customer.business_name ? `<div class="customer-business-name">Nombre Comercial: ${customer.business_name}</div>` : ''}
                    ${customer.tax_id ? `<div class="customer-tax-id">CIF/NIF: ${customer.tax_id}</div>` : ''}
                    <div class="date-range">Período: ${formattedStartDate} - ${formattedEndDate}</div>
                    
                    <div class="section">
                        <div class="section-title">Resumen General</div>
                        <div class="summary-box">
                            <div class="summary-item">
                                <div class="summary-value">${totalIncidents}</div>
                                <div class="summary-label">Incidencias Total</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${totalReports}</div>
                                <div class="summary-label">Partes de Trabajo</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${totalHours.toFixed(2)}</div>
                                <div class="summary-label">Horas Trabajadas</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${openIncidents}</div>
                                <div class="summary-label">Incidencias Abiertas</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${resolvedIncidents}</div>
                                <div class="summary-label">Incidencias Resueltas</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${allTechnicians.size}</div>
                                <div class="summary-label">Técnicos Involucrados</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Distribución de Incidencias por Estado</div>
                        <div style="text-align: center; margin: 20px 0;">
                            <table class="chart-table">
                                <tr>
                                    <td class="chart-cell">
                                        <svg width="250" height="250" viewBox="0 0 100 100" class="pie-chart-svg">
                                            ${(() => {
                                                // Variables para el cálculo de sectores
                                                let html = '';
                                                let startAngle = 0;
                                                let colors = {
                                                    'PENDING': '#ff9800', 
                                                    'IN_PROGRESS': '#2196f3', 
                                                    'RESOLVED': '#4caf50', 
                                                    'CLOSED': '#9e9e9e'
                                                };
                                                
                                                // Generar sectores del gráfico
                                                Object.entries(statusSummary).forEach(([status, count]) => {
                                                    if (count === 0) return;
                                                    
                                                    const percentage = count / totalIncidents;
                                                    const angle = percentage * 360;
                                                    const endAngle = startAngle + angle;
                                                    
                                                    // Cálculo de coordenadas para el arco SVG
                                                    const startRad = startAngle * Math.PI / 180;
                                                    const endRad = endAngle * Math.PI / 180;
                                                    
                                                    const x1 = 50 + 50 * Math.cos(startRad);
                                                    const y1 = 50 + 50 * Math.sin(startRad);
                                                    const x2 = 50 + 50 * Math.cos(endRad);
                                                    const y2 = 50 + 50 * Math.sin(endRad);
                                                    
                                                    const largeArc = angle > 180 ? 1 : 0;
                                                    
                                                    // Construir el path para el sector
                                                    html += `
                                                        <path 
                                                            d="M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z" 
                                                            fill="${colors[status]}" 
                                                            stroke="white" 
                                                            stroke-width="0.5"
                                                        />
                                                    `;
                                                    
                                                    startAngle = endAngle;
                                                });
                                                
                                                return html;
                                            })()}
                                            
                                            <!-- Círculo central blanco -->
                                            <circle cx="50" cy="50" r="25" fill="white" />
                                            
                                            <!-- Texto central -->
                                            <g transform="rotate(90, 50, 50)">
                                                <text x="50" y="45" text-anchor="middle" font-weight="bold" font-size="12" fill="#333">${totalIncidents}</text>
                                                <text x="50" y="60" text-anchor="middle" font-size="5" fill="#666">Total</text>
                                            </g>
                                        </svg>
                                    </td>
                                    <td class="legend-cell">
                                        ${Object.entries(statusSummary).map(([status, count]) => {
                                            if (count === 0) return '';
                                            
                                            const percentage = Math.round((count / totalIncidents) * 100);
                                            let statusClass = '';
                                            let statusName = '';
                                            
                                            switch(status) {
                                                case 'PENDING': 
                                                    statusClass = 'status-pending'; 
                                                    statusName = 'Pendientes'; 
                                                    break;
                                                case 'IN_PROGRESS': 
                                                    statusClass = 'status-in-progress'; 
                                                    statusName = 'En Progreso'; 
                                                    break;
                                                case 'RESOLVED': 
                                                    statusClass = 'status-resolved'; 
                                                    statusName = 'Resueltas'; 
                                                    break;
                                                case 'CLOSED': 
                                                    statusClass = 'status-closed'; 
                                                    statusName = 'Cerradas'; 
                                                    break;
                                            }
                                            
                                            return `
                                                <div class="legend-item">
                                                    <span class="status-label ${statusClass}"></span> 
                                                    ${statusName} (${count}) - ${percentage}%
                                                </div>
                                            `;
                                        }).join('')}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                        <table>
                            <thead>
                                <tr>
                                    <th>Prioridad</th>
                                    <th>Cantidad</th>
                                    <th>Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(prioritySummary).map(([priority, count]) => `
                                    <tr>
                                        <td>${priority}</td>
                                        <td>${count}</td>
                                        <td>${Math.round(count / totalIncidents * 100)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Listado de Incidencias</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                    <th>Fecha Creación</th>
                                    <th>Reportes</th>
                                    <th>Horas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incidents.map(incident => {
                                    const reports = reportsMap.get(incident.id) || [];
                                    const incidentHours = reports.reduce((total, report) => total + (Number(report.hours_worked) || 0), 0);
                                    
                                    let statusClass = '';
                                    let statusText = '';
                                    switch(incident.status) {
                                        case 'PENDING': statusText = 'Pendiente'; break;
                                        case 'IN_PROGRESS': statusText = 'En Progreso'; break;
                                        case 'RESOLVED': statusText = 'Resuelta'; break;
                                        case 'CLOSED': statusText = 'Cerrada'; break;
                                        default: statusText = incident.status;
                                    }
                                    
                                    return `
                                        <tr>
                                            <td>#${incident.id}</td>
                                            <td>${incident.title}</td>
                                            <td>${statusText}</td>
                                            <td>${incident.priority}</td>
                                            <td>${format(parseISO(incident.created_at), 'dd/MM/yyyy', { locale: es })}</td>
                                            <td>${reports.length}</td>
                                            <td>${incidentHours.toFixed(2)}h</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${materialsHtml}
                    
                    <div class="section">
                        <div class="section-title">Técnicos Involucrados</div>
                        <div class="technicians-list">
                            ${techniciansList}
                        </div>
                    </div>
                </body>
            </html>
        `;
    };

// Función para crear el informe segregado con diseño mejorado
const createSegregatedReport = (customer, startDate, endDate, incidents, reportsMap, stats) => {
    const { totalIncidents, openIncidents, resolvedIncidents, totalReports, 
            totalHours, allTechnicians, allMaterials } = stats;

    // Formatear las fechas
    const formattedStartDate = format(parseISO(startDate), 'dd/MM/yyyy', { locale: es });
    const formattedEndDate = format(parseISO(endDate), 'dd/MM/yyyy', { locale: es });
    
    // Crear un resumen de incidencias por estado - AÑADIR ESTA PARTE
    const statusSummary = {
        PENDING: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0
    };
    
    incidents.forEach(incident => {
        statusSummary[incident.status] = (statusSummary[incident.status] || 0) + 1;
    });
    
    return `
        <html>
            <head>
                <title>Informe de Cliente: ${customer.name} (${formattedStartDate} - ${formattedEndDate})</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        line-height: 1.5;
                        color: #333;
                    }
                    h1 { 
                        text-align: center; 
                        color: #2c3e50;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #2c3e50;
                        border-bottom: 1px solid #bdc3c7;
                        padding-bottom: 5px;
                        margin-top: 30px;
                        margin-bottom: 20px;
                        page-break-after: avoid;
                    }
                    .date-range {
                        text-align: center;
                        font-size: 14px;
                        margin-bottom: 25px;
                        color: #7f8c8d;
                        font-style: italic;
                    }
                    .summary-section {
                        margin-bottom: 30px;
                        background-color: #f9f9f9;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-bottom: 25px;
                    }
                    .summary-item {
                        background-color: #ffffff;
                        padding: 15px;
                        border-radius: 6px;
                        text-align: center;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                    .summary-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #3498db;
                        margin-bottom: 5px;
                    }
                    .incident {
                        margin-bottom: 30px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        background-color: #fff;
                        overflow: hidden;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        page-break-inside: avoid;
                    }
                    .incident-header {
                        background-color: #f5f7fa;
                        padding: 15px;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .incident-content {
                        padding: 15px;
                    }
                    .incident-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-bottom: 10px;
                    }
                    .incident-meta {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    .meta-item {
                        margin-bottom: 5px;
                    }
                    .meta-label {
                        font-weight: bold;
                        margin-right: 5px;
                        color: #7f8c8d;
                    }
                    .description-box {
                        background-color: #f9f9f9;
                        padding: 10px;
                        border-radius: 4px;
                        margin-bottom: 15px;
                        border-left: 4px solid #3498db;
                    }
                    .reports-container {
                        margin-top: 20px;
                    }
                    .report-item {
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        padding: 15px;
                        margin-bottom: 15px;
                        background-color: #fff;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                    .report-header {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                    }
                    .report-date {
                        font-weight: bold;
                    }
                    .report-status {
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .status-completed {
                        background-color: #2ecc71;
                        color: white;
                    }
                    .status-draft {
                        background-color: #f39c12;
                        color: white;
                    }
                    .report-info {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    .section {
                        margin-bottom: 15px;
                    }
                    .section-title {
                        font-weight: bold;
                        color: #34495e;
                        margin-bottom: 5px;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        font-size: 13px;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .materials-table {
                        margin-top: 10px;
                    }
                    .materials-table th, .materials-table td {
                        text-align: left;
                        padding: 6px 8px;
                    }
                    .status-pending { color: #f39c12; }
                    .status-in-progress { color: #3498db; }
                    .status-resolved { color: #2ecc71; }
                    .status-closed { color: #7f8c8d; }
                    
                    .status-bar {
                        display: flex;
                        height: 25px;
                        width: 100%;
                        margin: 15px 0;
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .status-segment {
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    .status-segment-pending { background-color: #f39c12; }
                    .status-segment-progress { background-color: #3498db; }
                    .status-segment-resolved { background-color: #2ecc71; }
                    .status-segment-closed { background-color: #7f8c8d; }
                    
                    .legend {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin: 10px 0;
                        font-size: 12px;
                    }
                    .legend-item {
                        display: flex;
                        align-items: center;
                    }
                    .legend-color {
                        display: inline-block;
                        width: 12px;
                        height: 12px;
                        margin-right: 5px;
                        border-radius: 2px;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                    
                    @media print {
                        @page { 
                            margin: 1.5cm;
                            size: portrait; 
                        }
                        body {
                            font-size: 12pt;
                        }
                        .first-page { 
                            page-break-after: always;
                        }
                        .incident { 
                            page-break-inside: avoid; 
                            margin-bottom: 20px;
                        }
                        .report-item { 
                            page-break-inside: avoid;
                        }
                        h2 { 
                            margin-top: 20px;
                        }
                        table {
                            font-size: 10pt;
                        }
                        .no-break {
                            page-break-inside: avoid;
                        }
                    }
                </style>
                <style>
                    .chart-container {
                        display: flex;
                        flex-direction: row;  /* Esto fuerza la disposición horizontal */
                        align-items: center;
                        justify-content: flex-start;  /* Alineación al inicio */
                        gap: 30px;
                        flex-wrap: nowrap;  /* Evita que los elementos se envuelvan */
                        margin: 20px 0;
                        width: 100%;
                    }
                    .pie-chart-wrapper {
                        flex: 0 0 250px;  /* Ancho fijo */
                        margin: 0;
                    }
                    .pie-chart-wrapper {
                        flex: 0 0 250px;
                        margin: 0 auto;
                    }
                    .pie-chart {
                        width: 250px;
                        height: 250px;
                        border-radius: 50%;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .pie-segment {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: conic-gradient(var(--bg) var(--start), var(--bg) var(--end), transparent var(--end));
                    }
                    .pie-chart-center {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 120px;
                        height: 120px;
                        background-color: white;
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 0 8px rgba(0,0,0,0.1);
                        z-index: 1;
                    }
                    .pie-chart-total {
                        font-size: 32px;
                        font-weight: bold;
                        color: #333;
                    }
                    .pie-chart-label {
                        font-size: 14px;
                        color: #666;
                    }
                    .chart-legend {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding-left: 15px;
                        border-left: 1px solid #eee;
                        margin-left: 15px;
                    }
                    .legend-item {
                        display: flex;
                        align-items: center;
                        font-size: 14px;
                        padding: 5px 0;
                    }
                    .status-label {
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        margin-right: 8px;
                        border-radius: 3px;
                    }
                    @media (max-width: 768px) {
                        .chart-container {
                            flex-direction: column;
                        }
                        .pie-chart-wrapper {
                            margin-bottom: 20px;
                        }
                    }
                    @media print {
                        .pie-chart {
                            page-break-inside: avoid;
                        }
                        .chart-container {
                            page-break-inside: avoid;
                        }
                    }
                    @media (max-width: 600px) {  /* Reducir el punto de quiebre */
                        .chart-container {
                            flex-direction: column;
                            align-items: center;
                        }
                        .chart-legend {
                            padding-left: 0;
                            border-left: none;
                            margin-left: 0;
                            margin-top: 20px;
                            width: 100%;  /* Ocupar todo el ancho disponible */
                        }
                        .pie-chart-wrapper {
                            margin-bottom: 20px;
                        }
                    }
                </style>
                <style>
                    .chart-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        border: none;
                        margin: 20px 0;
                    }

                    .chart-table td {
                        border: none;
                        padding: 0;
                    }

                    .chart-table .chart-cell {
                        width: 250px;
                        text-align: center;
                        vertical-align: middle;
                    }

                    .chart-table .legend-cell {
                        vertical-align: middle;
                        padding-left: 20px;
                        border-left: 1px solid #eee;
                    }

                    .pie-chart-svg {
                        display: block;
                        margin: 0 auto;
                        transform: rotate(-90deg);
                    }

                    @media print {
                        .chart-table {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Informe de Cliente: ${customer.name}</h1>
                ${customer.business_name ? `<div class="customer-business-name">Nombre Comercial: ${customer.business_name}</div>` : ''}
                ${customer.tax_id ? `<div class="customer-tax-id">CIF/NIF: ${customer.tax_id}</div>` : ''}
                <div class="date-range">Período: ${formattedStartDate} - ${formattedEndDate}</div>
                
                <div class="summary-section first-page">
                    <h2 style="margin-top: 0;">Resumen General</h2>
                    
                    <!-- Estadísticas de estado de incidencias -->
                    <div class="section">
                        <div class="section-title">Distribución de Incidencias por Estado</div>
                        <div class="chart-container" style="display: flex !important; flex-direction: row !important;">
                            <div class="pie-chart-wrapper" style="flex: 0 0 250px; min-width: 250px;">
                                <svg width="250" height="250" viewBox="0 0 100 100" class="pie-chart-svg">
                                    ${(() => {
                                        // Variables para el cálculo de sectores
                                        let html = '';
                                        let startAngle = 0;
                                        let colors = {
                                            'PENDING': '#ff9800', 
                                            'IN_PROGRESS': '#2196f3', 
                                            'RESOLVED': '#4caf50', 
                                            'CLOSED': '#9e9e9e'
                                        };
                                        
                                        // Generar sectores del gráfico
                                        Object.entries(statusSummary).forEach(([status, count]) => {
                                            if (count === 0) return;
                                            
                                            const percentage = count / totalIncidents;
                                            const angle = percentage * 360;
                                            const endAngle = startAngle + angle;
                                            
                                            // Cálculo de coordenadas para el arco SVG
                                            const startRad = startAngle * Math.PI / 180;
                                            const endRad = endAngle * Math.PI / 180;
                                            
                                            const x1 = 50 + 50 * Math.cos(startRad);
                                            const y1 = 50 + 50 * Math.sin(startRad);
                                            const x2 = 50 + 50 * Math.cos(endRad);
                                            const y2 = 50 + 50 * Math.sin(endRad);
                                            
                                            const largeArc = angle > 180 ? 1 : 0;
                                            
                                            // Construir el path para el sector
                                            html += `
                                                <path 
                                                    d="M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z" 
                                                    fill="${colors[status]}" 
                                                    stroke="white" 
                                                    stroke-width="0.5"
                                                />
                                            `;
                                            
                                            startAngle = endAngle;
                                        });
                                        
                                        return html;
                                    })()}
                                    
                                    <!-- Círculo central blanco -->
                                    <circle cx="50" cy="50" r="25" fill="white" />
                                    
                                    <!-- Texto central -->
                                    <g transform="rotate(90, 50, 50)">
                                        <text x="50" y="45" text-anchor="middle" font-weight="bold" font-size="12" fill="#333">${totalIncidents}</text>
                                        <text x="50" y="60" text-anchor="middle" font-size="5" fill="#666">Total</text>
                                    </g>
                                </svg>
                            </div>
                            <div class="chart-legend" style="flex: 1; margin-left: 30px; padding-left: 15px; border-left: 1px solid #eee;">
                                ${Object.entries(statusSummary).map(([status, count]) => {
                                    if (count === 0) return '';
                                    
                                    const percentage = Math.round((count / totalIncidents) * 100);
                                    let statusClass = '';
                                    let statusName = '';
                                    
                                    switch(status) {
                                        case 'PENDING': 
                                            statusClass = 'status-pending'; 
                                            statusName = 'Pendientes'; 
                                            break;
                                        case 'IN_PROGRESS': 
                                            statusClass = 'status-in-progress'; 
                                            statusName = 'En Progreso'; 
                                            break;
                                        case 'RESOLVED': 
                                            statusClass = 'status-resolved'; 
                                            statusName = 'Resueltas'; 
                                            break;
                                        case 'CLOSED': 
                                            statusClass = 'status-closed'; 
                                            statusName = 'Cerradas'; 
                                            break;
                                    }
                                    
                                    return `
                                        <div class="legend-item">
                                            <span class="status-label ${statusClass}"></span> 
                                            ${statusName} (${count}) - ${percentage}%
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-value">${totalIncidents}</div>
                            <div>Incidencias Totales</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${openIncidents}</div>
                            <div>Incidencias Abiertas</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${resolvedIncidents}</div>
                            <div>Incidencias Resueltas</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${totalReports}</div>
                            <div>Partes de Trabajo</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${totalHours.toFixed(2)}</div>
                            <div>Horas Trabajadas</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${allTechnicians.size}</div>
                            <div>Técnicos Involucrados</div>
                        </div>
                    </div>
                    
                    <!-- Tabla resumen de incidencias -->
                    <div class="section">
                        <div class="section-title">Listado de Incidencias</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th>Partes de trabajo</th>
                                    <th>Horas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${incidents.map(incident => {
                                    const reports = reportsMap.get(incident.id) || [];
                                    const incidentHours = reports.reduce((total, report) => 
                                        total + (Number(report.hours_worked) || 0), 0);
                                    
                                    let statusClass = '';
                                    let statusText = '';
                                    switch(incident.status) {
                                        case 'PENDING': statusClass = 'status-pending'; statusText = 'Pendiente'; break;
                                        case 'IN_PROGRESS': statusClass = 'status-in-progress'; statusText = 'En Progreso'; break;
                                        case 'RESOLVED': statusClass = 'status-resolved'; statusText = 'Resuelta'; break;
                                        case 'CLOSED': statusClass = 'status-closed'; statusText = 'Cerrada'; break;
                                        default: statusText = incident.status;
                                    }
                                    
                                    return `
                                        <tr>
                                            <td>#${incident.id}</td>
                                            <td>${incident.title}</td>
                                            <td><span class="${statusClass}">${statusText}</span></td>
                                            <td>${format(parseISO(incident.created_at), 'dd/MM/yyyy', { locale: es })}</td>
                                            <td>${reports.length}</td>
                                            <td>${incidentHours.toFixed(2)}h</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Técnicos Involucrados:</div>
                        ${Array.from(allTechnicians).join(', ') || '<em>No hay técnicos registrados</em>'}
                    </div>
                    
                    ${allMaterials.size > 0 ? `
                        <div class="section">
                            <div class="section-title">Materiales Utilizados:</div>
                            <table class="materials-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Cantidad Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Array.from(allMaterials).map(([material, quantity]) => `
                                        <tr>
                                            <td>${material}</td>
                                            <td>${quantity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}
                </div>
                
                
                <h2>Detalle de Incidencias</h2>
                
                ${incidents.map((incident, index) => {
                    const reports = reportsMap.get(incident.id) || [];
                    
                    // Obtener el estado formateado
                    let statusClass = '';
                    let statusText = '';
                    switch(incident.status) {
                        case 'PENDING':
                            statusClass = 'status-pending';
                            statusText = 'Pendiente';
                            break;
                        case 'IN_PROGRESS':
                            statusClass = 'status-in-progress';
                            statusText = 'En Progreso';
                            break;
                        case 'RESOLVED':
                            statusClass = 'status-resolved';
                            statusText = 'Resuelta';
                            break;
                        case 'CLOSED':
                            statusClass = 'status-closed';
                            statusText = 'Cerrada';
                            break;
                        default:
                            statusText = incident.status;
                    }
                    
                    // Calcular horas totales y técnicos de esta incidencia
                    const incidentHours = reports.reduce((total, report) => total + (Number(report.hours_worked) || 0), 0);
                    const incidentTechnicians = new Set();
                    const incidentMaterials = new Map();
                    
                    reports.forEach(report => {
                        report.technicians?.forEach(tech => {
                            incidentTechnicians.add(tech.technician_name);
                        });
                        
                        report.materials_used?.forEach(material => {
                            const current = incidentMaterials.get(material.material_name) || 0;
                            incidentMaterials.set(material.material_name, current + material.quantity);
                        });
                    });
                    
                    return `
                        <div class="incident">
                            <div class="incident-header">
                                <div class="incident-title">#${incident.id} - ${incident.title}</div>
                                <div class="incident-meta">
                                    <div class="meta-item">
                                        <span class="meta-label">Estado:</span>
                                        <span class="${statusClass}">${statusText}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Fecha:</span>
                                        ${format(parseISO(incident.created_at), 'dd/MM/yyyy', { locale: es })}
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Prioridad:</span>
                                        ${incident.priority}
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Horas:</span>
                                        ${incidentHours.toFixed(2)}h
                                    </div>
                                </div>
                            </div>
                            
                            <div class="incident-content">
                                <div class="description-box">
                                    <strong>Descripción:</strong><br>
                                    ${incident.description}
                                </div>
                                
                                ${incidentTechnicians.size > 0 ? `
                                    <div class="section">
                                        <div class="section-title">Técnicos asignados:</div>
                                        ${Array.from(incidentTechnicians).join(', ')}
                                    </div>
                                ` : ''}
                                
                                ${incidentMaterials.size > 0 ? `
                                    <div class="section">
                                        <div class="section-title">Materiales utilizados:</div>
                                        <table class="materials-table">
                                            <thead>
                                                <tr>
                                                    <th>Material</th>
                                                    <th>Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${Array.from(incidentMaterials).map(([material, quantity]) => `
                                                    <tr>
                                                        <td>${material}</td>
                                                        <td>${quantity}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : ''}
                                
                                ${reports.length > 0 ? `
                                    <div class="reports-container">
                                        <div class="section-title">Partes de trabajo (${reports.length}):</div>
                                        ${reports.map(report => `
                                            <div class="report-item">
                                                <div class="report-header">
                                                    <span class="report-date">${format(parseISO(report.date), 'dd/MM/yyyy', { locale: es })}</span>
                                                    <span class="report-status ${report.status === 'COMPLETED' ? 'status-completed' : 'status-draft'}">
                                                        ${report.status === 'COMPLETED' ? 'Completado' : 'Borrador'}
                                                    </span>
                                                </div>
                                                
                                                <div class="report-info">
                                                    <div>
                                                        <span class="meta-label">Horas:</span> ${report.hours_worked || '0'}
                                                    </div>
                                                    <div>
                                                        <span class="meta-label">Técnicos:</span> ${report.technicians?.map(t => t.technician_name).join(', ') || 'Ninguno'}
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <div class="section-title">Descripción:</div>
                                                    <div>${report.description}</div>
                                                </div>
                                                
                                                ${report.materials_used?.length > 0 ? `
                                                    <div style="margin-top: 10px;">
                                                        <div class="section-title">Materiales utilizados:</div>
                                                        <table class="materials-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>Cantidad</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${report.materials_used.map(material => `
                                                                    <tr>
                                                                        <td>${material.material_name}</td>
                                                                        <td>${material.quantity}</td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="section">No hay partes de trabajo asociados</div>'}
                            </div>
                        </div>
                        
                    `;
                }).join('')}
            </body>
        </html>
    `;
};

    const handleViewIncidences = async (customer) => {
        try {
            setSelectedCustomerIncidences(customer);
            setLoadingIncidences(true);
            setOpenIncidencesDialog(true);
            
            // Obtener todas las incidencias del cliente
            const response = await axios.get(`/incidents/incidents/?customer=${customer.id}`);
            
            if (Array.isArray(response.data)) {
                setCustomerIncidences(response.data);
            } else {
                setCustomerIncidences([]);
                console.error('Formato de respuesta inesperado:', response.data);
            }
        } catch (error) {
            console.error('Error al cargar incidencias:', error);
            toast.error('Error al cargar las incidencias del cliente');
            setCustomerIncidences([]);
        } finally {
            setLoadingIncidences(false);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Nombre', flex: 1 },
        { field: 'business_name', headerName: 'Nombre Comercial', flex: 1 },
        { field: 'tax_id', headerName: 'CIF/NIF', flex: 1 },
        { field: 'address', headerName: 'Dirección', flex: 1 },
        { field: 'phone', headerName: 'Teléfono', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1 },
        { field: 'contact_person', headerName: 'Persona de Contacto', flex: 1 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 200,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton 
                        onClick={() => handleOpenDialog(params.row)} 
                        size="small"
                        title="Editar"
                    >
                        <Edit />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleDeleteCustomer(params.row.id)} 
                        size="small"
                        title="Eliminar"
                    >
                        <Delete />
                    </IconButton>
                    <IconButton 
                        onClick={() => handlePrintCustomerReport(params.row)} 
                        size="small"
                        title="Imprimir informe"
                        color="primary"
                    >
                        <Print />
                    </IconButton>
                    <IconButton
                        size="small"
                        title="Consultar incidencias"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewIncidences(params.row);
                        }}
                    >
                        <AssessmentOutlined fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
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
        noRowsLabel: 'No hay datos',
        errorOverlayDefaultLabel: 'Ha ocurrido un error.',
        
        // Exportar
        toolbarExportCSV: 'Descargar CSV',
        toolbarExportPrint: 'Imprimir',
    };

    // En el diálogo de incidencias del cliente (openIncidencesDialog)

    // Primero, añade esta nueva función para manejar la impresión de incidencia desde el diálogo
    const handlePrintIncidentFromDialog = (incident) => {
        if (!incident) return;
        
        // Crear contenido HTML para imprimir
        const printContent = `
          <html>
            <head>
              <title>Incidencia #${incident.id}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.5;
                  margin: 20px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                h1 {
                  font-size: 24px;
                  margin-bottom: 5px;
                }
                .meta-info {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 20px;
                }
                .meta-item {
                  margin-bottom: 10px;
                }
                .meta-label {
                  font-weight: bold;
                }
                .section {
                  margin-bottom: 25px;
                }
                .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 5px;
                  margin-bottom: 10px;
                }
                .description {
                  background-color: #f9f9f9;
                  padding: 10px;
                  border-radius: 5px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Incidencia #${incident.id}</h1>
                <p>${incident.title}</p>
              </div>
              
              <div class="meta-info">
                <div class="meta-item">
                  <div class="meta-label">Cliente:</div>
                  <div>${incident.customer_name}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Estado:</div>
                  <div>${getStatusText(incident.status)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Prioridad:</div>
                  <div>${getPriorityText(incident.priority)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Fecha de creación:</div>
                  <div>${format(new Date(incident.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Reportada por:</div>
                  <div>${incident.reported_by_name || 'No especificado'}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Última actualización:</div>
                  <div>${format(new Date(incident.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Descripción</div>
                <div class="description">${incident.description}</div>
              </div>
              
              ${incident.resolution_notes ? `
                <div class="section">
                  <div class="section-title">Notas de resolución</div>
                  <div class="description">${incident.resolution_notes}</div>
                </div>
              ` : ''}
            </body>
          </html>
        `;
        
        // Crear un iframe oculto
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Escribir el contenido en el iframe
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(printContent);
        doc.close();
        
        // Esperar a que el contenido se cargue completamente
        setTimeout(() => {
          // Imprimir el iframe
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          
          // Eliminar el iframe después de imprimir (con retraso para asegurar que termine)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
      
      // Funciones auxiliares
      const getStatusText = (status) => {
        switch(status) {
          case 'PENDING': return 'Pendiente';
          case 'IN_PROGRESS': return 'En Progreso';
          case 'RESOLVED': return 'Resuelta';
          case 'CLOSED': return 'Cerrada';
          default: return status;
        }
      };
      
      const getPriorityText = (priority) => {
        switch(priority) {
          case 'LOW': return 'Baja';
          case 'MEDIUM': return 'Media';
          case 'HIGH': return 'Alta';
          case 'CRITICAL': return 'Crítica';
          default: return priority;
        }
      };

    // Añadir esta función justo antes o después de handlePrintIncidentFromDialog

const handleEditIncidentFromDialog = (incident) => {
    setIncidentToEdit(incident);
    setOpenIncidencesDialog(false);
    setOpenEditIncidentDialog(true);
};

const handleSaveEditedIncident = async () => {
    try {
        await axios.put(`/incidents/incidents/${incidentToEdit.id}/`, incidentToEdit);
        toast.success('Incidencia actualizada correctamente');
        setOpenEditIncidentDialog(false);
        
        // Actualizar la lista de incidencias si el diálogo está abierto
        if (selectedCustomerIncidences) {
            handleViewIncidences(selectedCustomerIncidences);
        }
    } catch (error) {
        console.error('Error al actualizar la incidencia:', error);
        toast.error('Error al actualizar la incidencia');
    }
};

const handleIncidentInputChange = (e) => {
    setIncidentToEdit({
        ...incidentToEdit,
        [e.target.name]: e.target.value
    });
};

// Añadir esta función dentro del componente CustomerList
const handleViewIncidentDetail = async (incident) => {
    try {
        setSelectedIncidentDetail(incident);
        setLoadingIncidentDetail(true);
        setOpenIncidentDetailDialog(true);
        
        // Obtener los reportes asociados a la incidencia
        const response = await axios.get(`/reports/reports/?incident=${incident.id}`);
        
        if (Array.isArray(response.data)) {
            setIncidentReports(response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
            setIncidentReports(response.data.results);
        } else {
            setIncidentReports([]);
            console.error('Formato de respuesta inesperado:', response.data);
        }
    } catch (error) {
        console.error('Error al cargar los detalles de la incidencia:', error);
        toast.error('Error al cargar los detalles de la incidencia');
        setIncidentReports([]);
    } finally {
        setLoadingIncidentDetail(false);
    }
};

// Añadir estas funciones dentro del componente CustomerList para renderizar los chips
const renderStatusChip = (status) => {
    const statusMap = {
        'PENDING': { label: 'Pendiente', color: '#ed6c02', border: '#ed6c02' },
        'IN_PROGRESS': { label: 'En Progreso', color: '#0288d1', border: '#0288d1' },
        'RESOLVED': { label: 'Resuelta', color: '#2e7d32', border: '#2e7d32' },
        'CLOSED': { label: 'Cerrada', color: '#616161', border: '#616161' }
    };
    
    const statusConfig = statusMap[status] || { label: status, color: '#757575', border: '#757575' };
    
    return (
        <Chip
            size="small"
            label={statusConfig.label}
            sx={{
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
                backgroundColor: 'transparent',
                fontWeight: 500
            }}
            variant="outlined"
        />
    );
};

const renderPriorityChip = (priority) => {
    const priorityMap = {
        'LOW': { label: 'Baja', color: '#2e7d32', border: '#2e7d32' },
        'MEDIUM': { label: 'Media', color: '#ed6c02', border: '#ed6c02' },
        'HIGH': { label: 'Alta', color: '#d32f2f', border: '#d32f2f' },
        'CRITICAL': { label: 'Crítica', color: '#9c27b0', border: '#9c27b0' }
    };
    
    const priorityConfig = priorityMap[priority] || { label: priority, color: '#757575', border: '#757575' };
    
    return (
        <Chip
            size="small"
            label={priorityConfig.label}
            sx={{
                color: priorityConfig.color,
                border: `1px solid ${priorityConfig.border}`,
                backgroundColor: 'transparent',
                fontWeight: 500
            }}
            variant="outlined"
        />
    );
};

// Función para determinar si se permite crear nuevos partes
const canCreateNewReport = (status) => {
    return status !== 'RESOLVED' && status !== 'CLOSED';
};

    return (
        <>
            <Toaster position="top-right" />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Clientes
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nuevo Cliente
                    </Button>
                </Box>

                <Paper sx={{ flexGrow: 1, width: '100%' }}>
                    <DataGrid
                        rows={customers}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
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

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="name"
                        label="Nombre *"
                        value={newCustomer.name}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="business_name"
                        label="Nombre Comercial"
                        value={newCustomer.business_name || ''}
                        onChange={handleInputChange}
                        helperText="Nombre comercial o marca"
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="tax_id"
                        label="CIF/NIF"
                        value={newCustomer.tax_id || ''}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="address"
                        label="Dirección *"
                        value={newCustomer.address}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="phone"
                        label="Teléfono *"
                        value={newCustomer.phone}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="email"
                        label="Email *"
                        value={newCustomer.email}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="contact_person"
                        label="Persona de Contacto"
                        value={newCustomer.contact_person || ''}
                        onChange={handleInputChange}
                        helperText="Este campo es opcional"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={openIncidencesDialog} 
                onClose={() => setOpenIncidencesDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            Incidencias de {selectedCustomerIncidences?.name}
                            {selectedCustomerIncidences?.business_name && ` (${selectedCustomerIncidences.business_name})`}
                        </Typography>
                        <IconButton onClick={() => setOpenIncidencesDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {loadingIncidences ? (
                        <Box display="flex" justifyContent="center" mt={3} mb={3}>
                            <CircularProgress />
                        </Box>
                    ) : customerIncidences.length > 0 ? (
                        <Box sx={{ height: 400, width: '100%' }}>
                            <DataGrid
                                rows={customerIncidences}
                                columns={[
                                    { field: 'id', headerName: 'ID', width: 70 },
                                    { field: 'title', headerName: 'Título', flex: 1 },
                                    { 
                                        field: 'status', 
                                        headerName: 'Estado', 
                                        width: 130,
                                        renderCell: (params) => {
                                            let label = '';
                                            let color = '';
                                            
                                            switch (params.value) {
                                                case 'PENDING':
                                                    label = 'Pendiente';
                                                    color = 'warning';
                                                    break;
                                                case 'IN_PROGRESS':
                                                    label = 'En Progreso';
                                                    color = 'info';
                                                    break;
                                                case 'RESOLVED':
                                                    label = 'Resuelta';
                                                    color = 'success';
                                                    break;
                                                case 'CLOSED':
                                                    label = 'Cerrada';
                                                    color = 'default';
                                                    break;
                                                default:
                                                    label = params.value;
                                                    color = 'default';
                                            }
                                            
                                            return <Chip size="small" label={label} color={color} />;
                                        }
                                    },
                                    { 
                                        field: 'priority', 
                                        headerName: 'Prioridad', 
                                        width: 120,
                                        renderCell: (params) => {
                                            let label = '';
                                            let color = '';
                                            
                                            switch (params.value) {
                                                case 'LOW':
                                                    label = 'Baja';
                                                    color = 'success';
                                                    break;
                                                case 'MEDIUM':
                                                    label = 'Media';
                                                    color = 'info';
                                                    break;
                                                case 'HIGH':
                                                    label = 'Alta';
                                                    color = 'warning';
                                                    break;
                                                case 'CRITICAL':
                                                    label = 'Crítica';
                                                    color = 'error';
                                                    break;
                                                default:
                                                    label = params.value;
                                                    color = 'default';
                                            }
                                            
                                            return <Chip size="small" label={label} color={color} />;
                                        }
                                    },
                                    { 
                                        field: 'created_at', 
                                        headerName: 'Fecha', 
                                        width: 120,
                                        renderCell: (params) => {
                                            if (!params.value) return '-';
                                            
                                            try {
                                                const date = new Date(params.value);
                                                return date.toLocaleDateString();
                                            } catch (error) {
                                                return 'Fecha inválida';
                                            }
                                        }
                                    },
                                    { 
                                        field: 'description', 
                                        headerName: 'Descripción', 
                                        flex: 1 
                                    },
                                    {
                                        field: 'actions',
                                        headerName: 'Acciones',
                                        width: 150,
                                        sortable: false,
                                        renderCell: (params) => (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Ver detalle">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleViewIncidentDetail(params.row)}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleEditIncidentFromDialog(params.row)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Imprimir">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handlePrintIncidentFromDialog(params.row)}
                                                    >
                                                        <Print fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )
                                    }
                                ]}
                                pageSize={5}
                                rowsPerPageOptions={[5, 10, 25]}
                                disableSelectionOnClick
                                getRowId={(row) => row.id}
                                localeText={{
                                    noRowsLabel: 'No hay incidencias registradas',
                                    // Resto de traducciones...
                                }}
                                slots={{ toolbar: GridToolbar }}
                                slotProps={{
                                    toolbar: {
                                        showQuickFilter: true,
                                        quickFilterProps: { debounceMs: 500 },
                                    },
                                }}
                            />
                        </Box>
                    ) : (
                        <Typography variant="body1" align="center" py={3}>
                            No hay incidencias registradas para este cliente.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenIncidencesDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {incidentToEdit && (
                <Dialog 
                    open={openEditIncidentDialog} 
                    onClose={() => setOpenEditIncidentDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6">
                                Editar Incidencia #{incidentToEdit.id}
                            </Typography>
                            <IconButton onClick={() => setOpenEditIncidentDialog(false)} size="small">
                                <Close />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            margin="normal"
                            name="title"
                            label="Título"
                            value={incidentToEdit.title}
                            onChange={handleIncidentInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            name="description"
                            label="Descripción"
                            multiline
                            rows={4}
                            value={incidentToEdit.description}
                            onChange={handleIncidentInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            select
                            name="status"
                            label="Estado"
                            value={incidentToEdit.status}
                            onChange={handleIncidentInputChange}
                        >
                            <MenuItem value="PENDING">Pendiente</MenuItem>
                            <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                            <MenuItem value="RESOLVED">Resuelta</MenuItem>
                            <MenuItem value="CLOSED">Cerrada</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            margin="normal"
                            select
                            name="priority"
                            label="Prioridad"
                            value={incidentToEdit.priority}
                            onChange={handleIncidentInputChange}
                        >
                            <MenuItem value="LOW">Baja</MenuItem>
                            <MenuItem value="MEDIUM">Media</MenuItem>
                            <MenuItem value="HIGH">Alta</MenuItem>
                            <MenuItem value="CRITICAL">Crítica</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            margin="normal"
                            name="resolution_notes"
                            label="Notas de resolución"
                            multiline
                            rows={4}
                            value={incidentToEdit.resolution_notes || ''}
                            onChange={handleIncidentInputChange}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenEditIncidentDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEditedIncident} variant="contained">
                            Guardar Cambios
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Diálogo para mostrar el detalle de la incidencia */}
            <Dialog 
                open={openIncidentDetailDialog} 
                onClose={() => setOpenIncidentDetailDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                            <Typography variant="h6">
                                Incidencia #{selectedIncidentDetail?.id}: {selectedIncidentDetail?.title}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setOpenIncidentDetailDialog(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {loadingIncidentDetail ? (
                        <Box display="flex" justifyContent="center" mt={3} mb={3}>
                            <CircularProgress />
                        </Box>
                    ) : selectedIncidentDetail ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={7}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">Detalles</Typography>
                                        <Box display="flex" gap={1}>
                                            {renderStatusChip(selectedIncidentDetail.status)}
                                            {renderPriorityChip(selectedIncidentDetail.priority)}
                                        </Box>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Cliente</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedIncidentDetail.customer_name}
                                                {customers.find(c => c.id === selectedIncidentDetail.customer)?.business_name && (
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        {customers.find(c => c.id === selectedIncidentDetail.customer)?.business_name}
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Fecha de creación</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {format(new Date(selectedIncidentDetail.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Reportada por</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedIncidentDetail.reported_by_name || 'No especificado'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2">Última actualización</Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {format(new Date(selectedIncidentDetail.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    
                                    <Box mt={2}>
                                        <Typography variant="subtitle2">Descripción</Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                            <Typography variant="body1">{selectedIncidentDetail.description}</Typography>
                                        </Paper>
                                    </Box>
                                    
                                    {selectedIncidentDetail.resolution_notes && (
                                        <Box mt={2}>
                                            <Typography variant="subtitle2">Notas de resolución</Typography>
                                            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                                <Typography variant="body1">{selectedIncidentDetail.resolution_notes}</Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={5}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">Partes de trabajo ({incidentReports.length})</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    {incidentReports.length > 0 ? (
                                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                            {incidentReports.map((report) => (
                                                <Card key={report.id} sx={{ mb: 2 }}>
                                                    <CardContent>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                Parte #{report.id}
                                                            </Typography>
                                                            <Chip 
                                                                size="small" 
                                                                label={report.status === 'DRAFT' ? 'Borrador' : 'Completado'} 
                                                                color={report.status === 'DRAFT' ? 'warning' : 'success'} 
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Fecha: {format(new Date(report.date), 'dd/MM/yyyy', { locale: es })}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Horas trabajadas: {report.hours_worked || 'No especificado'}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Técnicos: {report.technicians?.map(t => t.technician_name).join(', ') || 'Sin asignar'}
                                                        </Typography>
                                                        <Box mt={1}>
                                                            <Button 
                                                                size="small" 
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    setOpenIncidentDetailDialog(false);
                                                                    navigate(`/dashboard/reports/${report.id}`);
                                                                }}
                                                            >
                                                                Ver parte
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body1" align="center" py={3}>
                                            No hay partes de trabajo registrados para esta incidencia.
                                        </Typography>
                                    )}
                                    
                                    {canCreateNewReport(selectedIncidentDetail.status) ? (
                                        <Box mt={2} display="flex" justifyContent="center">
                                            <Button 
                                                variant="contained" 
                                                onClick={() => {
                                                    setOpenIncidentDetailDialog(false);
                                                    navigate(`/dashboard/incidents/${selectedIncidentDetail.id}/new-report`);
                                                }}
                                            >
                                                Crear nuevo parte
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box mt={2} p={2} bgcolor="rgba(0, 0, 0, 0.04)" borderRadius={1} textAlign="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No se pueden crear nuevos partes de trabajo para incidencias {selectedIncidentDetail.status === 'RESOLVED' ? 'resueltas' : 'cerradas'}.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography variant="body1" align="center" py={3}>
                            Error al cargar los detalles de la incidencia.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="outlined" 
                        startIcon={<Edit />}
                        onClick={() => {
                            setOpenIncidentDetailDialog(false);
                            handleEditIncidentFromDialog(selectedIncidentDetail);
                        }}
                    >
                        Editar
                    </Button>
                    <Button 
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => {
                            setOpenIncidentDetailDialog(false);
                            handlePrintIncidentFromDialog(selectedIncidentDetail);
                        }}
                    >
                        Imprimir
                    </Button>
                    <Button onClick={() => setOpenIncidentDetailDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de reportes */}
            {selectedIncidentDetail && (
                <ReportDialog
                    open={openReportDialog}
                    onClose={() => setOpenReportDialog(false)}
                    incident={selectedIncidentDetail}
                    onReportSelect={(reportId) => navigate(`/dashboard/reports/${reportId}`)}
                />
            )}
        </>
    );
};

export default CustomerList;