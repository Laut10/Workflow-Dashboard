// lib/api.ts
//
// Cliente HTTP centralizado para la REST API del backend.
//
// Patrón: en lugar de escribir fetch() en cada componente,
// creamos un objeto 'api' con funciones tipadas.
//
// Ventajas:
//   - La URL base está en un solo lugar
//   - Los tipos de retorno están garantizados por TypeScript
//   - Si cambia un endpoint, lo cambiás acá y se arregla en toda la app

import type { Workflow, CreateWorkflowInput } from '@/types';

const BASE_URL = 'http://localhost:3000';

// Helper privado: hace el fetch y maneja errores HTTP de forma uniforme.
// El genérico <T> le dice a TypeScript qué tipo va a devolver cada llamada.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    // Si el servidor devuelve 4xx o 5xx, lanzamos un error con el mensaje
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Algunos endpoints devuelven 204 No Content (como DELETE)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // GET /workflows — trae todos los workflows con sus tareas
  getWorkflows: () =>
    request<Workflow[]>('/workflows'),

  // GET /workflows/:id — detalle de un workflow con tareas y logs
  getWorkflow: (id: string) =>
    request<Workflow>(`/workflows/${id}`),

  // POST /workflows — crea un workflow nuevo
  createWorkflow: (data: CreateWorkflowInput) =>
    request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // POST /workflows/:id/run — dispara la ejecución del workflow
  // El backend responde rápido; el progreso real llega por WebSocket
  runWorkflow: (id: string) =>
    request<void>(`/workflows/${id}/run`, { method: 'POST' }),

  // DELETE /workflows/:id — borra el workflow y sus tareas en cascada
  deleteWorkflow: (id: string) =>
    request<void>(`/workflows/${id}`, { method: 'DELETE' }),
};
