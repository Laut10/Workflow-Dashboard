import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LogLevel, TaskStatus, WorkflowStatus } from '../common/types';

@WebSocketGateway({ cors: { origin: '*' } })
export class WorkflowsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe_workflow')
  handleSubscribe(@MessageBody() workflowId: string) {
    return { event: 'subscribed', data: workflowId };
  }

  emitWorkflowUpdate(workflowId: string, status: WorkflowStatus) {
    this.server.emit('workflow:update', { workflowId, status });
  }

  emitTaskUpdate(taskId: string, status: TaskStatus) {
    this.server.emit('task:update', { taskId, status });
  }

  emitLog(taskId: string, level: LogLevel, message: string) {
    this.server.emit('task:log', { taskId, level, message, timestamp: new Date().toISOString() });
  }
}
