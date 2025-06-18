import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TrainingService } from './services/training.service';
import { ClassicalService } from './services/classical_training.service';
import { TrainingTypeDto } from './dto/training-type.dto';
import { ReportService } from './services/report.service';

@Controller('training')
export class TrainingController {
    /**
     * Controller for choosing training type, starting and managing training processes.
     */

    constructor(
        private readonly trainingService: TrainingService,
        private readonly classicalService: ClassicalService,
        private readonly reportService: ReportService

    ){}

    @Post(':datasetId/set-training-type')
    async setTrainingType(
        @Param('datasetId') datasetId: string,
        @Body() trainingTypeDto: TrainingTypeDto
    ){
        return await this.trainingService.setTrainingType(datasetId, trainingTypeDto);
    }

    // CLASSICAL TRAINING
    @Patch(':datasetId/start-classical-training')
    async startClassicalTrainingService(@Param('datasetId') datasetId: string) {
        return await this.trainingService.startClassicalTrainingService(datasetId);
    }

    @Get(':datasetId/classical-training-results')
    async getClassicalTrainingResults(@Param('datasetId') datasetId: string) {
       return await this.classicalService.pollClassicalTrainingStatus(datasetId); 
    }

    // REPORT GENERATION
    @Patch(':datasetId/start-report-generation')
    async startReportGernerationService(@Param('datasetId') datasetId: string) {
        return await this.trainingService.startReportGeneration(datasetId);
    }

    @Get(':datasetId/report-generation')
    async getReportResults(@Param('datasetId') datasetId: string) {
        return await this.reportService.pollReportGenerationStatus(datasetId);

    }

}
