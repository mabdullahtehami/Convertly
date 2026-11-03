/* ==========================================================
   Convertly React - entry point
   CSS is shared with the vanilla version (css/) and must
   load in this order: style -> home-grid -> media-tools
   ========================================================== */
import { createRoot } from 'react-dom/client';
import '../../css/style.css';
import '../../css/home-grid.css';
import '../../css/media-tools.css';

import App from './App.jsx';
import { ToastProvider } from './lib/toast.jsx';

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
