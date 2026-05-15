// components/Toaster.tsx
//
// Renderiza el stack de toasts en la esquina superior derecha.
// Lee los toasts del Context (no recibe props).
//
// Animación: los toasts entran con translate-x y opacity via Tailwind.
// Cada toast tiene un botón × para cerrarse antes del auto-dismiss.

'use client';

import { useToast, type Toast } from '@/context/ToastContext';

const styles: Record<Toast['type'], string> = {
  success: 'bg-white border-l-4 border-green-500 text-slate-800',
  error:   'bg-white border-l-4 border-red-500   text-slate-800',
  info:    'bg-white border-l-4 border-blue-500  text-slate-800',
};

const icons: Record<Toast['type'], string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
};

const iconStyles: Record<Toast['type'], string> = {
  success: 'bg-green-100 text-green-600',
  error:   'bg-red-100   text-red-600',
  info:    'bg-blue-100  text-blue-600',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    // Portal visual: fixed en top-right, z-index alto para estar sobre todo
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg ${styles[t.type]} animate-in`}
        >
          {/* Icono del tipo */}
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${iconStyles[t.type]}`}>
            {icons[t.type]}
          </span>

          {/* Mensaje */}
          <p className="text-sm flex-1 leading-snug">{t.message}</p>

          {/* Botón de dismiss */}
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
