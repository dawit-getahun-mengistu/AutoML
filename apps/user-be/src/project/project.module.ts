import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AtStrategy } from 'src/auth/strategies';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, AtStrategy],
})
export class ProjectModule {}
