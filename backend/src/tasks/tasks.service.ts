import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowsGateway } from '../gateway/workflows.gateway';
import { TaskStatus, TaskType, WorkflowStatus, TaskConfig, TaskResult, LogLevel } from '../common/types';

function isTaskType(value: string): value is TaskType {
  return Object.values(TaskType).includes(value as TaskType);
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: WorkflowsGateway,
  ) {}

  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findUniqueOrThrow({
      where: { id: workflowId },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });

    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { status: WorkflowStatus.RUNNING },
    });

    this.gateway.emitWorkflowUpdate(workflowId, WorkflowStatus.RUNNING);

    let workflowFailed = false;

    for (const task of workflow.tasks) {
      if (workflowFailed) break;

      const config = JSON.parse(task.config) as TaskConfig;

      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.RUNNING, startedAt: new Date() },
      });

      this.gateway.emitTaskUpdate(task.id, TaskStatus.RUNNING);

      const result = await this.executeTask(task.id, task.type, config);

      if (result.success) {
        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.COMPLETED,
            finishedAt: new Date(),
            result: JSON.stringify(result.data),
          },
        });
        this.gateway.emitTaskUpdate(task.id, TaskStatus.COMPLETED);
      } else {
        workflowFailed = true;
        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.FAILED,
            finishedAt: new Date(),
            error: result.error,
          },
        });
        this.gateway.emitTaskUpdate(task.id, TaskStatus.FAILED);
      }
    }

    const finalStatus = workflowFailed ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED;
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { status: finalStatus },
    });

    this.gateway.emitWorkflowUpdate(workflowId, finalStatus);
  }

  private async executeTask(taskId: string, type: string, config: TaskConfig): Promise<TaskResult> {
    if (!isTaskType(type)) {
      return { success: false, error: `Unknown task type: ${type}` };
    }

    const start = Date.now();

    try {
      let data: unknown;

      switch (type) {
        case TaskType.HTTP_REQUEST:
          data = await this.runHttpRequest(taskId, config);
          break;
        case TaskType.DATA_TRANSFORM:
          data = await this.runDataTransform(taskId, config);
          break;
        case TaskType.NOTIFICATION:
          data = await this.runNotification(taskId, config);
          break;
        case TaskType.DELAY:
          data = await this.runDelay(taskId, config);
          break;
        case TaskType.CLAUDE_REQUEST:
          data = await this.runClaudeRequest(taskId, config);
          break;
        case TaskType.SEND_EMAIL:
          data = await this.runSendEmail(taskId, config);
          break;
      }

      return { success: true, data, duration: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.addLog(taskId, LogLevel.ERROR, `Task failed: ${message}`);
      return { success: false, error: message, duration: Date.now() - start };
    }
  }

  private async runHttpRequest(taskId: string, config: TaskConfig) {
    const cfg = config.http_request!;
    await this.addLog(taskId, LogLevel.INFO, `HTTP ${cfg.method} → ${cfg.url}`);

    // Simulated HTTP request (no real fetch to avoid external dependencies in dev)
    await this.sleep(500 + Math.random() * 500);

    if (Math.random() < 0.1) throw new Error('Simulated network error');

    const result = { status: 200, body: { ok: true, url: cfg.url, method: cfg.method } };
    await this.addLog(taskId, LogLevel.INFO, `Response: ${result.status}`);
    return result;
  }

  private async runDataTransform(taskId: string, config: TaskConfig) {
    const cfg = config.data_transform!;
    await this.addLog(taskId, LogLevel.INFO, `Transform: ${cfg.operation} — ${cfg.expression}`);
    await this.sleep(200);
    return { operation: cfg.operation, applied: true };
  }

  private async runNotification(taskId: string, config: TaskConfig) {
    const cfg = config.notification!;
    await this.addLog(taskId, LogLevel.INFO, `Sending ${cfg.channel} notification to ${cfg.target}`);
    await this.sleep(300);
    return { sent: true, channel: cfg.channel, target: cfg.target };
  }

  private async runDelay(taskId: string, config: TaskConfig) {
    const cfg = config.delay!;
    await this.addLog(taskId, LogLevel.INFO, `Waiting ${cfg.milliseconds}ms`);
    await this.sleep(cfg.milliseconds);
    return { waited: cfg.milliseconds };
  }

  private async addLog(taskId: string, level: LogLevel, message: string, metadata?: unknown) {
    await this.prisma.log.create({
      data: {
        taskId,
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
    this.gateway.emitLog(taskId, level, message);
  }

  private async runClaudeRequest(taskId: string, config: TaskConfig) {
    const cfg = config.claude_request!;
    const model = cfg.model ?? 'claude-haiku-4-5-20251001';
    await this.addLog(taskId, LogLevel.INFO, `Claude (${model}) ← ${cfg.prompt.slice(0, 80)}...`);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model,
      max_tokens: cfg.maxTokens ?? 512,
      messages: [{ role: 'user', content: cfg.prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    await this.addLog(taskId, LogLevel.INFO, `Claude → ${text.slice(0, 120)}...`);
    return { model, response: text, inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens };
  }

  private async runSendEmail(taskId: string, config: TaskConfig) {
    const cfg = config.send_email!;
    await this.addLog(taskId, LogLevel.INFO, `Sending email to ${cfg.to} — "${cfg.subject}"`);

    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
      await this.addLog(taskId, LogLevel.WARN, 'SMTP not configured — skipping real send (set EMAIL_USER and EMAIL_PASS in .env)');
      return { sent: false, reason: 'SMTP not configured', to: cfg.to };
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST ?? 'smtp.gmail.com',
      port: Number(EMAIL_PORT ?? 587),
      secure: false,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transporter.sendMail({
      from: EMAIL_FROM ?? EMAIL_USER,
      to: cfg.to,
      subject: cfg.subject,
      text: cfg.body,
    });

    await this.addLog(taskId, LogLevel.INFO, `Email sent to ${cfg.to}`);
    return { sent: true, to: cfg.to, subject: cfg.subject };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
