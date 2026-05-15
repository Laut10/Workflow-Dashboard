// app/page.tsx
//
// Página principal del dashboard — lista de todos los workflows.
//
// Conceptos de React usados acá:
//
// useState:
//   Guarda datos que pueden cambiar. Cuando cambian, React re-renderiza el componente.
//   Ejemplo: cuando llega un evento WebSocket, actualizamos workflows → UI se actualiza.
//
// useEffect:
//   Ejecuta código con efectos secundarios (como fetch) después de renderizar.
//   El array vacío [] significa "solo al montar el componente" — se ejecuta una vez.
//
// useCallback:
//   Memoriza una función para que no se recree en cada render.
//   Importante cuando la función es una dependencia de useEffect.
//
// Flujo de datos:
//   1. Montar → useEffect → GET /workflows → setWorkflows → re-render
//   2. Evento WS → actualiza solo el workflow/task afectado en el estado local
//   3. Crear → POST /workflows → agrega al estado local (sin re-fetch)
//   4. Borrar → DELETE /workflows/:id → filtra del estado local

'use client'; // Necesario porque usamos hooks de React (useState, useEffect)

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWorkflowSocket } from '@/hooks/useWorkflowSocket';
import { useToast } from '@/context/ToastContext';
import { WorkflowCard } from '@/components/WorkflowCard';
import { CreateWorkflowModal } from '@/components/CreateWorkflowModal';
import type { Workflow, CreateWorkflowInput } from '@/types';

export default function DashboardPage() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Carga los workflows del backend al montar la página
  const loadWorkflows = useCallback(async () => {
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias — la función no cambia nunca

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Escucha eventos WebSocket para actualizar la UI en tiempo real
  // Sin esto, habría que hacer polling o navegar para ver cambios de estado
  useWorkflowSocket({
    onWorkflowUpdate: (event) => {
      // Actualizamos solo el workflow que cambió — inmutable con map
      setWorkflows(prev =>
        prev.map(w => w.id === event.workflowId ? { ...w, status: event.status } : w)
      );
    },
    onTaskUpdate: (event) => {
      // Actualizamos la tarea dentro del workflow que la contiene
      setWorkflows(prev =>
        prev.map(w => ({
          ...w,
          tasks: w.tasks.map(t =>
            t.id === event.taskId ? { ...t, status: event.status } : t
          ),
        }))
      );
    },
  });

  async function handleRun(id: string) {
    try {
      await api.runWorkflow(id);
      toast('Workflow started', 'info');
    } catch {
      toast('Failed to start workflow', 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast('Workflow deleted');
    } catch {
      toast('Failed to delete workflow', 'error');
    }
  }

  async function handleCreate(data: CreateWorkflowInput) {
    const workflow = await api.createWorkflow(data);
    setWorkflows(prev => [workflow, ...prev]);
    toast('Workflow created');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-slate-900">Workflow Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            + New Workflow
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {workflows.length === 0
              ? 'No workflows yet'
              : `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Estado vacío */}
        {workflows.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 mb-2">No workflows yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Create your first workflow
            </button>
          </div>
        ) : (
          // Grid responsivo: 1 columna en mobile, 2 en tablet+
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workflows.map(w => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onRun={handleRun}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal — se monta/desmonta condicionalmente */}
      {showModal && (
        <CreateWorkflowModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
