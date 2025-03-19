/**
 * Limpia un objeto para enviarlo a la API, convirtiendo objetos en sus IDs
 * @param {Object} data - Datos a limpiar
 * @returns {Object} - Datos limpios listos para enviar
 */
export const prepareDataForApi = (data) => {
  const cleanData = { ...data };
  
  for (const key in cleanData) {
    if (cleanData[key] && typeof cleanData[key] === 'object' && cleanData[key].id) {
      cleanData[key] = cleanData[key].id;
    }
  }
  
  return cleanData;
};

/**
 * Prepara los parámetros para una petición GET a la API,
 * asegurando que los objetos se conviertan en sus IDs
 * 
 * @param {Object} params - Parámetros originales
 * @returns {Object} - Parámetros normalizados
 */
export const normalizeQueryParams = (params) => {
    if (!params || typeof params !== 'object') return {};
    
    const normalizedParams = {};
    
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            // Omitir parámetros nulos o indefinidos
            return;
        }
        
        if (typeof value === 'object' && value !== null && 'id' in value) {
            // Si es un objeto con una propiedad ID, usar el ID
            normalizedParams[key] = value.id;
        } else {
            // En otro caso, usar el valor tal cual
            normalizedParams[key] = value;
        }
    });
    
    return normalizedParams;
};