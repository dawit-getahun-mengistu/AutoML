import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus, TaskType, TrainingType } from "@prisma/client";
import { tryParseJson } from "constants/parsing";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";
import { Queues } from "src/rmq/queues";

interface MetricValue {
  metric: string;
  value: string;
}

interface BestModelInfo {
  model_name: string;
  model_uuid: string;
  test_set_performance: MetricValue[];
  best_hyperparameters: MetricValue[];
}

interface TransformedReport {
  dataset_id: string;
  best_model_info: BestModelInfo;
  all_models_performance: any;
}

@Injectable()
export class ClassicalService{
    private readonly logger = new Logger(ClassicalService.name);

    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private dataManagementService: DmsService
    ){}

    // start classical training
    async startClassicalTraining(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        // Check if the dataset is at a valid stage for training to begin.
        // The training type must be CLASSICAL
        if (dataset.trainingType != TrainingType.CLASSICAL){
            throw new BadRequestException(`Please set the training type to CLASSICAL to proceed with classical training.`)
        }
        // The dataset profiling, feature engineering and selection must be complete for the training to start
        if (dataset.profilingStatus != ProcessStatus.COMPLETED || dataset.featureEngineeringStatus != ProcessStatus.COMPLETED || dataset.featureSelectionStatus != ProcessStatus.COMPLETED) {
            throw new BadRequestException(`Dataset with ID ${id} must complete profiling, feature engineering, and feature selection to start training.`)
        }
        if (dataset.trainingStatus === ProcessStatus.IN_PROGRESS) {
            throw new BadRequestException(`Training is already in progress for this dataset with ID ${id}`)
        }
        // TODO: other conditions where training must not start


        // define the classical training payload
        // dataset_id: dataset.id
        // dataset_key: the transformed dataset after feature engineering & selection
        // task_type: either regression or classification : convert to lowercase
        // target_column: the name of the target column
        const classical_training_payload = {
            dataset_id: dataset.id,
            dataset_key: dataset.afterFeatureSelectionFile,
            task_type: dataset.project.taskType.toLowerCase(),
            target_column: dataset.targetColumnName
        }

        // Send a message to message queue to start training
        await this.producerService.sendToQueue(
            Queues.CLASSICAL_TRAINING_REQUEST_QUEUE,
            classical_training_payload
        )

        // Update dataset status
        await this.prisma.dataset.update({
            where: {id},
            data: {
                status: DatasetStatus.READY,
                trainingStatus: ProcessStatus.IN_PROGRESS,
                trainingError: ""
            }
        })

        return {message: `Classical Training started for dataset with ID ${id}`};

    }

    // parse payload
    private parseClassicalPayload(report: any) : {
        transformed: TransformedReport,
        payload_best_model_info: any,
        payload_all_models_performance: any
    } {
        // Payload Recieved includes
        // dataset_id: id
        // best_model_info: json
        // all_models_performance: list of json
        const payload = tryParseJson(report) as any

        const toMetricArray = (obj: Record<string, any>): MetricValue[] =>
            Object.entries(obj).map(([metric, val]) => ({
            metric,
            value: String(val),
            }));

        if (!payload || !payload.dataset_id) {
            throw new Error("Invalid payload: Missing dataset_id");
        }

        const transformed: TransformedReport = {
            dataset_id: payload.dataset_id,
            best_model_info: {
            model_name: String(payload.best_model_info.model_name),
            model_uuid: String(payload.best_model_info.model_uuid),
            test_set_performance: toMetricArray(payload.best_model_info.test_set_performance),
            best_hyperparameters: toMetricArray(payload.best_model_info.best_hyperparameters),
            },
            all_models_performance: payload.all_models_performance,
        };

        return {
            transformed: transformed,
            payload_best_model_info: payload.best_model_info,
            payload_all_models_performance: payload.all_models_performance 
        }

    }

    // process classical training result
    async processClassicalTrainingResult(report: any){
        // Parse and validate the payload
        const {
            transformed,
            payload_best_model_info,
            payload_all_models_performance
        } = this.parseClassicalPayload(report);

        try {
            await this.prisma.$transaction(async (tx) => {
                // Update the dataset
                await tx.dataset.update({
                    where: { id: transformed.dataset_id },
                    data: {
                        trainingStatus: ProcessStatus.COMPLETED,
                        trainingError: ""
                    },
                });

                // Create a Model associated with dataset for the best performing model
                const dataset = await tx.dataset.findUnique({
                    where: { id: transformed.dataset_id },
                    include: { project: true },
                });

                await tx.model.create({
                    data: {
                        name: transformed.best_model_info.model_name,
                        description: `Classical model generated named: ${transformed.best_model_info.model_name} for a ${dataset.project.taskType}`,
                        projectId: dataset.projectId,

                        trainingType: TrainingType.CLASSICAL,
                        // model file
                        model: transformed.best_model_info.model_uuid,
                        // model performances:
                        modelPerformances: {
                            create: transformed.best_model_info.test_set_performance.map((metric) => ({
                                metricName: metric.metric,
                                metricValue: metric.value,
                            })),
                        },
                        // model hyper-parameters
                        modelHyperParameters: {
                            create: transformed.best_model_info.best_hyperparameters.map((hyperparameter) => ({
                                metricName: hyperparameter.metric,
                                metricValue: hyperparameter.value,
                            })),
                        },
                        // metadata
                        training_metadata: {
                            best_model_info: payload_best_model_info,
                            all_models_performance: payload_all_models_performance,
                        },
                    },
                });
            });

            this.logger.log(`Classical Training results processed successfully for dataset ID: ${transformed.dataset_id}`)
            return { message: "Classical Training results processed successfully"}

        } catch (err) {
            // Handle errors and update the dataset status
            if (transformed.dataset_id) {
                await this.prisma.dataset.update({
                    where: {id: transformed.dataset_id},
                    data: {
                        trainingStatus: ProcessStatus.FAILED,
                        trainingError: err.message
                    }
                })
            }
            throw new Error(`Classical Training Failed: ${err.message}`)
        }
    }

    // get classical training result
    async getClassicalTrainingData(id: string){
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                targetColumnName: true,
                trainingType: true,
                trainingError: true
            }
        });

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        return dataset;
    }

    // poll classical training status
    async pollClassicalTrainingStatus(id: string){
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                targetColumnName: true,
                projectId: true
            }
        })

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        const models = await this.prisma.model.findMany({
            where: {
                projectId: dataset.projectId,   
            },
            include: {
                modelHyperParameters: true,
                modelPerformances: true
            }
        })
        models.map(async (model)=>{
            if (model.model){
                const url = await this.dataManagementService.getFileUrl(model.model);
                model.model = url.url
            }
        })

        return {
            dataset,
            models
        };
    }
}