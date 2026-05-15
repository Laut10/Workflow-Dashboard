// hooks/useWorkflowSocket.ts
//
// Custom Hook para escuchar eventos WebSocket del backend.
//
// Concepto: Custom Hook
//   Una función que empieza con "use" y puede usar otros hooks de React.
//   Este hook encapsula la lógica de socket.io para que los componentes
//   no tengan que saber cómo funciona internamente.
//   Los componentes solo declaran qué hacer cuando llega cada evento.
//
// Patrón clave: useEffect con cleanup
//   El cleanup es la función que retorna useEffect.
//   Se ejecuta cuando el componente se desmonta (el usuario navega a otra página).
//   Sin cleanup, los listeners quedarían activos para siempre — "memory leak".

'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type { WorkflowUpdateEvent, TaskUpdateEvent, TaskLogEvent } from '@/types';

interface SocketHandlers {
  onWorkflowUpdate?: (event: WorkflowUpdateEvent) => void;
  onTaskUpdate?: (event: TaskUpdateEvent) => void;
  onTaskLog?: (event: TaskLogEvent) => void;
}

export function useWorkflowSocket(handlers: SocketHandlers) {
  useEffect(() => {
    const socket = getSocket();

    // Registramos cada listener solo si el componente lo provee
    if (handlers.onWorkflowUpdate) {
      socket.on('workflow:update', handlers.onWorkflowUpdate);
    }
    if (handlers.onTaskUpdate) {
      socket.on('task:update', handlers.onTaskUpdate);
    }
    if (handlers.onTaskLog) {
      socket.on('task:log', handlers.onTaskLog);
    }

    // Cleanup: removemos los listeners al desmontar el componente
    return () => {
      if (handlers.onWorkflowUpdate) {
        socket.off('workflow:update', handlers.onWorkflowUpdate);
      }
      if (handlers.onTaskUpdate) {
        socket.off('task:update', handlers.onTaskUpdate);
      }
      if (handlers.onTaskLog) {
        socket.off('task:log', handlers.onTaskLog);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // [] = ejecutar solo una vez, al montar el componente
}
