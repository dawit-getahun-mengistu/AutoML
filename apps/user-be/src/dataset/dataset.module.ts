import { Module } from '@nestjs/common';
import { DatasetService } from './services/dataset.service';
import { DatasetController } from './controllers/dataset.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeaweedModule } from 'SeaweedClient';
import { DataProfilingConsumerService } from './services/data-profiling-consumer.service';
import { RmqModule } from 'src/rmq/rmq.module';
import { ProfilingService } from './services/profiling.service';
import { FileService } from './services/file.service';
import { DmsService } from 'src/dms/dms.service';
import { EngineeringService } from './services/feature_engineering.service';
import { Queues } from 'src/rmq/queues';
import { FeatureEngineeringConsumerService } from './services/feature-engineering-consumer.service';
import { FeatureSelectionConsumerService } from './services/feature-selection-consumer.service';
import { FeatureSelectionService } from './services/feature_selection.service';


@Module({
  imports: [PrismaModule, SeaweedModule.forRootAsync(), RmqModule, Queues,],
  controllers: [DatasetController],
  providers: [DatasetService, DataProfilingConsumerService, FeatureEngineeringConsumerService, FeatureSelectionConsumerService, ProfilingService, EngineeringService, FeatureSelectionService,FileService, DmsService],
  exports: [DatasetService, ProfilingService, FileService],
})
export class DatasetModule {}

