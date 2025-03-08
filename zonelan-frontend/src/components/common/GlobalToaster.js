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
                    style: {
                        background: 'white',
                        color: 'green',
                    },
                },
                error: {
                    style: {
                        background: 'white',
                        color: 'red',
                    },
                },
            }}
        />
    );
};

export default GlobalToaster;