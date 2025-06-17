import { ApiProperty } from "@nestjs/swagger";
import { TrainingType } from "@prisma/client";
import { IsEnum } from "class-validator";


export class TrainingTypeDto {
    @ApiProperty({enum: TrainingType, description: 'The Selected Training Type (Classical / Nas', example: TrainingType.CLASSICAL})
    @IsEnum(TrainingType)
    trainingType: TrainingType;
}