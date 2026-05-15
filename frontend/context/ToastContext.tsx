// context/ToastContext.tsx
//
// Context de React para toasts globales.
//
// Por qué Context y no simplemente props:
//   Los toasts pueden dispararse desde cualquier componente de la app.
//   Pasar la función 'toast' como prop por toda la jerarquía sería tedioso
//   (prop drilling). Context soluciona esto: cualquier componente puede
//   llamar useToast() sin importar dónde esté en el árbol.
//
// Patrón: createContext + Provider + custom hook
//   1. createContext crea el "canal"
//   2. ToastProvider provee el valor a todos sus hijos
//   3. useToast() es el hook que consumen los componentes

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

// createContext necesita un valor por defecto — usamos null y lo validamos en el hook
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss después de 3.5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook que usan los componentes — lanza error si se usa fuera del Provider
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
