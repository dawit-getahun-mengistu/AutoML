import { Module } from '@nestjs/common';
import { DatasetService } from './services/dataset.service';
import { DatasetController } from './controllers/dataset.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeaweedModule } from 'SeaweedClient';
import { DataProfilingConsumerService } from './services/data-profiling-consumer.service';
import { RmqModule } from 'src/rmq/rmq.module';
import { ProfilingService } from './services/profiling.service';
import { FileService } from './services/file.service';


@Module({
  imports: [PrismaModule, SeaweedModule.forRootAsync(), RmqModule],
  controllers: [DatasetController],
  providers: [DatasetService, DataProfilingConsumerService, ProfilingService, FileService],
  exports: [DatasetService, ProfilingService, FileService],
})
export class DatasetModule {}

