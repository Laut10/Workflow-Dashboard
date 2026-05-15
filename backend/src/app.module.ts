import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule, WorkflowsModule],
})
export class AppModule {}
