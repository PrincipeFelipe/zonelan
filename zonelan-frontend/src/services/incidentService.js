import axios from '../utils/axiosConfig';

let cachedCounts = { pending: 0, in_progress: 0, active: 0, total: 0 };
let subscribers = [];

const incidentService = {
    getPendingIncidentsCount: async () => {
        try {
            const response = await axios.get('/incidents/counts/');
            // Asegurar compatibilidad con código existente
            const responseData = response.data;
            
            // Si el backend no proporciona 'active', calcularlo
            if (responseData.pending !== undefined && responseData.in_progress !== undefined) {
                if (responseData.active === undefined) {
                    responseData.active = responseData.pending + responseData.in_progress;
                }
            }
            
            // Actualizar el caché
            cachedCounts = responseData;
            // Notificar a todos los suscriptores
            subscribers.forEach(callback => callback(responseData));
            return responseData;
        } catch (error) {
            console.error('Error al obtener el conteo de incidencias pendientes:', error);
            return cachedCounts;
        }
    },
    
    // Función para obtener el último valor en caché sin hacer una solicitud
    getCachedCounts: () => {
        return cachedCounts;
    },
    
    // Función para suscribirse a cambios en el contador
    subscribe: (callback) => {
        subscribers.push(callback);
        return () => {
            subscribers = subscribers.filter(sub => sub !== callback);
        };
    },
    
    // Función para forzar una actualización manual del contador
    forceUpdate: async () => {
        try {
            const newCounts = await incidentService.getPendingIncidentsCount();
            
            // Emitir evento para que otros componentes puedan reaccionar
            const event = new CustomEvent('incidentCountUpdated', { 
                detail: newCounts 
            });
            window.dispatchEvent(event);
            
            return newCounts;
        } catch (error) {
            console.error('Error en la actualización forzada:', error);
            return cachedCounts;
        }
    }
};

export default incidentService;