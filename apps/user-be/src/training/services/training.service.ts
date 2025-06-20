import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassicalService } from './classical_training.service';
import { DatasetService } from 'src/dataset/services/dataset.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrainingTypeDto } from '../dto/training-type.dto';
import { ReportService } from './report.service';

@Injectable()
export class TrainingService {
    constructor(
        private prisma: PrismaService,
        private classicalService: ClassicalService,
        private datasetService: DatasetService,
        private reportService: ReportService
    ){}

    async setTrainingType(id: string, dto: TrainingTypeDto) {
        const dataset = await this.prisma.dataset.update({
            where: {id},
            data: {
                trainingType: dto.trainingType
            }
        });
        if (!dataset) {
            throw new NotFoundException("Dataset not found");
        }
        const message = `Training type selected ${dataset.trainingType} for dataset id ${dataset.id}`

        return {dataset, message}
    }

    async startClassicalTrainingService(id: string){
    // Start Classical Training
    return await this.classicalService.startClassicalTraining(id);
    }

    async startReportGeneration(id: string) {
        // start report generation
        return await this.reportService.startReportGeneration(id);
    }
    
}
