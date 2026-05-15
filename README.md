# Workflow Automation Dashboard

Panel interno de automatización de tareas con ejecución en tiempo real vía WebSockets.

Proyecto construido para aprender arquitectura full-stack con TypeScript estricto.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 + TypeScript |
| Base de datos | Prisma 7 + SQLite |
| WebSockets | Socket.IO |
| Validación | class-validator + class-transformer |
| Frontend | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS 4 (sin librerías de componentes) |
| Emails | Nodemailer (SMTP) |
| IA | Anthropic SDK (Claude) |

---

## Arquitectura

```
workflow-dashboard/
├── backend/                    NestJS API
│   ├── src/
│   │   ├── common/types/       Enums e interfaces compartidos
│   │   ├── prisma/             PrismaService (singleton de DB)
│   │   ├── workflows/          CRUD de workflows (controller + service + DTO)
│   │   ├── tasks/              Motor de ejecución de tareas
│   │   ├── gateway/            WebSocket gateway (Socket.IO)
│   │   └── main.ts             Bootstrap: ValidationPipe + CORS
│   └── prisma/
│       └── schema.prisma       Modelos: Workflow → Task → Log
│
└── frontend/                   Next.js App Router
    ├── app/
    │   ├── layout.tsx          Root layout (ToastProvider)
    │   ├── page.tsx            Dashboard: lista de workflows
    │   └── workflows/[id]/     Página de detalle con logs en tiempo real
    ├── components/
    │   ├── WorkflowCard        Tarjeta con barra de progreso
    │   ├── TaskItem            Item de tarea con color por estado
    │   ├── LogStream           Terminal de logs con auto-scroll
    │   ├── StatusBadge         Badge animado (dot pulsa en running)
    │   ├── CreateWorkflowModal Modal con templates predefinidos
    │   └── Toaster             Notificaciones toast
    ├── context/
    │   └── ToastContext        Context global para toasts
    ├── hooks/
    │   └── useWorkflowSocket   Custom hook para eventos WebSocket
    └── lib/
        ├── api.ts              Cliente REST tipado
        └── socket.ts           Singleton Socket.IO
```

---

## Cómo correrlo

### Requisitos
- Node.js 18+
- npm

### Backend (puerto 3000)

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (puerto 3001)

```bash
cd frontend
npm install
npm run dev
```

Abrí `http://localhost:3001`.

---

## Variables de entorno

El archivo `backend/.env` ya existe con valores por defecto para desarrollo local.

```env
# Base de datos SQLite — no necesita configuración
DATABASE_URL="file:./dev.db"

# Claude AI — necesario para el task type "Claude AI"
# Conseguí tu key en console.anthropic.com
ANTHROPIC_API_KEY=""

# Email real — necesario para el task type "Send Email"
# Gmail: activá 2FA → App Passwords → generá una contraseña de app
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM=""
```

Si no configurás `ANTHROPIC_API_KEY`, el task type Claude AI va a fallar con un error de autenticación.

Si no configurás las credenciales de email, el task type Send Email loguea un warning y sigue adelante sin enviar.

---

## Modelo de datos

```
Workflow
  id, name, description, status, createdAt, updatedAt
  └── Task[]
        id, name, type, status, order, config (JSON), result, error, startedAt, finishedAt
        └── Log[]
              id, level (info/warn/error), message, metadata, createdAt
```

---

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/workflows` | Lista todos los workflows con tareas |
| GET | `/workflows/:id` | Detalle con tareas y logs |
| POST | `/workflows` | Crear workflow |
| POST | `/workflows/:id/run` | Ejecutar workflow |
| DELETE | `/workflows/:id` | Borrar workflow (cascade) |

---

## WebSocket — eventos en tiempo real

El backend emite via Socket.IO mientras ejecuta un workflow:

| Evento | Payload | Cuándo |
|---|---|---|
| `workflow:update` | `{ workflowId, status }` | Al cambiar el estado del workflow |
| `task:update` | `{ taskId, status }` | Al cambiar el estado de una tarea |
| `task:log` | `{ taskId, level, message, timestamp }` | Cada log generado |

El frontend escucha estos eventos en `useWorkflowSocket` y actualiza el estado de React sin hacer re-fetch.

---

## Tipos de tarea

| Tipo | Descripción | Config necesaria |
|---|---|---|
| `http_request` | Simula un HTTP request | `url`, `method` |
| `data_transform` | Simula una transformación de datos | `operation`, `expression` |
| `notification` | Simula una notificación (email/slack/webhook) | `channel`, `message`, `target` |
| `delay` | Espera N milisegundos reales | `milliseconds` |
| `claude_request` | Llama a la API de Claude AI | `prompt`, `model?`, `maxTokens?` |
| `send_email` | Envía un email real por SMTP | `to`, `subject`, `body` |

---

## Estados del sistema

```
pending → running → completed
                 └→ failed (detiene el workflow, las tareas siguientes no se ejecutan)
```

---

## Conceptos de TypeScript que usa el proyecto

- **Enums** — `WorkflowStatus`, `TaskStatus`, `TaskType`, `LogLevel`
- **Interfaces** — `TaskConfig`, `TaskResult`, `WsEvent<T>`
- **Generics** — `WsEvent<T>`, `request<T>()` en el cliente API
- **Type Guards** — `isTaskType()` en el motor de ejecución
- **DTOs con class-validator** — `CreateWorkflowDto`, `CreateTaskDto`
- **Prisma types** — generados desde el schema, usados en los servicios
- **Record<K, V>** — mapeos de estado a estilos en componentes

---

## Conceptos de React que usa el proyecto

- **useState** — estado local de componentes
- **useEffect** — fetch al montar, listeners de WebSocket con cleanup
- **useCallback** — funciones memorizadas como dependencias de useEffect
- **useRef** — scroll automático en LogStream sin causar re-renders
- **Context API** — ToastContext: estado global sin prop drilling
- **Custom Hooks** — `useWorkflowSocket`, `useToast`
- **App Router** — layouts, rutas dinámicas `[id]`, `'use client'`
