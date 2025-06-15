import { Injectable, Logger } from "@nestjs/common";
import { ProcessStatus } from "@prisma/client";
import { tryParseJson } from "constants/parsing";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";


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
            featureSelectionReportHtml: payload.symmary
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
                    // TODO: add selected columns to the schema
                    afterFeatureSelectionFile: datasetAfterFeatureSelection,
                    FeaturesVizFile: featureSelectionReportHtml,
                    feature_selection_metadata: feature_selection_context                    
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
    async getFeatureSelectionData(id: string){}

}