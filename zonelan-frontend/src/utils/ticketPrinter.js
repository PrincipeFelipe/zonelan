import axios from './axiosConfig';
import { toast } from 'react-hot-toast';

/**
 * Función para imprimir un ticket
 * @param {number|string} ticketId - ID del ticket a imprimir
 * @returns {Promise<boolean>} - Promesa que se resuelve a true si la impresión fue exitosa
 */
export const printTicket = async (ticketId) => {
    try {
        // Obtener los datos del ticket
        const response = await axios.get(`/tickets/tickets/${ticketId}/`);
        const ticket = response.data;
        
        // Formatear fecha
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES')}`;
        };
        
        // Formatear moneda
        const formatCurrency = (amount) => {
            if (amount === undefined || amount === null) return '0,00 €';
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        };
        
        // Obtener nombre del método de pago
        const getPaymentMethodName = (method) => {
            switch (method) {
                case 'CASH': return 'Efectivo';
                case 'CARD': return 'Tarjeta';
                case 'TRANSFER': return 'Transferencia';
                case 'BIZUM': return 'Bizum';
                default: return method || 'No especificado';
            }
        };
        
        // Obtener nombre del estado
        const getStatusName = (status) => {
            switch (status) {
                case 'PENDING': return 'Pendiente';
                case 'PAID': return 'Pagado';
                case 'CANCELED': return 'Cancelado';
                default: return status || 'Pendiente';
            }
        };

        // Crear un iframe oculto para la impresión
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
                // Acceder al documento dentro del iframe y escribir el contenido
                const printDocument = printIframe.contentDocument || printIframe.contentWindow.document;
                printDocument.open();
                printDocument.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Ticket #${ticket.ticket_number || ticket.id}</title>
                        <meta charset="UTF-8">
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                margin: 0;
                                padding: 20px;
                                font-size: 14px;
                                color: #333;
                            }
                            .ticket {
                                max-width: 80mm;
                                margin: 0 auto;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 15px;
                                border-bottom: 1px dashed #ccc;
                                padding-bottom: 10px;
                            }
                            .company-name {
                                font-size: 18px;
                                font-weight: bold;
                            }
                            .ticket-number {
                                font-size: 16px;
                                margin: 10px 0;
                            }
                            .info {
                                margin-bottom: 15px;
                                line-height: 1.5;
                            }
                            .info-row {
                                display: flex;
                                justify-content: space-between;
                            }
                            .items {
                                margin-bottom: 15px;
                                border-bottom: 1px dashed #ccc;
                            }
                            .item {
                                margin-bottom: 8px;
                                display: flex;
                                justify-content: space-between;
                            }
                            .item-name {
                                flex: 3;
                            }
                            .item-qty {
                                flex: 1;
                                text-align: center;
                            }
                            .item-price {
                                flex: 1;
                                text-align: right;
                            }
                            .totals {
                                margin: 15px 0;
                            }
                            .total-row {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 5px;
                            }
                            .grand-total {
                                font-weight: bold;
                                font-size: 16px;
                                margin-top: 10px;
                                border-top: 1px solid #000;
                                padding-top: 5px;
                            }
                            .footer {
                                margin-top: 20px;
                                text-align: center;
                                font-size: 12px;
                            }
                            @media print {
                                body { 
                                    -webkit-print-color-adjust: exact;
                                    color-adjust: exact;
                                    width: 80mm;
                                    margin: 0;
                                    padding: 0;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="ticket">
                            <div class="header">
                                <div class="company-name">ZONELAN</div>
                                <div>Soluciones Tecnológicas</div>
                                <div>CIF: B12345678</div>
                                <div>Calle Principal 123, 28001 Madrid</div>
                                <div>Tel: 912 345 678</div>
                            </div>
                            
                            <div class="ticket-number">
                                Ticket #${ticket.ticket_number || ticket.id}
                            </div>
                            
                            <div class="info">
                                <div class="info-row">
                                    <span>Fecha:</span>
                                    <span>${formatDate(ticket.created_at)}</span>
                                </div>
                                <div class="info-row">
                                    <span>Cliente:</span>
                                    <span>${ticket.customer_name || 'Cliente general'}</span>
                                </div>
                                <div class="info-row">
                                    <span>Estado:</span>
                                    <span>${getStatusName(ticket.status)}</span>
                                </div>
                                ${ticket.payment_method ? `
                                    <div class="info-row">
                                        <span>Método de pago:</span>
                                        <span>${getPaymentMethodName(ticket.payment_method)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="items">
                                <div class="item" style="font-weight: bold;">
                                    <div class="item-name">Artículo</div>
                                    <div class="item-qty">Cant.</div>
                                    <div class="item-price">Precio</div>
                                </div>
                                ${ticket.items ? ticket.items.map(item => `
                                    <div class="item">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-qty">${item.quantity}</div>
                                        <div class="item-price">${formatCurrency(item.price)}</div>
                                    </div>
                                `).join('') : ''}
                            </div>
                            
                            <div class="totals">
                                <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span>${formatCurrency(ticket.subtotal)}</span>
                                </div>
                                <div class="total-row">
                                    <span>IVA (21%):</span>
                                    <span>${formatCurrency(ticket.tax_amount)}</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>TOTAL:</span>
                                    <span>${formatCurrency(ticket.total_amount)}</span>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p>¡Gracias por su compra!</p>
                                <p>www.zonelan.es</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
                printDocument.close();
                
                // Esperar un poco para asegurar que los estilos se carguen correctamente
                setTimeout(() => {
                    // Imprimir el iframe
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                    
                    // Eliminar el iframe después de un tiempo
                    setTimeout(() => {
                        document.body.removeChild(printIframe);
                    }, 1000);
                }, 500);

            } catch (error) {
                console.error('Error al preparar la impresión:', error);
                document.body.removeChild(printIframe);
                toast.error('Error al preparar la impresión');
                return false;
            }
        };
        
        // Inicializar el iframe
        printIframe.src = 'about:blank';
        
        return true;
    } catch (error) {
        console.error('Error al imprimir el ticket:', error);
        toast.error('Error al imprimir el ticket');
        return false;
    }
};