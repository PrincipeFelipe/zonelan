import React from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import Navbar from '../layout/Navbar';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Outlet />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default Dashboard;