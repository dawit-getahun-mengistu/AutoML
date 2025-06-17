import { Injectable } from '@nestjs/common';
import { ClassicalService } from './classical_training.service';
import { DatasetService } from 'src/dataset/services/dataset.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrainingTypeDto } from '../dto/training-type.dto';

@Injectable()
export class TrainingService {
    constructor(
        private prisma: PrismaService,
        private classicalService: ClassicalService,
        private datasetService: DatasetService
    ){}

    async setTrainingType(id: string, dto: TrainingTypeDto) {
        const dataset = await this.prisma.dataset.update({
            where: {id},
            data: {
                trainingType: dto.trainingType
            }
        });
        const message = `Training type selected ${dataset.trainingType} for dataset id ${dataset.id}`

        return {dataset, message}
    }

    async startClassicalTrainingService(id: string){
    // Start Classical Training
    return await this.classicalService.startClassicalTraining(id);
  }
    
}
