import { Module } from '@nestjs/common';
import { DatasetService } from './dataset.service';
import { DatasetController } from './dataset.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeaweedModule } from 'SeaweedClient';


@Module({
  imports: [PrismaModule, SeaweedModule.forRootAsync()],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class DatasetModule {}

