// app/workflows/[id]/page.tsx
//
// Página de detalle de un workflow individual.
//
// Next.js App Router — Rutas dinámicas:
//   Los corchetes en el nombre de la carpeta ([id]) crean una ruta dinámica.
//   /workflows/abc123 → este archivo se renderiza con params.id = "abc123"
//   /workflows/xyz789 → mismo archivo con params.id = "xyz789"
//   useParams() lee ese valor desde la URL.
//
// Layout de la página:
//   - Header: nombre, status, botones Run/Delete
//   - Columna izquierda: lista de tareas con sus estados
//   - Columna derecha: stream de logs en tiempo real
//
// Flujo de WebSocket acá:
//   Los logs se ACUMULAN en estado local (array que crece).
//   Los estados de tareas se ACTUALIZAN (reemplazamos el valor anterior).

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useWorkflowSocket } from '@/hooks/useWorkflowSocket';
import { TaskItem } from '@/components/TaskItem';
import { LogStream } from '@/components/LogStream';
import { StatusBadge } from '@/components/StatusBadge';
import { WorkflowStatus, type Workflow, type TaskLogEvent } from '@/types';

export default function WorkflowDetailPage() {
  // useParams extrae los parámetros de la URL
  const { id } = useParams<{ id: string }>();
  // useRouter permite navegar programáticamente (ej: router.push('/'))
  const router = useRouter();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [logs, setLogs] = useState<TaskLogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos el workflow al entrar a la página
  useEffect(() => {
    api.getWorkflow(id)
      .then(setWorkflow)
      .catch(() => setWorkflow(null))
      .finally(() => setLoading(false));
  }, [id]);

  // WebSocket: actualizamos estados y acumulamos logs en tiempo real
  useWorkflowSocket({
    onWorkflowUpdate: (event) => {
      // Solo procesamos eventos del workflow que estamos mirando
      if (event.workflowId !== id) return;
      setWorkflow(prev => prev ? { ...prev, status: event.status } : prev);
    },
    onTaskUpdate: (event) => {
      setWorkflow(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === event.taskId ? { ...t, status: event.status } : t
          ),
        };
      });
    },
    onTaskLog: (event) => {
      // Los logs se acumulan — cada ejecución agrega nuevos mensajes
      setLogs(prev => [...prev, event]);
    },
  });

  async function handleRun() {
    if (!workflow) return;
    // Limpiamos los logs de la ejecución anterior antes de empezar
    setLogs([]);
    await api.runWorkflow(id);
  }

  async function handleDelete() {
    await api.deleteWorkflow(id);
    // Navegamos de vuelta al dashboard después de borrar
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-3">Workflow not found</p>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canRun = workflow.status !== WorkflowStatus.RUNNING;

  return (
    <div className="min-h-screen">
      {/* Navbar con breadcrumb */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            Workflows
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate">{workflow.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header del workflow */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{workflow.name}</h1>
              <StatusBadge status={workflow.status} />
            </div>
            {workflow.description && (
              <p className="text-slate-500 mt-1 text-sm">{workflow.description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Created {new Date(workflow.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {workflow.status === WorkflowStatus.RUNNING ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Contenido: tasks + logs en dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: tareas en orden de ejecución */}
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Tasks ({workflow.tasks.length})
            </h2>
            <div className="space-y-2">
              {workflow.tasks
                .sort((a, b) => a.order - b.order)
                .map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
            </div>
          </section>

          {/* Columna derecha: logs en tiempo real */}
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Logs {logs.length > 0 && <span className="text-slate-300">({logs.length})</span>}
            </h2>
            <LogStream logs={logs} />
          </section>
        </div>
      </main>
    </div>
  );
}
