/**
 * Formatea una fecha en formato legible
 * @param {string} dateString - Fecha en formato ISO o similar
 * @param {string} locale - Configuración regional (por defecto 'es-ES')
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateString, locale = 'es-ES') => {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return dateString; // Si no es válida, devolver el string original
        }
        
        return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return dateString;
    }
};

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Moneda (por defecto 'EUR')
 * @param {string} locale - Configuración regional (por defecto 'es-ES')
 * @returns {string} Cantidad formateada como moneda
 */
export const formatCurrency = (amount, currency = 'EUR', locale = 'es-ES') => {
    if (amount === null || amount === undefined) return '-';
    
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        console.error('Error al formatear moneda:', error);
        return `${amount}`;
    }
};

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @param {string} locale - Configuración regional (por defecto 'es-ES')
 * @returns {string} Número formateado
 */
export const formatNumber = (number, locale = 'es-ES') => {
    if (number === null || number === undefined) return '-';
    
    try {
        return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
        console.error('Error al formatear número:', error);
        return `${number}`;
    }
};