import React from 'react';
import { Toaster } from 'react-hot-toast';

const GlobalToaster = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
                success: {
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                },
                error: {
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                },
            }}
        />
    );
};

export default GlobalToaster;