// components/StatusBadge.tsx
//
// Componente de presentación pura.
// "Puro" = solo recibe props, devuelve JSX, sin estado ni efectos.
// Es el tipo de componente más simple y fácil de testear.
//
// Recibe un status y devuelve un badge con color y dot animado.
// El dot pulsa cuando el status es "running" — feedback visual de actividad.

import { WorkflowStatus, TaskStatus } from '@/types';

type Status = WorkflowStatus | TaskStatus;

// Mapeamos cada status a clases Tailwind.
// Record<Status, string> garantiza que no nos olvidamos de ningún status.
const statusStyles: Record<Status, string> = {
  pending:   'bg-slate-100 text-slate-500',
  running:   'bg-blue-50  text-blue-700',
  completed: 'bg-green-50 text-green-700',
  failed:    'bg-red-50   text-red-600',
};

const dotStyles: Record<Status, string> = {
  pending:   'bg-slate-400',
  running:   'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed:    'bg-red-500',
};

const labels: Record<Status, string> = {
  pending:   'Pending',
  running:   'Running',
  completed: 'Completed',
  failed:    'Failed',
};

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}
