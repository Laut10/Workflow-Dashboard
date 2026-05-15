import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { TasksService } from '../tasks/tasks.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Get()
  findAll() {
    return this.workflowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Post(':id/run')
  run(@Param('id') id: string) {
    return this.tasksService.executeWorkflow(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workflowsService.delete(id);
  }
}
