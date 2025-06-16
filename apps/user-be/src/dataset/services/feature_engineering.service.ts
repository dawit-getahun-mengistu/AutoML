import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { tryParseJson } from "constants/parsing";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";
import { Queues } from "src/rmq/queues";


@Injectable()
export class EngineeringService {
    private readonly logger = new Logger(EngineeringService.name);
    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private dataManagementService: DmsService
    ) {}

    // start feature engineering 
    async startFeatureEngineering(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: { id },
            include: { project: true }
        });
        
        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }
    
        // Check if the dataset has not been profiled yet.
        // The dataset profile must be complete for the feature engineering to start
        if (dataset.profilingStatus != ProcessStatus.COMPLETED) {
            throw new BadRequestException(`Dataset with ID ${id} must be profiled for the feature engineering to start.`)
        }
        if (dataset.featureEngineeringStatus === ProcessStatus.IN_PROGRESS) {
            throw new BadRequestException(`Feature Engineering is already in progress for Dataset with ID ${id}`)
        }
        // if (dataset.featureEngineeringStatus === ProcessStatus.COMPLETED){
        //     throw new BadRequestException(`Feature Engineering can't be started again because it has already been completed for Dataset with ID ${id}`)
        // }
        // define the engineering payload
            // dataset_id: dataset.id
            // dataset_key: dataset.file (the object name/key),
            // task_type : regression or classification, 
            // target_column: name of the target column, 
            // json_str: profiling report
        const engineering_payload = {
            dataset_id: dataset.id,
            dataset_key: dataset.file,
            task_type: dataset.project.taskType.toLowerCase(),
            target_column: dataset.targetColumnName,
            json_str: dataset.profiling_metadata 
        }


        // Send a message to a message queue to start engineering
        await this.producerService.sendToQueue(
            Queues.DATA_ENGINEERING_REQUEST_QUEUE,
            engineering_payload,
        );

        // Update dataset status
        await this.prisma.dataset.update({
            where: {id},
            data: {
                status: DatasetStatus.PROCESSING, 
                featureEngineeringStatus: ProcessStatus.IN_PROGRESS, featureEngineeringError: ""
            }
        });

        return {message: `Feature Engineering started for dataset with ID ${id}`};
    }

    private parseEngineeringPayload(report: any): {
        id: string;
        datasetAfterFeatureEngineering: string;
        featureEngineeringCode: string;
        featureTransformationCode: string;
        featureEngineeringReportHtml: string;
        engineeringMetadata: any;
    } {
        // Payload Recieved includes
            // dataset_id: id
            // data_key: the updated dataset after feature engineering
            // feature_engineering_code_key: code to be saved
            // feature_transformation_code_key: code to be saved
            // summary_key: summary html report generated file
            // learned_parameters: json report of the feature engineering service
            // 
        const payload = tryParseJson(report) as any;

        if (!payload || !payload.dataset_id) {
            throw new Error("Invalid payload: Missing dataset_id");
        }

        return {
            id: payload.dataset_id,
            datasetAfterFeatureEngineering: payload.data_key,
            featureEngineeringCode: payload.feature_engineering_code_key,
            featureTransformationCode: payload.feature_transformation_code_key,
            featureEngineeringReportHtml: payload.summary_key,
            engineeringMetadata: payload.learned_parameters,
        };
    }

    // process engineering result
    async processEngineeringResult(report: any) {
        // Parse and validate the payload
        const {
            id,
            datasetAfterFeatureEngineering,
            featureEngineeringCode,
            featureTransformationCode,
            featureEngineeringReportHtml,
            engineeringMetadata,
        } = this.parseEngineeringPayload(report);

        try {

            // Update the dataset
            await this.prisma.dataset.update({
            where: { id },
            data: {
                feature_engineering_metadata: engineeringMetadata,
                featureEngineeringCode: featureEngineeringCode,
                featureTransformationCode: featureTransformationCode,
                featureEngineeringVizFile: featureEngineeringReportHtml,
                afterFeatureEngineeringFile: datasetAfterFeatureEngineering,
                featureEngineeringStatus: ProcessStatus.COMPLETED
            },
            });

            return { message: "Feature Engineering Success!" };
        } catch (err) {
            // Handle errors and update the dataset status
            if (id) {
                await this.prisma.dataset.update({
                    where: { id },
                    data: {
                        featureEngineeringStatus: ProcessStatus.FAILED,
                        featureEngineeringError: err.message,
                    },
                });
            }

            throw new Error(`Feature Engineering failed: ${err.message}`);
        }
    }

    // get feature engineering data
    async getFeatureEngineeringData(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                feature_engineering_metadata: true,
                featureEngineeringStatus: true,
                featureEngineeringError: true,
            }
        })

        if (!dataset){
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        return dataset;
    }

    // poll engineering status
    async pollEngineeringStatus(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                featureEngineeringStatus: true,
                featureEngineeringError: true,
                afterFeatureEngineeringFile: true, // include dataset after feature engineering
                featureEngineeringVizFile: true, // include Viz HTML file
            }
        })

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        // get the URLs 
        if (dataset.featureEngineeringVizFile && dataset.afterFeatureEngineeringFile) {
            const vizUrl = await this.dataManagementService.getFileUrl(dataset.featureEngineeringVizFile);
            const fileUrl = await this.dataManagementService.getFileUrl(dataset.afterFeatureEngineeringFile)

            return {...dataset, afterFeatureEngineeringFile: fileUrl,featureEngineeringVizFile: vizUrl}
        }
        
        return dataset;

    }


}