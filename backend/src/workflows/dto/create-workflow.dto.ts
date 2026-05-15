import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsInt, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType } from '../../common/types';
import type { TaskConfig } from '../../common/types';

export class CreateTaskDto {
  @IsString()
  name: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsInt()
  @Min(0)
  order: number;

  @IsObject()
  config: TaskConfig;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks: CreateTaskDto[];
}
