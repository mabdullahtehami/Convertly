/* ==========================================================
   Convertly React - global toast (the #toast element)
   ========================================================== */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [state, setState] = useState({ message: '', type: '', show: false });
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = useCallback((message, type = '') => {
    setState({ message, type, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => ({ ...s, show: false })), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={state.show ? 'toast show ' + state.type : 'toast ' + state.type} role="status" aria-live="polite">
        {state.message}
      </div>
    </ToastContext.Provider>
  );
}
