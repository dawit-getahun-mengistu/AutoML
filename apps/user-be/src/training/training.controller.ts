import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TrainingService } from './services/training.service';
import { ClassicalService } from './services/classical_training.service';
import { TrainingTypeDto } from './dto/training-type.dto';

@Controller('training')
export class TrainingController {
    /**
     * Controller for choosing training type, starting and managing training processes.
     */

    constructor(
        private readonly trainingService: TrainingService,
        private readonly classicalService: ClassicalService

    ){}

    @Post(':datasetId/set-training-type')
    async setTrainingType(
        @Param('datasetId') datasetId: string,
        @Body() trainingTypeDto: TrainingTypeDto
    ){
        return this.trainingService.setTrainingType(datasetId, trainingTypeDto);
    }

    // CLASSICAL TRAINING
    @Patch(':datasetId/start-classical-training')
    async startClassicalTrainingService(@Param('datasetId') datasetId: string) {
        return this.trainingService.startClassicalTrainingService(datasetId);
    }

    @Get(':datasetId/classical-training-results')
    async getClassicalTrainingResults(@Param('datasetId') datasetId: string) {
       return this.classicalService.pollClassicalTrainingStatus(datasetId); 
    }

}
