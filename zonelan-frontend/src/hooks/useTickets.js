import { useState } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export const useTickets = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Crear un nuevo ticket
    const createTicket = async (ticketData) => {
        try {
            setLoading(true);
            toast.loading('Creando ticket...', { id: 'create-ticket' });
            const response = await axios.post('/tickets/tickets/', ticketData);
            toast.dismiss('create-ticket');
            toast.success('Ticket creado correctamente', { position: 'top-right', id: 'create-success' });
            return response.data;
        } catch (error) {
            console.error('Error al crear ticket:', error);
            toast.dismiss('create-ticket');
            toast.error(error.response?.data?.detail || 'Error al crear el ticket', { 
                position: 'top-right',
                id: 'create-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Marcar un ticket como pagado
    const markAsPaid = async (id, paymentMethod) => {
        try {
            setLoading(true);
            toast.loading('Marcando ticket como pagado...', { id: 'mark-paid' });
            const response = await axios.post(`/tickets/tickets/${id}/mark_as_paid/`, {
                payment_method: paymentMethod
            });
            toast.dismiss('mark-paid');
            toast.success('Ticket marcado como pagado', { position: 'top-right', id: 'mark-paid-success' });
            return response.data;
        } catch (error) {
            console.error('Error al marcar ticket como pagado:', error);
            toast.dismiss('mark-paid');
            toast.error(error.response?.data?.detail || 'Error al procesar el pago', { 
                position: 'top-right',
                id: 'mark-paid-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Cancelar un ticket
    const cancelTicket = async (id) => {
        try {
            setLoading(true);
            toast.loading('Cancelando ticket...', { id: 'cancel-ticket' });
            const response = await axios.post(`/tickets/tickets/${id}/cancel/`);
            toast.dismiss('cancel-ticket');
            toast.success('Ticket cancelado correctamente', { position: 'top-right', id: 'cancel-success' });
            return response.data;
        } catch (error) {
            console.error('Error al cancelar ticket:', error);
            toast.dismiss('cancel-ticket');
            toast.error(error.response?.data?.detail || 'Error al cancelar el ticket', { 
                position: 'top-right',
                id: 'cancel-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Añadir un item al ticket
    const addTicketItem = async (ticketId, itemData) => {
        try {
            setLoading(true);
            toast.loading('Añadiendo producto al ticket...', { id: 'add-item' });
            const response = await axios.post(`/tickets/tickets/${ticketId}/items/`, itemData);
            toast.dismiss('add-item');
            toast.success('Producto añadido al ticket', { position: 'top-right', id: 'add-item-success' });
            return response.data;
        } catch (error) {
            console.error('Error al añadir producto al ticket:', error);
            toast.dismiss('add-item');
            toast.error(error.response?.data?.detail || 'Error al añadir producto', { 
                position: 'top-right',
                id: 'add-item-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Eliminar un item del ticket
    const removeTicketItem = async (ticketId, itemId) => {
        try {
            setLoading(true);
            toast.loading('Eliminando producto del ticket...', { id: 'remove-item' });
            await axios.delete(`/tickets/tickets/${ticketId}/items/${itemId}/`);
            toast.dismiss('remove-item');
            toast.success('Producto eliminado del ticket', { position: 'top-right', id: 'remove-item-success' });
            return true;
        } catch (error) {
            console.error('Error al eliminar producto del ticket:', error);
            toast.dismiss('remove-item');
            toast.error(error.response?.data?.detail || 'Error al eliminar producto', { 
                position: 'top-right',
                id: 'remove-item-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Obtener un ticket por ID
    const getTicket = async (id) => {
        try {
            setLoading(true);
            toast.loading('Obteniendo información del ticket...', { id: 'get-ticket' });
            const response = await axios.get(`/tickets/tickets/${id}/`);
            toast.dismiss('get-ticket');
            return response.data;
        } catch (error) {
            console.error('Error al obtener ticket:', error);
            toast.dismiss('get-ticket');
            toast.error('Error al obtener información del ticket', { 
                position: 'top-right',
                id: 'get-ticket-error' 
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Modificar el método printTicket para evitar abrir una pestaña nueva

    const printTicket = async (id) => {
        try {
            setLoading(true);
            toast.loading('Generando ticket para impresión...', { id: 'print-ticket' });
            
            // Obtener los datos del ticket del backend
            const response = await axios.get(`/tickets/tickets/${id}/`);
            const ticket = response.data;
            
            if (!ticket) {
                toast.dismiss('print-ticket');
                toast.error('No se encontró información del ticket', { position: 'top-right', id: 'print-ticket-error' });
                return;
            }
            
            // Formatear la fecha para mostrarla correctamente
            const formatDate = (dateString) => {
                if (!dateString) return 'No disponible';
                return new Date(dateString).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };
            
            // Generar el HTML para imprimir el ticket
            const printContent = `
                <html>
                    <head>
                        <title>Ticket ${ticket.ticket_number}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                width: 80mm;
                                margin: 0 auto;
                                padding: 5mm;
                                line-height: 1.3;
                            }
                            .ticket-header {
                                text-align: center;
                                margin-bottom: 5mm;
                            }
                            .ticket-header h1 {
                                font-size: 14pt;
                                margin: 0;
                            }
                            .company-info {
                                font-size: 8pt;
                                text-align: center;
                                margin-bottom: 3mm;
                            }
                            .ticket-data {
                                margin-bottom: 5mm;
                                font-size: 10pt;
                            }
                            .ticket-items {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 5mm;
                                font-size: 9pt;
                            }
                            .ticket-items th, .ticket-items td {
                                text-align: left;
                                padding: 1mm 0;
                            }
                            .ticket-items th {
                                border-bottom: 1pt solid black;
                            }
                            .ticket-footer {
                                text-align: center;
                                font-size: 8pt;
                                margin-top: 5mm;
                                border-top: 1pt solid black;
                                padding-top: 2mm;
                            }
                            .amount {
                                text-align: right;
                            }
                            .total {
                                font-weight: bold;
                                border-top: 1pt solid black;
                                padding-top: 1mm;
                            }
                            @media print {
                                @page {
                                    size: 80mm auto;
                                    margin: 0;
                                }
                                body {
                                    width: 100%;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="ticket-header">
                            <h1>Tu Empresa, S.L.</h1>
                            <div class="company-info">
                                Calle Principal 123<br>
                                28001 Madrid<br>
                                CIF: A12345678<br>
                                Tel: 91 123 45 67<br>
                                info@tuempresa.com
                            </div>
                        </div>
                        
                        <div class="ticket-data">
                            <strong>TICKET:</strong> ${ticket.ticket_number}<br>
                            <strong>FECHA:</strong> ${formatDate(ticket.created_at)}<br>
                            ${ticket.customer_name ? `<strong>CLIENTE:</strong> ${ticket.customer_name}<br>` : ''}
                            ${ticket.customer_tax_id ? `<strong>CIF/NIF:</strong> ${ticket.customer_tax_id}<br>` : ''}
                        </div>
                        
                        <table class="ticket-items">
                            <thead>
                                <tr>
                                    <th>Artículo</th>
                                    <th>Cant.</th>
                                    <th>Precio</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ticket.items.map(item => `
                                    <tr>
                                        <td>${item.material_name}</td>
                                        <td>${item.quantity}</td>
                                        <td class="amount">${parseFloat(item.unit_price).toFixed(2)} €</td>
                                        <td class="amount">${parseFloat(item.total_price).toFixed(2)} €</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total">
                                    <td colspan="3"><strong>TOTAL</strong></td>
                                    <td class="amount"><strong>${parseFloat(ticket.total_amount).toFixed(2)} €</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div>
                            <strong>FORMA DE PAGO:</strong> ${ticket.payment_method_display || 'No especificada'}<br>
                            <strong>ESTADO:</strong> ${ticket.status_display || ticket.status}<br>
                            ${ticket.notes ? `<strong>NOTAS:</strong> ${ticket.notes}<br>` : ''}
                        </div>
                        
                        <div class="ticket-footer">
                            <p>Gracias por su compra</p>
                            <p>*Este documento no es una factura oficial*</p>
                        </div>
                    </body>
                </html>
            `;
            
            // Crear un iframe oculto en lugar de abrir una nueva ventana
            const iframe = document.createElement('iframe');
            iframe.style.height = '0px';
            iframe.style.width = '0px';
            iframe.style.position = 'absolute';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Escribir el contenido en el iframe y esperar a que se cargue
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(printContent);
            doc.close();
            
            // Esperar a que se carguen los estilos
            setTimeout(() => {
                try {
                    // Imprimir el contenido del iframe
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Eliminar el iframe después de la impresión (con retraso para asegurar que termine)
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                    
                    toast.dismiss('print-ticket');
                    toast.success('Documento generado correctamente', { position: 'top-right', id: 'print-ticket-success' });
                } catch (e) {
                    console.error('Error al imprimir:', e);
                    toast.dismiss('print-ticket');
                    toast.error('Error al imprimir el documento', { position: 'top-right', id: 'print-ticket-error' });
                    document.body.removeChild(iframe);
                }
            }, 500);
        } catch (error) {
            console.error('Error al generar ticket:', error);
            toast.dismiss('print-ticket');
            toast.error('Error al generar el documento', { position: 'top-right', id: 'print-ticket-error' });
        } finally {
            setLoading(false);
        }
    };

    // Navegar al detalle de un ticket después de crearlo
    const askToNavigateToTicket = (ticketId) => {
        Swal.fire({
            title: 'Operación Exitosa',
            text: '¿Desea ver el detalle del ticket?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Ver ticket',
            cancelButtonText: 'Continuar aquí'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate(`/dashboard/tickets/${ticketId}`);
            }
        });
    };

    // Asegurarse de exportar la nueva función
    return {
        loading,
        createTicket,
        markAsPaid,
        cancelTicket,
        addTicketItem,
        removeTicketItem,
        printTicket,
        getTicket,
        askToNavigateToTicket
    };
};