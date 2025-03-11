import React from 'react';
import { Box, Breadcrumbs, Link, Typography, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    Home as HomeIcon,
    Storage as StorageIcon,
    Warehouse as WarehouseIcon,
    Apartment as DepartmentIcon,
    ViewModule as ShelfIcon,
    ViewStream as TrayIcon
} from '@mui/icons-material';

const StorageNavigation = ({ 
    warehouseName, departmentName, shelfName, trayName, 
    warehouseId, departmentId, shelfId, trayId,
    currentLevel = 0
}) => {
    // Nivel 0: Home
    // Nivel 1: Storage
    // Nivel 2: Warehouses
    // Nivel 3: Departments
    // Nivel 4: Shelves
    // Nivel 5: Trays
    
    const levels = [
        { name: 'Dashboard', icon: <HomeIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />, path: '/dashboard' },
        { name: 'Almacenamiento', icon: <StorageIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />, path: '/dashboard/storage' },
        { name: 'Almacenes', icon: <WarehouseIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />, path: '/dashboard/storage/warehouses' }
    ];

    if (warehouseName && warehouseId) {
        levels.push({
            name: warehouseName,
            icon: null,
            path: `/dashboard/storage/warehouses/${warehouseId}/departments`
        });
    }

    if (departmentName && departmentId) {
        levels.push({
            name: departmentName,
            icon: <DepartmentIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />,
            path: `/dashboard/storage/departments/${departmentId}/shelves`
        });
    }

    if (shelfName && shelfId) {
        levels.push({
            name: shelfName,
            icon: <ShelfIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />,
            path: `/dashboard/storage/shelves/${shelfId}/trays`
        });
    }

    if (trayName && trayId) {
        levels.push({
            name: trayName,
            icon: <TrayIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />,
            path: `/dashboard/storage/trays/${trayId}/materials`
        });
    }

    return (
        <Paper sx={{ p: 1, mb: 2, backgroundColor: '#f8f8f8' }}>
            <Breadcrumbs aria-label="jerarquía de almacenamiento">
                {levels.map((level, index) => {
                    const isLast = index === levels.length - 1;
                    
                    if (isLast || index === currentLevel) {
                        return (
                            <Typography 
                                key={index}
                                color="text.primary"
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    fontWeight: index === currentLevel ? 'bold' : 'normal'
                                }}
                            >
                                {level.icon}
                                {level.name}
                            </Typography>
                        );
                    }
                    
                    return (
                        <Link
                            key={index}
                            component={RouterLink}
                            to={level.path}
                            underline="hover"
                            color="inherit"
                            sx={{ display: 'flex', alignItems: 'center' }}
                        >
                            {level.icon}
                            {level.name}
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Paper>
    );
};

export default StorageNavigation;