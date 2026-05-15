// types/index.ts
//
// Estos tipos son el "contrato" entre el frontend y el backend.
// Son un espejo de los tipos del backend (common/types/index.ts).
//
// En un proyecto real con monorepo podrías compartirlos directamente,
// pero acá los definimos dos veces para mantener el frontend y backend
// como proyectos independientes.
//
// TypeScript usa estos tipos para avisarte si estás usando mal un dato:
// por ejemplo, si intentás usar workflow.status === 'active' va a dar error
// porque 'active' no existe en WorkflowStatus.

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskType {
  HTTP_REQUEST = 'http_request',
  DATA_TRANSFORM = 'data_transform',
  NOTIFICATION = 'notification',
  DELAY = 'delay',
  CLAUDE_REQUEST = 'claude_request',
  SEND_EMAIL = 'send_email',
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Modelo de Log: cada mensaje que genera una tarea durante su ejecución
export interface Log {
  id: string;
  level: LogLevel;
  message: string;
  metadata?: string;
  createdAt: string;
  taskId: string;
}

// Modelo de Task: una tarea dentro de un workflow
export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  order: number;
  config: string;       // JSON serializado — el backend lo guarda como string
  result?: string;
  error?: string;
  startedAt?: string;   // ISO 8601 — se convierte a Date cuando hace falta
  finishedAt?: string;
  createdAt: string;
  workflowId: string;
  logs?: Log[];
}

// Modelo de Workflow: el flujo de trabajo completo con sus tareas
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

// Tipos para crear un workflow (lo que enviamos en POST /workflows)
export interface CreateTaskInput {
  name: string;
  type: TaskType;
  order: number;
  config: Record<string, unknown>;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  tasks: CreateTaskInput[];
}

// Tipos de los eventos que llegan por WebSocket desde el backend
export interface WorkflowUpdateEvent {
  workflowId: string;
  status: WorkflowStatus;
}

export interface TaskUpdateEvent {
  taskId: string;
  status: TaskStatus;
}

export interface TaskLogEvent {
  taskId: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}
