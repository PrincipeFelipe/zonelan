import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from '../utils/axiosConfig';

export const useReportCreation = () => {
    const navigate = useNavigate();
    
    // Función mejorada para crear un nuevo reporte desde una incidencia
    const createReportFromIncident = async (incidentId) => {
        try {
            // Primero verificar el estado de la incidencia
            const incidentResponse = await axios.get(`/incidents/incidents/${incidentId}/`);
            const incidentStatus = incidentResponse.data.status;
            
            // Verificar si la incidencia está resuelta o cerrada
            if (incidentStatus === 'RESOLVED' || incidentStatus === 'CLOSED') {
                toast.error('No se pueden crear nuevos partes para incidencias resueltas o cerradas');
                return;
            }
            
            // Si la incidencia está en un estado válido, navegar a la ruta de creación
            navigate(`/dashboard/reports/create?incident=${incidentId}`);
        } catch (error) {
            console.error('Error al verificar el estado de la incidencia:', error);
            toast.error('Error al intentar crear un nuevo parte');
        }
    };
    
    return { createReportFromIncident };
};