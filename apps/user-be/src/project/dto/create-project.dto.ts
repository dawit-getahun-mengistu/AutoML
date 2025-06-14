import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project', example: 'AI Research Project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Optional project description', example: 'A project on deep learning models' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Status of the project', enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiProperty({ description: 'UUID of the user associated with the project', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;
}
