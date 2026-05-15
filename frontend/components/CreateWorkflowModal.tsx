// components/CreateWorkflowModal.tsx
//
// Modal para crear un workflow nuevo.
//
// Conceptos:
//
// Controlled form:
//   Cada input tiene su valor en useState. React controla lo que se muestra.
//   onChange actualiza el estado → React re-renderiza → el input refleja el estado.
//   Es la forma idiomática de manejar formularios en React.
//
// Templates:
//   La config de las tareas es JSON complejo, así que ofrecemos templates
//   predefinidos. El usuario elige un template y solo escribe el nombre.
//
// Props onClose / onCreate:
//   El modal no sabe qué hacer cuando se cierra o se crea — eso lo decide el padre.
//   Le pasamos funciones como props para que el padre maneje esas acciones.

'use client';

import { useState } from 'react';
import { TaskType, type CreateWorkflowInput, type CreateTaskInput } from '@/types';

// Templates predefinidos — configuraciones listas para usar
const TEMPLATES: Record<string, { description: string; tasks: CreateTaskInput[] }> = {
  'HTTP + Notify': {
    description: 'Hace un HTTP request y envía una notificación',
    tasks: [
      {
        name: 'Fetch data',
        type: TaskType.HTTP_REQUEST,
        order: 0,
        config: { http_request: { url: 'https://api.example.com/data', method: 'GET' } },
      },
      {
        name: 'Send notification',
        type: TaskType.NOTIFICATION,
        order: 1,
        config: { notification: { channel: 'email', message: 'Data fetched', target: 'admin@example.com' } },
      },
    ],
  },
  'Transform pipeline': {
    description: 'Transforma datos, espera y notifica por Slack',
    tasks: [
      {
        name: 'Transform records',
        type: TaskType.DATA_TRANSFORM,
        order: 0,
        config: { data_transform: { operation: 'map', expression: 'x => x.id' } },
      },
      {
        name: 'Wait',
        type: TaskType.DELAY,
        order: 1,
        config: { delay: { milliseconds: 1500 } },
      },
      {
        name: 'Notify Slack',
        type: TaskType.NOTIFICATION,
        order: 2,
        config: { notification: { channel: 'slack', message: 'Pipeline done', target: '#alerts' } },
      },
    ],
  },
  'Full pipeline': {
    description: 'HTTP → Transform → Delay → Notify',
    tasks: [
      {
        name: 'Fetch users',
        type: TaskType.HTTP_REQUEST,
        order: 0,
        config: { http_request: { url: 'https://api.example.com/users', method: 'GET' } },
      },
      {
        name: 'Map IDs',
        type: TaskType.DATA_TRANSFORM,
        order: 1,
        config: { data_transform: { operation: 'map', expression: 'u => u.id' } },
      },
      {
        name: 'Wait 1s',
        type: TaskType.DELAY,
        order: 2,
        config: { delay: { milliseconds: 1000 } },
      },
      {
        name: 'Send report',
        type: TaskType.NOTIFICATION,
        order: 3,
        config: { notification: { channel: 'webhook', message: 'Done', target: 'https://hooks.example.com' } },
      },
    ],
  },
  'Ask Claude': {
    description: 'Llama a Claude AI y loguea la respuesta',
    tasks: [
      {
        name: 'Ask Claude',
        type: TaskType.CLAUDE_REQUEST,
        order: 0,
        config: { claude_request: { prompt: 'Resumí en una oración qué es un workflow de automatización.', model: 'claude-haiku-4-5-20251001', maxTokens: 256 } },
      },
    ],
  },
  'Claude + Email': {
    description: 'Claude genera contenido y lo manda por email',
    tasks: [
      {
        name: 'Generate content',
        type: TaskType.CLAUDE_REQUEST,
        order: 0,
        config: { claude_request: { prompt: 'Escribí un resumen ejecutivo de 3 líneas sobre automatización de procesos.', model: 'claude-haiku-4-5-20251001', maxTokens: 512 } },
      },
      {
        name: 'Send email',
        type: TaskType.SEND_EMAIL,
        order: 1,
        config: { send_email: { to: 'lautarosnm@gmail.com', subject: 'Reporte generado por Claude', body: 'Ver logs del workflow para el contenido generado.' } },
      },
    ],
  },
};

interface Props {
  onClose: () => void;
  onCreate: (data: CreateWorkflowInput) => Promise<void>;
}

export function CreateWorkflowModal({ onClose, onCreate }: Props) {
  // Estado del formulario — cada campo es un useState independiente
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('HTTP + Notify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    // Prevenimos el comportamiento default del form (recargar la página)
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        tasks: TEMPLATES[selectedTemplate].tasks,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating workflow');
    } finally {
      // finally corre siempre, tanto si hubo error como si no
      setLoading(false);
    }
  }

  return (
    // Backdrop: div que cubre toda la pantalla con fondo semitransparente
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Clic en el backdrop cierra el modal
    >
      {/* Contenedor del modal — stopPropagation evita cerrar al clicar adentro */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">New Workflow</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My workflow"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            {/* Campo: descripción (opcional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Selector de template */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
              <div className="space-y-2">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTemplate === key
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={key}
                      checked={selectedTemplate === key}
                      onChange={() => setSelectedTemplate(key)}
                      className="mt-0.5 accent-slate-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{key}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{tpl.tasks.length} tasks</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mensaje de error si falló la creación */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Workflow'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
