// components/LogStream.tsx
//
// Stream de logs en tiempo real con scroll automático.
//
// Conceptos clave:
//
// useRef:
//   Crea una referencia al DOM sin causar re-renders.
//   Usamos ref.current?.scrollIntoView() para scrollear al último log
//   cada vez que llega uno nuevo, sin que React necesite actualizar la UI por eso.
//
// useEffect con [logs] como dependencia:
//   Se ejecuta DESPUÉS de cada render en que 'logs' cambió.
//   Entonces: nuevo log → React re-renderiza → useEffect corre → scroll al fondo.

'use client';

import { useEffect, useRef } from 'react';
import { LogLevel, type TaskLogEvent } from '@/types';

// Color de texto según nivel del log — convención estándar de terminales
const levelColor: Record<LogLevel, string> = {
  info:  'text-slate-300',
  warn:  'text-yellow-400',
  error: 'text-red-400',
};

interface Props {
  logs: TaskLogEvent[];
}

export function LogStream({ logs }: Props) {
  // bottomRef apunta al div vacío al final de la lista — el target del scroll
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scrollIntoView lleva el div al viewport con animación suave
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]); // se ejecuta cada vez que el array 'logs' cambia

  return (
    <div className="bg-slate-900 rounded-xl p-4 h-80 overflow-y-auto font-mono text-xs leading-relaxed">
      {logs.length === 0 ? (
        <p className="text-slate-500 italic">Waiting for logs...</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="flex gap-3 mb-0.5">
            {/* Timestamp formateado — solo la hora, no la fecha */}
            <span className="text-slate-600 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={levelColor[log.level]}>{log.message}</span>
          </div>
        ))
      )}
      {/* Este div invisible es el target del scroll automático */}
      <div ref={bottomRef} />
    </div>
  );
}
