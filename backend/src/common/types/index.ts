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

export interface TaskConfig {
  http_request?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
  };
  data_transform?: {
    operation: 'map' | 'filter' | 'reduce';
    expression: string;
  };
  notification?: {
    channel: 'email' | 'slack' | 'webhook';
    message: string;
    target: string;
  };
  delay?: {
    milliseconds: number;
  };
  claude_request?: {
    prompt: string;
    model?: string;
    maxTokens?: number;
  };
  send_email?: {
    to: string;
    subject: string;
    body: string;
  };
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

export interface WsEvent<T = unknown> {
  event: string;
  data: T;
}
