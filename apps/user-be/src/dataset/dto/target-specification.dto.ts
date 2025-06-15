import { TaskType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TargetSpecificationDto {
  @ApiProperty({
    description: "The type of task to perform (e.g., classification, regression, etc.)",
    enum: TaskType,
    example: TaskType.CLASSIFICATION,
  })
  @IsEnum(TaskType)
  @IsNotEmpty()
  taskType: TaskType;

  @ApiProperty({
    description: "The name of the column to be used as the target variable.",
    type: String,
    example: "target_column",
  })
  @IsString()
  @IsNotEmpty()
  targetColumnName: string;
}