import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    MenuItem,
    Alert
} from '@mui/material';
import authService from '../../services/authService';

const validationSchema = Yup.object({
    username: Yup.string().required('Usuario requerido'),
    password: Yup.string().required('Contraseña requerida')
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: Yup.string().required('Nombre requerido'),
    email: Yup.string().email('Email inválido').required('Email requerido'),
    phone: Yup.string().required('Teléfono requerido'),
    cod_worker: Yup.string().required('Código de trabajador requerido'),
    type: Yup.string().required('Tipo de usuario requerido')
});

const userTypes = [
    { value: 'User', label: 'Usuario' },
    { value: 'Gestor', label: 'Gestor' },
    { value: 'Admin', label: 'Administrador' }
];

const Register = () => {
    const navigate = useNavigate();

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        try {
            await authService.register(values);
            navigate('/login');
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography component="h1" variant="h5" align="center">
                    Registro
                </Typography>
                <Formik
                    initialValues={{
                        username: '',
                        password: '',
                        name: '',
                        email: '',
                        phone: '',
                        cod_worker: '',
                        type: ''
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
                            <TextField
                                fullWidth
                                margin="normal"
                                name="name"
                                label="Nombre"
                                value={values.name}
                                onChange={handleChange}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="email"
                                label="Email"
                                value={values.email}
                                onChange={handleChange}
                                error={touched.email && Boolean(errors.email)}
                                helperText={touched.email && errors.email}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="phone"
                                label="Teléfono"
                                value={values.phone}
                                onChange={handleChange}
                                error={touched.phone && Boolean(errors.phone)}
                                helperText={touched.phone && errors.phone}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="cod_worker"
                                label="Código de trabajador"
                                value={values.cod_worker}
                                onChange={handleChange}
                                error={touched.cod_worker && Boolean(errors.cod_worker)}
                                helperText={touched.cod_worker && errors.cod_worker}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                select
                                name="type"
                                label="Tipo de usuario"
                                value={values.type}
                                onChange={handleChange}
                                error={touched.type && Boolean(errors.type)}
                                helperText={touched.type && errors.type}
                            >
                                {userTypes.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                sx={{ mt: 3 }}
                                disabled={isSubmitting}
                            >
                                Registrarse
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Paper>
        </Container>
    );
};

export default Register;