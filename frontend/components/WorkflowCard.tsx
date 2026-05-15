// components/WorkflowCard.tsx
//
// Tarjeta de workflow para el dashboard principal.
//
// Patrón "lifting state up":
//   Este componente NO maneja el estado de los workflows.
//   Recibe los datos por props y llama callbacks (onRun, onDelete)
//   para que el padre (page.tsx) actualice el estado global.
//   Así el componente es reutilizable y predecible.

import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { WorkflowStatus, type Workflow } from '@/types';

interface Props {
  workflow: Workflow;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
}

// Calcula cuántas tareas completadas hay para la barra de progreso
function getProgress(workflow: Workflow) {
  const total = workflow.tasks.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = workflow.tasks.filter(t => t.status === 'completed').length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

export function WorkflowCard({ workflow, onRun, onDelete }: Props) {
  const progress = getProgress(workflow);

  // Solo se puede ejecutar si no está corriendo actualmente
  const canRun = workflow.status !== WorkflowStatus.RUNNING;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: nombre + badge de status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {/* Link al detalle del workflow */}
          <Link
            href={`/workflows/${workflow.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block"
          >
            {workflow.name}
          </Link>
          {workflow.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{workflow.description}</p>
          )}
        </div>
        <StatusBadge status={workflow.status} />
      </div>

      {/* Barra de progreso — solo si hay tareas */}
      {progress.total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{progress.completed}/{progress.total} tasks</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                workflow.status === WorkflowStatus.RUNNING ? 'bg-blue-400' :
                workflow.status === WorkflowStatus.COMPLETED ? 'bg-green-400' :
                workflow.status === WorkflowStatus.FAILED ? 'bg-red-400' :
                'bg-slate-300'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: fecha + acciones */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {new Date(workflow.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onRun(workflow.id)}
            disabled={!canRun}
            className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Run
          </button>
          <button
            onClick={() => onDelete(workflow.id)}
            className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
