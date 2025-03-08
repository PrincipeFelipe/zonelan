/**
 * Formatea un valor para mostrar como moneda (€)
 * @param {number|string} amount - El monto a formatear
 * @returns {string} El monto formateado con símbolo de euro
 */
export const formatCurrency = (amount) => {
    // Asegurarse de que amount sea un número y no sea null/undefined
    const value = parseFloat(amount || 0);
    return `${value.toFixed(2)} €`;
};

/**
 * Obtiene la URL completa para un recurso de medio
 * @param {string} path - Ruta relativa del recurso
 * @returns {string} URL completa del recurso
 */
export const getMediaUrl = (path) => {
    if (!path) return '';
    
    // Si la URL ya es completa, devolverla tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // Si no, añadir la base URL del API
    return `${process.env.REACT_APP_API_URL || ''}${path}`;
};