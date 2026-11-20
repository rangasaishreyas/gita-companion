import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';

// ask the browser to keep our IndexedDB data even under storage pressure
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
