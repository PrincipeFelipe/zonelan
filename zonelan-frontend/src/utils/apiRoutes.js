export const API_ROUTES = {
    INCIDENTS: '/incidents/incidents/',
    CUSTOMERS: '/customers/',
    REPORTS: '/reports/reports/',
    INCIDENT_COUNTS: '/incidents/counts/',
    USERS: '/users/',
    MATERIALS: '/materials/materials/',
    STORAGE: {
        WAREHOUSES: '/storage/warehouses/',
        DEPARTMENTS: '/storage/departments/',
        SHELVES: '/storage/shelves/',
        TRAYS: '/storage/trays/',
        LOCATIONS: '/storage/locations/',
        MOVEMENTS: '/storage/movements/',
    }
};

// Función auxiliar para construir URLs para recursos específicos
export const buildResourceUrl = (baseRoute, id) => `${baseRoute}${id}/`;