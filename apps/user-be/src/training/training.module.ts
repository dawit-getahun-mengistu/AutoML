import { Module } from '@nestjs/common';
import { TrainingService } from './services/training.service';
import { TrainingController } from './training.controller';
import { ClassicalTrainingConsumerService } from './services/classical-training-comsumer.service';
import { ClassicalService } from './services/classical_training.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RmqModule } from 'src/rmq/rmq.module';
import { Queues } from 'src/rmq/queues';
import { DatasetService } from 'src/dataset/services/dataset.service';
import { DmsService } from 'src/dms/dms.service';
import { ProfilingService } from 'src/dataset/services/profiling.service';
import { EngineeringService } from 'src/dataset/services/feature_engineering.service';
import { FeatureSelectionService } from 'src/dataset/services/feature_selection.service';
import { ReportGenerationConsumerService } from './services/report-consumer.service';
import { ReportService } from './services/report.service';

@Module({
  imports: [PrismaModule, RmqModule, Queues],
  providers: [TrainingService, ClassicalTrainingConsumerService, ReportGenerationConsumerService, ClassicalService, ReportService, DatasetService, DmsService, ProfilingService, EngineeringService, FeatureSelectionService],
  controllers: [TrainingController],
  exports: [TrainingService]
})
export class TrainingModule {}
