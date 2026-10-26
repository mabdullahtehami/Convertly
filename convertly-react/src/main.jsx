/* ==========================================================
   Convertly React - entry point
   CSS is imported (and copied 1:1) in the required order:
   style.css -> home-grid.css -> media-tools.css
   ========================================================== */
import { createRoot } from 'react-dom/client';
import './css/style.css';
import './css/home-grid.css';
import './css/media-tools.css';

import App from './App.jsx';
import { ToastProvider } from './lib/toast.jsx';

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
