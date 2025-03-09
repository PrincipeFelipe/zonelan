import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';

const validationSchema = Yup.object({
    username: Yup.string()
        .required('El usuario es requerido'),
    password: Yup.string()
        .required('La contraseña es requerida')
});

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setError(''); // Limpiar errores anteriores
            const result = await authService.login(values);
            
            if (result) {
                // Asegurar que la redirección ocurra después de que authService.login se complete
                console.log('Login exitoso, redirigiendo al dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 100); // Pequeño retraso para asegurar que los estados se actualicen
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err) {
            console.error('Error durante el inicio de sesión:', err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Iniciar Sesión
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Formik
                        initialValues={{
                            username: '',
                            password: ''
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ values, errors, touched, handleChange, isSubmitting }) => (
                            <Form>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    name="username"
                                    label="Usuario"
                                    value={values.username}
                                    onChange={handleChange}
                                    error={touched.username && Boolean(errors.username)}
                                    helperText={touched.username && errors.username}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    name="password"
                                    label="Contraseña"
                                    type="password"
                                    value={values.password}
                                    onChange={handleChange}
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    disabled={isSubmitting}
                                >
                                    Iniciar Sesión
                                </Button>
                            </Form>
                        )}
                    </Formik>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <Typography color="primary">
                                ¿No tienes cuenta? Regístrate
                            </Typography>
                        </Link>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;