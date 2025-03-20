import React, { useEffect, useRef } from 'react';
import { 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box, 
    Typography, 
    Paper, 
    Grid, 
    Divider, 
    Button,
    IconButton
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Print, Close } from '@mui/icons-material';

const MaintenancePrintDialog = ({ open, onClose, maintenance }) => {
    const contentRef = useRef(null);
    
    // Reemplazar useReactToPrint con una función de impresión directa como en TicketList.js
    const handlePrint = () => {
        if (!contentRef.current) return;
        
        try {
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
                    
                    // Obtener el contenido HTML del elemento referenciado
                    const contentHtml = contentRef.current.innerHTML;
                    
                    printDocument.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Justificante de Mantenimiento</title>
                            <meta charset="UTF-8">
                            <style>
                                @page {
                                    size: A4;
                                    margin: 1.5cm;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                    line-height: 1.5;
                                    color: #333;
                                    margin: 0;
                                    padding: 0;
                                }
                                .paper {
                                    padding: 20px;
                                    max-width: 100%;
                                    margin: 0 auto;
                                }
                                h1 {
                                    font-size: 24px;
                                    margin-bottom: 10px;
                                }
                                h2, .subtitle1 {
                                    font-size: 18px;
                                    margin-bottom: 10px;
                                }
                                .divider {
                                    border-top: 1px solid #ccc;
                                    margin: 15px 0;
                                }
                                .grid-container {
                                    display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 20px;
                                    margin-bottom: 20px;
                                }
                                .grid-item {
                                    margin-bottom: 15px;
                                }
                                .subtitle2 {
                                    font-weight: bold;
                                    margin-bottom: 5px;
                                }
                                .body1, .body2 {
                                    margin: 0;
                                }
                                .outlined-paper {
                                    border: 1px solid #ccc;
                                    padding: 10px;
                                    min-height: 100px;
                                }
                                .signature-box {
                                    display: flex;
                                    justify-content: space-between;
                                    margin-top: 60px;
                                }
                                .signature-line {
                                    width: 45%;
                                }
                                .signature-line .divider {
                                    margin-bottom: 5px;
                                }
                                .signature-text {
                                    text-align: center;
                                }
                                .footer {
                                    margin-top: 40px;
                                    text-align: center;
                                }
                                .caption {
                                    font-size: 12px;
                                    color: #666;
                                    text-align: center;
                                    margin-top: 5px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="paper">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                    <div>
                                        <h1>JUSTIFICANTE DE MANTENIMIENTO</h1>
                                        <div class="subtitle1">${maintenance.contract_title}</div>
                                        ${maintenance.contract_number ? `<div>Contrato Nº: ${maintenance.contract_number}</div>` : ''}
                                    </div>
                                    <div style="text-align: right;">
                                        <div>Fecha: ${formatDate(maintenance.date)}</div>
                                        <div>Ref: MANT-${maintenance.id}</div>
                                    </div>
                                </div>
                                
                                <div class="divider"></div>
                                
                                <div class="grid-container">
                                    <div class="grid-item">
                                        <div class="subtitle2">Cliente</div>
                                        <div class="body1">${maintenance.customer_name}</div>
                                    </div>
                                    <div class="grid-item">
                                        <div class="subtitle2">Técnico</div>
                                        <div class="body1">${maintenance.technician_name}</div>
                                    </div>
                                    <div class="grid-item">
                                        <div class="subtitle2">Tipo de mantenimiento</div>
                                        <div class="body1">${maintenance.maintenance_type_display}</div>
                                    </div>
                                    <div class="grid-item">
                                        <div class="subtitle2">Estado</div>
                                        <div class="body1">${maintenance.status_display}</div>
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 30px;">
                                    <div class="subtitle2">Observaciones</div>
                                    <div class="outlined-paper">
                                        <div class="body2">
                                            ${maintenance.observations || maintenance.notes || 'No hay observaciones registradas.'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="signature-box">
                                    <div class="signature-line">
                                        <div class="divider"></div>
                                        <div class="signature-text">Firma del técnico</div>
                                    </div>
                                    <div class="signature-line">
                                        <div class="divider"></div>
                                        <div class="signature-text">Firma del cliente</div>
                                    </div>
                                </div>
                                
                                <div class="footer">
                                    <div class="caption">
                                        Este documento certifica la realización de las tareas de mantenimiento descritas.
                                    </div>
                                    <div class="caption">
                                        Impreso el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `);
                    printDocument.close();
                    
                    // Esperar a que se cargue el contenido
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
                }
            };
            
            // Iniciar carga del iframe
            printIframe.src = 'about:blank';
            
        } catch (error) {
            console.error('Error al iniciar la impresión:', error);
        }
    };
    
    // Auto-imprimir cuando se abre el diálogo
    useEffect(() => {
        if (open && maintenance && contentRef.current) {
            // Pequeño retraso para asegurar que el contenido esté renderizado
            const timer = setTimeout(() => {
                handlePrint();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, maintenance]);
    
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return 'No especificado';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch (error) {
            return dateString;
        }
    };
    
    // No renderizar nada si no hay datos
    if (!maintenance) {
        return null;
    }
    
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Vista previa de impresión</Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            
            <DialogContent>
                {/* Este div contiene el contenido a imprimir pero solo es para referencia visual */}
                <div ref={contentRef}>
                    <Paper sx={{ p: 4, maxWidth: '100%', mx: 'auto' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                            <Box>
                                <Typography variant="h5" component="h1" gutterBottom>
                                    JUSTIFICANTE DE MANTENIMIENTO
                                </Typography>
                                <Typography variant="subtitle1">
                                    {maintenance.contract_title}
                                </Typography>
                                {maintenance.contract_number && (
                                    <Typography variant="body2">
                                        Contrato Nº: {maintenance.contract_number}
                                    </Typography>
                                )}
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="body2">
                                    Fecha: {formatDate(maintenance.date)}
                                </Typography>
                                <Typography variant="body2">
                                    Ref: MANT-{maintenance.id}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />
                        
                        <Grid container spacing={3} mb={4}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Cliente</Typography>
                                <Typography variant="body1">{maintenance.customer_name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Técnico</Typography>
                                <Typography variant="body1">{maintenance.technician_name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Tipo de mantenimiento</Typography>
                                <Typography variant="body1">{maintenance.maintenance_type_display}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Estado</Typography>
                                <Typography variant="body1">{maintenance.status_display}</Typography>
                            </Grid>
                        </Grid>
                        
                        <Box mb={4}>
                            <Typography variant="subtitle2" gutterBottom>Observaciones</Typography>
                            <Paper variant="outlined" sx={{ p: 2, minHeight: '100px' }}>
                                <Typography variant="body2">
                                    {maintenance.observations || maintenance.notes || 'No hay observaciones registradas.'}
                                </Typography>
                            </Paper>
                        </Box>
                        
                        <Box mt={6} display="flex" justifyContent="space-between">
                            <Box width="45%">
                                <Divider />
                                <Typography variant="body2" align="center" mt={1}>
                                    Firma del técnico
                                </Typography>
                            </Box>
                            <Box width="45%">
                                <Divider />
                                <Typography variant="body2" align="center" mt={1}>
                                    Firma del cliente
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box mt={6} pt={2}>
                            <Typography variant="caption" align="center" display="block">
                                Este documento certifica la realización de las tareas de mantenimiento descritas.
                            </Typography>
                            <Typography variant="caption" align="center" display="block">
                                Impreso el {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </Typography>
                        </Box>
                    </Paper>
                </div>
            </DialogContent>
            
            <DialogActions className="no-print">
                <Button 
                    variant="contained" 
                    onClick={handlePrint}
                    startIcon={<Print />}
                >
                    Imprimir
                </Button>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default MaintenancePrintDialog;