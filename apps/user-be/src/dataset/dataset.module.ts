import { Module } from '@nestjs/common';
import { DatasetService } from './services/dataset.service';
import { DatasetController } from './controllers/dataset.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeaweedModule } from 'SeaweedClient';
import { DataProfilingConsumerService } from './services/data-profiling-consumer.service';


@Module({
  imports: [PrismaModule, SeaweedModule.forRootAsync()],
  controllers: [DatasetController],
  providers: [DatasetService, DataProfilingConsumerService],
})
export class DatasetModule {}

