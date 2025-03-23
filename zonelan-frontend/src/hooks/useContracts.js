import { useState } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

export const useContracts = () => {
    const [loading, setLoading] = useState(false);
    
    const fetchContracts = async (filters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
            
            const response = await axios.get(`/contracts/contracts/?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener contratos:', error);
            toast.error('Error al cargar los contratos');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const fetchContract = async (contractId) => {
        setLoading(true);
        try {
            const response = await axios.get(`/contracts/contracts/${contractId}/`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener detalles del contrato:', error);
            toast.error('Error al cargar la información del contrato');
            return null; // Valor por defecto en caso de error
        } finally {
            setLoading(false);
        }
    };
    
    const createContract = async (contractData) => {
        setLoading(true);
        try {
            const response = await axios.post('/contracts/contracts/', contractData);
            toast.success('Contrato creado exitosamente');
            return response.data;
        } catch (error) {
            console.error('Error al crear contrato:', error);
            if (error.response?.data) {
                const errorMessages = Object.entries(error.response.data)
                    .map(([key, value]) => `${key}: ${value.join(', ')}`)
                    .join('. ');
                toast.error(`Error: ${errorMessages}`);
            } else {
                toast.error('Error al crear contrato');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const updateContract = async (id, contractData) => {
        setLoading(true);
        try {
            const response = await axios.put(`/contracts/contracts/${id}/`, contractData);
            toast.success('Contrato actualizado exitosamente');
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar contrato ${id}:`, error);
            if (error.response?.data) {
                const errorMessages = Object.entries(error.response.data)
                    .map(([key, value]) => `${key}: ${value.join(', ')}`)
                    .join('. ');
                toast.error(`Error: ${errorMessages}`);
            } else {
                toast.error('Error al actualizar contrato');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const deleteContract = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`/contracts/contracts/${id}/`);
            toast.success('Contrato eliminado correctamente');
            return true;
        } catch (error) {
            console.error(`Error al eliminar contrato ${id}:`, error);
            toast.error('Error al eliminar contrato');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    // Corrige la función fetchMaintenanceRecords:
    const fetchMaintenanceRecords = async (params) => {
        setLoading(true);
        try {
            // Normalizar parámetros (asegurar que contract sea un ID)
            let queryParams = { ...params };
            
            if (queryParams.contract && typeof queryParams.contract === 'object') {
                queryParams.contract = queryParams.contract.id;
            }
            
            const response = await axios.get('/contracts/maintenance-records/', { 
                params: queryParams 
            });
            
            // Log para depurar
            console.log('API response for maintenance records:', response.data);
            
            // Si la respuesta es un objeto con resultados, usar esos resultados
            const records = Array.isArray(response.data) ? response.data : 
                            (response.data.results || []);
                            
            // Procesar cada registro para asegurar que tenga los campos necesarios
            return records.map(record => ({
                ...record,
                maintenance_type_display: record.maintenance_type_display || getMaintenanceTypeDisplay(record.maintenance_type),
                status_display: record.status_display || getStatusDisplay(record.status)
            }));
        } catch (error) {
            console.error('Error al obtener registros de mantenimiento:', error);
            toast.error('Error al cargar registros de mantenimiento');
            return []; // Devolver array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };
    
    // Funciones auxiliares para generar los textos de visualización
    const getMaintenanceTypeDisplay = (type) => {
        switch (type) {
            case 'PREVENTIVE': return 'Preventivo';
            case 'CORRECTIVE': return 'Correctivo';
            case 'EMERGENCY': return 'Emergencia';
            case 'INSPECTION': return 'Inspección';
            default: return type || '';
        }
    };
    
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'IN_PROGRESS': return 'En Progreso';
            case 'COMPLETED': return 'Completado';
            case 'CANCELLED': return 'Cancelado';
            default: return status || '';
        }
    };

    const completeContractMaintenance = async (contractId, maintenanceData) => {
        setLoading(true);
        try {
            const response = await axios.post(`/contracts/contracts/${contractId}/complete_maintenance/`, maintenanceData);
            toast.success('Mantenimiento registrado correctamente');
            return response.data;
        } catch (error) {
            console.error('Error al registrar mantenimiento:', error);
            toast.error('Error al registrar mantenimiento');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const fetchContractDocuments = async (contractId) => {
        setLoading(true);
        try {
            // Corregir la URL para que coincida con la usada en otras funciones
            const response = await axios.get(`/contracts/documents/?contract=${contractId}`);
            console.log('Documentos obtenidos:', response.data); // Para depurar
            return response.data;
        } catch (error) {
            console.error('Error al obtener documentos del contrato:', error);
            toast.error('Error al cargar documentos');
            return []; // Array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };
    
    const uploadContractDocument = async (formData) => {
        setLoading(true);
        try {
            const response = await axios.post('/contracts/documents/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Documento subido correctamente');
            return response.data;
        } catch (error) {
            console.error('Error al subir documento:', error);
            toast.error('Error al subir documento');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const deleteContractDocument = async (documentId) => {
        setLoading(true);
        try {
            await axios.delete(`/contracts/documents/${documentId}/`);
            toast.success('Documento eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            toast.error('Error al eliminar documento');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const fetchContractReports = async (contractParam) => {
        setLoading(true);
        try {
            // Determinar el ID del contrato correctamente
            let contractId;
            
            if (typeof contractParam === 'object' && contractParam !== null) {
                // Si es un objeto, extraer el ID
                contractId = contractParam.id;
            } else {
                // Si es un ID directo, usarlo tal cual
                contractId = contractParam;
            }
            
            // Construir los parámetros de consulta correctos
            const params = contractId ? { contract: contractId } : {};
            
            // Hacer la petición con los parámetros correctos
            const response = await axios.get('/contracts/reports/', { params });
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener reportes:', error);
            toast.error('Error al cargar los reportes del contrato');
            return []; // Devolver array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };
    
    const fetchContractReport = async (reportId) => {
        setLoading(true);
        try {
            const response = await axios.get(`/contracts/reports/${reportId}/`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener reporte:', error);
            toast.error('Error al cargar reporte');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const createContractReport = async (reportData) => {
        setLoading(true);
        try {
            const response = await axios.post('/contracts/reports/', reportData);
            toast.success('Reporte creado exitosamente');
            return response.data;
        } catch (error) {
            console.error('Error al crear reporte:', error);
            toast.error('Error al crear reporte');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const updateContractReport = async (reportId, reportData) => {
        setLoading(true);
        try {
            const response = await axios.put(`/contracts/reports/${reportId}/`, reportData);
            toast.success('Reporte actualizado exitosamente');
            return response.data;
        } catch (error) {
            console.error('Error al actualizar reporte:', error);
            toast.error('Error al actualizar reporte');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const deleteContractReport = async (reportId, returnMaterials = false) => {
        setLoading(true);
        try {
            // Convertir el parámetro booleano a string para la URL
            const returnMaterialsParam = returnMaterials ? 'true' : 'false';
            
            // Usar el cliente axios configurado correctamente
            await axios.delete(`/contracts/reports/${reportId}/?return_materials=${returnMaterialsParam}`);
            
            toast.success('Reporte eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar reporte:', error);
            toast.error('Error al eliminar reporte');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/contracts/dashboard/');
            return response.data;
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error);
            toast.error('Error al cargar información del dashboard');
            // Devolver datos por defecto para evitar errores
            return {
                total_contracts: 0,
                active_contracts: 0,
                pending_maintenance: 0,
                expiring_soon: 0,
                contracts_by_customer: []
            };
        } finally {
            setLoading(false);
        }
    };

    const createMaintenanceRecord = async (maintenanceData) => {
        setLoading(true);
        try {
            const response = await axios.post('/contracts/maintenance-records/', maintenanceData);
            toast.success('Registro de mantenimiento creado correctamente');
            return response.data;
        } catch (error) {
            console.error('Error al crear registro de mantenimiento:', error);
            toast.error('Error al crear el registro de mantenimiento');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateMaintenanceRecord = async (id, maintenanceData) => {
        setLoading(true);
        try {
            const response = await axios.put(`/contracts/maintenance-records/${id}/`, maintenanceData);
            toast.success('Registro de mantenimiento actualizado correctamente');
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar registro de mantenimiento ${id}:`, error);
            toast.error('Error al actualizar el registro de mantenimiento');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteMaintenanceRecord = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`/contracts/maintenance-records/${id}/`);
            toast.success('Registro de mantenimiento eliminado correctamente');
            return true;
        } catch (error) {
            console.error(`Error al eliminar registro de mantenimiento ${id}:`, error);
            toast.error('Error al eliminar el registro de mantenimiento');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    // Al final del hook, incluir todas las funciones en el objeto de retorno
    return {
        // Otras funciones de contratos...
        fetchContract,
        fetchContracts,
        createContract,
        updateContract,
        deleteContract,
        
        // Funciones de mantenimiento
        fetchMaintenanceRecords,
        createMaintenanceRecord,
        updateMaintenanceRecord, // Asegúrate de incluir esta función
        deleteMaintenanceRecord,
        completeContractMaintenance,
        
        // Funciones de documentos
        fetchContractDocuments,
        uploadContractDocument,
        deleteContractDocument,
        
        // Funciones de reportes
        fetchContractReports,
        fetchContractReport,
        createContractReport,
        updateContractReport,
        deleteContractReport, // Añadir aquí si no estaba
        
        // Estado general
        loading,
        fetchDashboardData // ¡Importante! Agrega esta función aquí
    };
};