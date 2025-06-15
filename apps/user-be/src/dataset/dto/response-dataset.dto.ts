import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatasetStatus, DatasetFormat, ProcessStatus, TrainingType } from '@prisma/client';

export class ResponseDatasetDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Unique identifier for the dataset' })
  id: string;

  @ApiProperty({ example: 'Customer Data', description: 'Name of the dataset' })
  name: string;

  @ApiPropertyOptional({ example: 'Dataset containing customer details', description: 'Optional description of the dataset' })
  description?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the associated project' })
  projectId: string;

  @ApiProperty({ enum: DatasetStatus, example: DatasetStatus.READY, description: 'Current status of the dataset' })
  status: DatasetStatus;

  @ApiProperty({ example: 'dataset-file.csv', description: 'Name of the file associated with the dataset' })
  file: string;

  @ApiProperty({ enum: DatasetFormat, example: DatasetFormat.CSV, description: 'Format of the dataset file' })
  format: DatasetFormat;

  @ApiPropertyOptional({ example: 1024, description: 'Size of the dataset file in bytes' })
  size?: number;

  @ApiPropertyOptional({ example: 100, description: 'Number of rows in the dataset' })
  rows?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of columns in the dataset' })
  cols?: number;

  @ApiPropertyOptional({ example: 'target_column', description: 'Name of the target column in the dataset' })
  targetColumnName?: string;

  @ApiPropertyOptional({ example: '{}', description: 'Profiling context in JSON format' })
  profiling_context?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Feature selection context in JSON format' })
  feature_selection_context?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Feature engineering context in JSON format' })
  feature_engineering_context?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Training context in JSON format' })
  training_context?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Profiling metadata in JSON format' })
  profiling_metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Feature selection metadata in JSON format' })
  feature_selection_metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Feature engineering metadata in JSON format' })
  feature_engineering_metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '{}', description: 'Training metadata in JSON format' })
  training_metadata?: Record<string, any>;

  @ApiProperty({ enum: ProcessStatus, example: ProcessStatus.COMPLETED, description: 'Status of the profiling process' })
  profilingStatus: ProcessStatus;

  @ApiProperty({ enum: ProcessStatus, example: ProcessStatus.NOT_STARTED, description: 'Status of the feature selection process' })
  featureSelectionStatus: ProcessStatus;

  @ApiProperty({ enum: ProcessStatus, example: ProcessStatus.NOT_STARTED, description: 'Status of the feature engineering process' })
  featureEngineeringStatus: ProcessStatus;

  @ApiProperty({ enum: ProcessStatus, example: ProcessStatus.NOT_STARTED, description: 'Status of the training process' })
  trainingStatus: ProcessStatus;

  @ApiPropertyOptional({ example: '', description: 'Error message from profiling process' })
  profilingError?: string;

  @ApiPropertyOptional({ example: '', description: 'Error message from feature selection process' })
  featureSelectionError?: string;

  @ApiPropertyOptional({ example: '', description: 'Error message from feature engineering process' })
  featureEngineeringError?: string;

  @ApiPropertyOptional({ example: '', description: 'Error message from training process' })
  trainingError?: string;

  @ApiPropertyOptional({ example: '', description: 'Error message from LLM process' })
  llmError?: string;

  @ApiPropertyOptional({ example: 'eda-file.html', description: 'File generated after EDA' })
  EDAFileViz?: string;

  @ApiPropertyOptional({ example: 'features-viz.html', description: 'File generated after feature selection' })
  FeaturesVizFile?: string;

  @ApiPropertyOptional({ example: 'feature-engineering-viz.html', description: 'File generated after feature engineering' })
  featureEngineeringVizFile?: string;

  @ApiPropertyOptional({ example: 'training-viz.html', description: 'File generated after training' })
  trainingVizFile?: string;

  @ApiPropertyOptional({ example: 'profiling-file.csv', description: 'File generated after profiling' })
  afterProfilingFile?: string;

  @ApiPropertyOptional({ example: 'feature-selection-file.csv', description: 'File generated after feature selection' })
  afterFeatureSelectionFile?: string;

  @ApiPropertyOptional({ example: 'feature-engineering-file.csv', description: 'File generated after feature engineering' })
  afterFeatureEngineeringFile?: string;

  @ApiPropertyOptional({ example: 'training-file.csv', description: 'File generated after training' })
  afterTrainingFile?: string;

  @ApiPropertyOptional({ enum: TrainingType, example: TrainingType.CLASSICAL, description: 'Type of training performed' })
  trainingType?: TrainingType;

  @ApiProperty({ example: '2025-06-15T12:00:00Z', description: 'Timestamp when the dataset was created' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2025-06-16T12:00:00Z', description: 'Timestamp when the dataset was last updated' })
  updatedAt?: Date;
}