// lib/socket.ts
//
// Cliente WebSocket — patrón Singleton.
//
// "Singleton" = solo existe UNA instancia de la conexión en toda la app.
//
// Por qué importa:
//   Si cada componente creara su propia conexión, tendríamos N conexiones
//   abiertas al servidor — ineficiente y difícil de coordinar.
//   Con el singleton, todos los componentes comparten la misma conexión.
//
// Cómo funciona:
//   La variable 'socket' vive en el módulo (fuera de React).
//   La primera vez que alguien llama getSocket(), se crea la conexión.
//   Las veces siguientes, devuelve la misma instancia.

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:3000', {
      // Usamos WebSocket directo, sin el fallback a long-polling
      // Long-polling: técnica vieja que simula "push" haciendo requests
      // WebSocket: conexión bidireccional real y permanente
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
