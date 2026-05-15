import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
