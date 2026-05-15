// components/TaskItem.tsx
//
// Muestra una tarea individual dentro de la página de detalle del workflow.
// El color del borde cambia según el status — feedback visual inmediato.

import { StatusBadge } from '@/components/StatusBadge';
import { TaskType, type Task } from '@/types';

// Label legible por humanos para cada tipo de tarea
const taskTypeLabels: Record<TaskType, string> = {
  http_request:   'HTTP Request',
  data_transform: 'Data Transform',
  notification:   'Notification',
  delay:          'Delay',
  claude_request: 'Claude AI',
  send_email:     'Send Email',
};

// Clases del borde según status — hace visible el estado de un vistazo
const borderByStatus: Record<string, string> = {
  pending:   'border-slate-200 bg-white',
  running:   'border-blue-200  bg-blue-50/40',
  completed: 'border-green-200 bg-green-50/30',
  failed:    'border-red-200   bg-red-50/30',
};

interface Props {
  task: Task;
}

export function TaskItem({ task }: Props) {
  const borderClass = borderByStatus[task.status] ?? 'border-slate-200 bg-white';

  // Duración de la tarea en segundos (si ya terminó)
  const duration =
    task.startedAt && task.finishedAt
      ? ((new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime()) / 1000).toFixed(1)
      : null;

  return (
    <div className={`border rounded-lg p-4 transition-colors ${borderClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{task.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{taskTypeLabels[task.type]}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {duration && (
            <span className="text-xs text-slate-400">{duration}s</span>
          )}
          <StatusBadge status={task.status} />
        </div>
      </div>

      {/* Mensaje de error — visible solo si la tarea falló */}
      {task.error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 font-mono">
          {task.error}
        </p>
      )}
    </div>
  );
}
