import React from 'react';
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


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <MultiProvider
        providers={[
            <LibraryProvider key="lsf" libraries={libraries} />,
            <AuthProvider/>
        ]}>
        <Router />
    </MultiProvider>
);
