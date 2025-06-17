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

    @Post(':id/set-training-type')
    async setTrainingType(
        @Param('id') id: string,
        @Body() trainingTypeDto: TrainingTypeDto
    ){
        return this.trainingService.setTrainingType(id, trainingTypeDto);
    }

    // CLASSICAL TRAINING
    @Patch(':id/start-classical-training')
    async startClassicalTrainingService(@Param('id') id: string) {
        return this.trainingService.startClassicalTrainingService(id);
    }

    @Get(':id/classical-training-results')
    async getClassicalTrainingResults(@Param('id') id: string) {
       return this.classicalService.pollClassicalTrainingStatus(id); 
    }

}
