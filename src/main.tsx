import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPWA } from './services/pwaHelper.ts';

// Initialize PWA dynamic subpath resolution and service worker
initPWA();

createRoot(document.getElementById('root')!).render(<App />);

