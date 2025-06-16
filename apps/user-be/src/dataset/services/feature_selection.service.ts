import { BadRequestException, Injectable, Logger, NotFoundException, Query } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { tryParseJson } from "constants/parsing";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";
import { Queues } from "src/rmq/queues";


@Injectable()
export class FeatureSelectionService{
    private readonly logger = new Logger(FeatureSelectionService.name);

    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private dataManagementService: DmsService
    ){}


    // start feature selection
    async startFeatureSelection(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            include: { project: true}
        });

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        // Check if feature engineering has been completed first
        if (dataset.featureEngineeringStatus != ProcessStatus.COMPLETED) {
            throw new BadRequestException(`Dataset with ID ${id} must complete feature engineering for the feature selection to start.`);
        }
        // if (dataset.featureSelectionStatus === ProcessStatus.IN_PROGRESS){
        //     throw new BadRequestException(`Feature Selection is already in progress for Dataset with ID ${id}`)
        // }
        // if (dataset.featureSelectionStatus === ProcessStatus.COMPLETED) {
        //     throw new BadRequestException(`Feature Selection can't be started again because it has already been completed for Dataset with ID ${id}`)
        // }

        // define the feature selection payload
        // dataset_id
        // dataset_key: the feature engineering output dataset (the object name/key)
        // target_column: name of the target column
        const selection_payload = {
            dataset_id: dataset.id,
            dataset_key: dataset.afterFeatureEngineeringFile,
            target_column: dataset.targetColumnName
        }

        // senf a message to a message queue to start feature selection
        await this.producerService.sendToQueue(
            Queues.DATA_SELECTION_REQUEST_QUEUE,
            selection_payload,
        );

        // Update dataset status
        await this.prisma.dataset.update({
            where: {id},
            data: {
                status: DatasetStatus.PROCESSING,
                featureSelectionStatus: ProcessStatus.IN_PROGRESS,
                featureSelectionError: "",
            }
        });

        return {message: `Feature Selection started for dataset with ID ${id}`};
    }

    // Parse payload
    private parseSelectionPayload(report: any): {
        id: string;
        selectedColumns: string[];
        feature_selection_context: {
            logs: any;
            figure_data: any;
        };
        datasetAfterFeatureSelection: string;
        featureSelectionReportHtml: string;
    }{
        // Payload Recieved includes
            // dataset_id: id
            // selected_features: List[strings]: selectedcolumns
            // logs: feature_selection_context
            // figure_data: feature_selection_context
            // transformed_data: the updated dataset after feature selection
            // summary: summary html report generated file
        const payload = tryParseJson(report) as any;

        if (!payload || !payload.dataset_id) {
            throw new Error("Invalid payload: Missing dataset_id");
        }

        return {
            id: payload.dataset_id,
            selectedColumns: payload.selected_features,
            feature_selection_context: {
                logs: payload.logs,
                figure_data: payload.figure_data
            },
            datasetAfterFeatureSelection: payload.transformed_data,
            featureSelectionReportHtml: payload.summary
        }

    }

    
    // process  feature selection result
    async processFeatureSelectionResult(report: any) {
        // Parse and validate the payload
        const {
            id,
            selectedColumns,
            feature_selection_context,
            datasetAfterFeatureSelection,
            featureSelectionReportHtml,
        } = this.parseSelectionPayload(report);
        try {

            // Update the dataset with feature selection results
            await this.prisma.dataset.update({
                where: { id },
                data: {
                    selectedColumns: selectedColumns,
                    afterFeatureSelectionFile: datasetAfterFeatureSelection,
                    FeaturesVizFile: featureSelectionReportHtml,
                    feature_selection_metadata: feature_selection_context  ,
                    featureSelectionStatus: ProcessStatus.COMPLETED                  
                },
            });

            this.logger.log(`Feature selection results processed successfully for dataset ID: ${id}`);
            return { message: "Feature selection results processed successfully." };
        } catch (err) {
            // Handle errors and update the dataset status
            if (id) {
                await this.prisma.dataset.update({
                    where: { id },
                    data: {
                        featureSelectionStatus: ProcessStatus.FAILED,
                        featureSelectionError: err.message, 
                    },
                });
            }

            this.logger.error(`Failed to process feature selection results: ${err.message}`);
            throw new Error(`Feature selection processing failed: ${err.message}`);
        } 
    }

    // get feature selection result
    async getFeatureSelectionData(id: string){
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                selectedColumns: true,
                feature_selection_metadata: true,
                featureSelectionStatus: true,
                featureSelectionError: true
            }
        })

        if (!dataset){
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        return dataset;
    }

    // poll selection status
    async pollSelectionStatus(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: {id},
            select: {
                featureSelectionStatus: true,
                featureSelectionError: true,
                afterFeatureSelectionFile: true, // include dataset after feature selection
                FeaturesVizFile: true, // include viz HTML file
            }
        });

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }

        // get the URLs
        if (dataset.afterFeatureSelectionFile && dataset.FeaturesVizFile){
            const vizUrl = await this.dataManagementService.getFileUrl(dataset.FeaturesVizFile);
            const fileUrl = await this.dataManagementService.getFileUrl(dataset.afterFeatureSelectionFile)

            return {...dataset, afterFeatureSelectionFile: fileUrl, FeaturesVizFile: vizUrl}
        }

        return dataset;
    }

}