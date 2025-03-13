import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { Close, LocationOn, Warning } from '@mui/icons-material';
import { getMaterialLocations } from '../../services/storageService';
import { toast } from 'react-hot-toast';

const LocationSelector = ({ 
  open, 
  onClose, 
  materialId, 
  materialName,
  quantity,
  onSelectLocation 
}) => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && materialId) {
      fetchLocations();
    }
  }, [open, materialId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMaterialLocations({ material: materialId });
      // Filtrar ubicaciones con stock disponible
      const availableLocations = data.filter(loc => loc.quantity > 0);
      
      setLocations(availableLocations);
      
      // Si no hay ubicaciones disponibles, mostrar error
      if (availableLocations.length === 0) {
        setError('No hay ubicaciones disponibles para este material');
      }
      
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err);
      setError('Error al cargar las ubicaciones disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      toast.error('Debe seleccionar una ubicación');
      return;
    }

    // Verificar si la ubicación tiene suficiente stock
    if (selectedLocation.quantity < quantity) {
      toast.error(`Stock insuficiente en la ubicación seleccionada. Disponible: ${selectedLocation.quantity}`);
      return;
    }

    onSelectLocation(selectedLocation);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Seleccionar ubicación para retirar {materialName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Cargando ubicaciones disponibles...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Seleccione la ubicación desde donde desea retirar <strong>{quantity}</strong> unidades de <strong>{materialName}</strong>:
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Cantidad disponible</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell align="right">Stock mínimo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.map((location) => {
                    const isStockLow = location.quantity <= location.minimum_quantity;
                    const hasEnoughStock = location.quantity >= quantity;
                    
                    return (
                      <TableRow 
                        key={location.id}
                        hover
                        onClick={() => handleSelectLocation(location)}
                        selected={selectedLocation?.id === location.id}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: isStockLow ? 'rgba(255, 152, 0, 0.1)' : 'inherit'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Radio 
                            checked={selectedLocation?.id === location.id}
                            onChange={() => handleSelectLocation(location)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" />
                            <Typography variant="body2">
                              {location.warehouse_name} &gt; {location.department_name} &gt; {location.shelf_name} &gt; {location.tray_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="body2"
                              color={isStockLow ? 'error.main' : 'inherit'}
                              fontWeight={isStockLow ? 'bold' : 'normal'}
                            >
                              {location.quantity}
                            </Typography>
                            {!hasEnoughStock && (
                              <Tooltip title="Stock insuficiente para la cantidad solicitada">
                                <Warning color="error" fontSize="small" sx={{ ml: 1 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {location.tray_full_code || '-'}
                        </TableCell>
                        <TableCell align="right">
                          {location.minimum_quantity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No hay ubicaciones disponibles para este material
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          disabled={!selectedLocation || loading || selectedLocation.quantity < quantity}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationSelector;