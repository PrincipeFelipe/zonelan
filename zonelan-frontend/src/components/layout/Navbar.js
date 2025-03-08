import React, { useState, useEffect } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Box,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Badge
} from '@mui/material';
import { 
    AccountCircle, 
    Logout, 
    Person, 
    Lock,
    Notifications,
    ReceiptLong
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import authService from '../../services/authService';
import incidentService from '../../services/incidentService';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = authService.getCurrentUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [openProfileDialog, setOpenProfileDialog] = useState(false);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [incidentsCount, setIncidentsCount] = useState(0);

    const navItems = [
        { label: 'Usuarios', path: '/dashboard/users', minRole: 'Gestor' },
        { label: 'Clientes', path: '/dashboard/customers', minRole: 'User' },
        { label: 'Materiales', path: '/dashboard/materials', minRole: 'User' },
        { label: 'Control de Materiales', path: '/dashboard/materials/control', minRole: 'Gestor' },
        { label: 'Incidencias', path: '/dashboard/incidents', minRole: 'User' },
        { label: 'Partes', path: '/dashboard/reports', minRole: 'User' },
        { label: 'Tickets', path: '/dashboard/tickets', minRole: 'User', icon: <ReceiptLong /> }, // Nuevo enlace a tickets
    ];

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        authService.logout();
        navigate('/login');
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas nuevas no coinciden'
            });
            return;
        }

        try {
            await authService.changePassword(passwords.current, passwords.new);
            toast.success('Contraseña actualizada correctamente');
            setOpenPasswordDialog(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al cambiar la contraseña'
            });
        }
    };

    const handleViewProfile = () => {
        handleClose();
        setOpenProfileDialog(true);
    };

    const canAccess = (minRole) => {
        const roles = {
            'SuperAdmin': 4,
            'Admin': 3,
            'Gestor': 2,
            'User': 1
        };
        // Si es SuperAdmin, siempre tiene acceso
        if (user?.type === 'SuperAdmin') return true;
        // Para otros roles, verificar el nivel de acceso
        return roles[user?.type] >= roles[minRole];
    };

    // Función para obtener conteo de incidencias
    const fetchIncidentsCount = async () => {
        try {
            const counts = await incidentService.getPendingIncidentsCount();
            setIncidentsCount(counts.total);
        } catch (error) {
            console.error('Error al obtener conteo de incidencias:', error);
        }
    };

    // Efecto para cargar conteo de incidencias al montar el componente
    useEffect(() => {
        if (user) {
            // Cargar inicialmente
            fetchIncidentsCount();
            
            // Configurar intervalo para actualizar cada cierto tiempo
            const intervalId = setInterval(() => {
                fetchIncidentsCount();
            }, 60000); // Actualizar cada minuto
            
            // Escuchar eventos de actualización desde otros componentes
            const handleIncidentCountUpdate = (event) => {
                const newCounts = event.detail;
                setIncidentsCount(newCounts.total);
            };
            
            window.addEventListener('incidentCountUpdated', handleIncidentCountUpdate);
            
            // Limpiar intervalo y listener al desmontar
            return () => {
                clearInterval(intervalId);
                window.removeEventListener('incidentCountUpdated', handleIncidentCountUpdate);
            };
        }
    }, [user]);

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
                    Zonelan
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex' }}>
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            color="inherit"
                            onClick={() => navigate(item.path)}
                            sx={{
                                mr: 2,
                                display: canAccess(item.minRole) ? 'block' : 'none',
                                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent'
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Icono de notificaciones con contador */}
                    <IconButton 
                        color="inherit" 
                        onClick={() => navigate('/dashboard/incidents')}
                        sx={{ mr: 2 }}
                    >
                        <Badge badgeContent={incidentsCount} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>
                    
                    {/* Menú de usuario */}
                    <IconButton
                        size="large"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleViewProfile}>
                            <ListItemIcon>
                                <Person fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Ver Perfil</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => {
                            handleClose();
                            setOpenPasswordDialog(true);
                        }}>
                            <ListItemIcon>
                                <Lock fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Cambiar Contraseña</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Cerrar Sesión</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>

            {/* Diálogo de Cambio de Contraseña */}
            <Dialog 
                open={openPasswordDialog} 
                onClose={() => setOpenPasswordDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        type="password"
                        label="Contraseña Actual"
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        type="password"
                        label="Nueva Contraseña"
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
                    <Button onClick={handlePasswordChange} variant="contained">
                        Cambiar Contraseña
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de Perfil */}
            <Dialog
                open={openProfileDialog}
                onClose={() => setOpenProfileDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Perfil de Usuario</DialogTitle>
                <DialogContent>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            <strong>Usuario:</strong> {user?.username}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Nombre:</strong> {user?.name}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Email:</strong> {user?.email}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Teléfono:</strong> {user?.phone}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Código:</strong> {user?.cod_worker}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Tipo:</strong> {user?.type}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProfileDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
};

export default Navbar;