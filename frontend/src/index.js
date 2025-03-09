import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import 'src/assets/css/index.css';
import { AuthProvider } from 'src/hooks/useAuth';
import { Router } from 'src/routes';
import { LibraryProvider } from './utils/LibProvider';
import { MultiProvider } from './utils/MultiProvider';

const libraries = {
    lsf: {
        scriptSrc: '/lsf.js',
        cssSrc: '/lsf.css',
        checkAvailability: () => !!window.LabelStudio,
    }
};

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://backend:5000';

const App = () => {
    const [backendStatus, setBackendStatus] = useState(null);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/healthz`);
                if (response.ok) {
                    setBackendStatus('connected');
                } else {
                    setBackendStatus('error');
                }
            } catch (error) {
                setBackendStatus('error');
            }
        };

        checkBackend();
    }, []);

    if (backendStatus === 'error') {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                <h1>⚠️ Backend is unreachable</h1>
                <p>Ensure the backend is running and accessible at <strong>{BACKEND_URL}</strong></p>
            </div>
        );
    }

    return (
        <MultiProvider
            providers={[
                <LibraryProvider key="lsf" libraries={libraries} />,
                <AuthProvider />
            ]}
        >
            <Router />
        </MultiProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
