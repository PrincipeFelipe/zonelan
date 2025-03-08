import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Autocomplete, CircularProgress, Box, Typography
} from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useTickets } from '../../hooks/useTickets';

const NewTicketDialog = ({ open, onClose, onSuccess }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [notes, setNotes] = useState('');
    const { createTicket, askToNavigateToTicket } = useTickets();

    useEffect(() => {
        if (open) {
            fetchCustomers();
            resetForm();
        }
    }, [open]);

    // Corregir la función fetchCustomers
    const fetchCustomers = async () => {
        try {
            setCustomersLoading(true);
            // Cambiar la URL de /customers/customers/ a /customers/
            const response = await axios.get('/customers/');
            console.log('Respuesta clientes:', response.data);
            
            // Verificar el formato de la respuesta y adaptarlo si es necesario
            if (Array.isArray(response.data)) {
                setCustomers(response.data);
            } else if (response.data?.results) {
                setCustomers(response.data.results);
            } else {
                setCustomers([]);
                toast.error('Formato de respuesta no reconocido', { position: 'top-right' });
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            toast.error('Error al cargar la lista de clientes', { position: 'top-right' });
        } finally {
            setCustomersLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setNotes('');
    };

    const handleCreateTicket = async () => {
        try {
            setLoading(true);
            const ticketData = {
                customer: selectedCustomer ? selectedCustomer.id : null,
                notes: notes || ""  // Asegurarnos de que notes no sea undefined
            };

            console.log('Enviando datos:', ticketData);  // Log para depuración
            const newTicket = await createTicket(ticketData);
            onSuccess && onSuccess();
            askToNavigateToTicket(newTicket.id);
            resetForm();
        } catch (error) {
            console.error('Error al crear ticket:', error);
            toast.error(error.response?.data?.detail || 'Error al crear el ticket', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Crear Nuevo Ticket</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Autocomplete
                        options={customers}
                        loading={customersLoading}
                        getOptionLabel={(option) => option.name}
                        value={selectedCustomer}
                        onChange={(event, newValue) => {
                            setSelectedCustomer(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Cliente (opcional)"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {customersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => {
                            // Extraemos la key para evitar warnings
                            const { key, ...otherProps } = props;
                            return (
                                <Box component="li" key={option.id} {...otherProps}>
                                    <Box>
                                        <Typography variant="body1">
                                            {option.name}
                                        </Typography>
                                        {option.tax_id && (
                                            <Typography variant="body2" color="text.secondary">
                                                {option.tax_id}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notas (opcional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        margin="normal"
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Puedes crear un ticket sin seleccionar un cliente. También podrás añadir productos después de crear el ticket.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button 
                    onClick={handleCreateTicket} 
                    variant="contained" 
                    color="primary" 
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : "Crear Ticket"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewTicketDialog;