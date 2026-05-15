import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowStatus } from '../common/types';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        tasks: {
          create: dto.tasks.map((task) => ({
            name: task.name,
            type: task.type,
            order: task.order,
            config: JSON.stringify(task.config),
          })),
        },
      },
      include: { tasks: true },
    });
  }

  async findAll() {
    return this.prisma.workflow.findMany({
      include: {
        tasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: { logs: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });

    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`);
    return workflow;
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.workflow.delete({ where: { id } });
  }

  async updateStatus(id: string, status: WorkflowStatus) {
    return this.prisma.workflow.update({
      where: { id },
      data: { status },
    });
  }
}
