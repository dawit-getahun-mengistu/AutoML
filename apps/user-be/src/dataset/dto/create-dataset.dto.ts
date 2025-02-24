import { DatasetFormat } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDatasetDto {
  @ApiProperty({ example: 'Customer Data', description: 'Name of the dataset' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Dataset containing customer details', description: 'Optional dataset description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the associated project' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ enum: DatasetFormat, description: 'Format of the dataset' })
  @IsEnum(DatasetFormat)
  format: DatasetFormat;
}
