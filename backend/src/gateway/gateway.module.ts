import { Module } from '@nestjs/common';
import { WorkflowsGateway } from './workflows.gateway';

@Module({
  providers: [WorkflowsGateway],
  exports: [WorkflowsGateway],
})
export class GatewayModule {}
