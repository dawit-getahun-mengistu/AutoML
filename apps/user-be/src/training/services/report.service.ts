import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { tryParseJson } from "constants/parsing";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";
import { Queues } from "src/rmq/queues";

@Injectable()
export class ReportService{
    private readonly logger = new Logger(ReportService.name);

    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private dataManagementService: DmsService
    ) {}

    // start report generation
    async startReportGeneration(id: string) {
        const dataset = await this.prisma.dataset.findUnique({
            where: { id },
        });

        if (!dataset) {
            throw new NotFoundException(`Dataset with ID ${id} not found`);
        }
        //  Check if the project and dataset have models to start report generation
        const models = await this.prisma.model.findMany({
            where: {
                projectId: dataset.projectId 
            }
        })
        if (models.length == 0) {
            throw new BadRequestException(`Dataset with ID ${id} does not have any models to generate model report.`)
        }

        
        // define report generation payload
        // dataset_id: dataset.id
        // profiling_context
        // feature_engineering_context
        // feature_selection_context
        // model_training_context
        const report_generation_payload = {
            dataset_id: dataset.id,
            profiling_context: dataset.profiling_metadata ?? "",
            feature_engineering_context: dataset.feature_engineering_metadata ?? "",
            feature_selection_context: dataset.feature_selection_metadata ?? "",
            model_training_context: {
                models: models.map((model) => {
                    model.training_metadata
                })
            }
        }

        // Send a message queue to start report generation
        await this.producerService.sendToQueue(
            Queues.REPORT_GENERATION_REQUEST_QUEUE,
            report_generation_payload
        )

        // Update dataset status
        await this.prisma.dataset.update({
            where: { id },
            data: {
                status: DatasetStatus.READY,
                reportGenerationStatus: ProcessStatus.IN_PROGRESS,
                llmError: ""
            }
        });

        return {message: `Report Generation started for dataset with ID ${id}`};
    }

    // parse payload
    private parseReportPayload(report: any) : {
        id: string,
        error: string,
        html_key: string,
        pdf_key: string
    } {
        // Payload Recieved includes
        // dataset_id: id,
        // error: string,
        // html_key: file id,
        // pdf_key: file id
        const payload = tryParseJson(report) as any;

        if (!payload || !payload.dataset_id) {
            throw new Error("Invalid payload: Missing dataset_id");
        }

        return {
            id: payload.dataset_id,
            error: payload.error,
            html_key: payload.html_key,
            pdf_key: payload.pdf_key
        }
    }

    // process report generation result
    async processReportGenerationResult(report: any) {
        // Parse and validate the payload
        const {
            id,
            error,
            html_key,
            pdf_key
        } = this.parseReportPayload(report);

        try {

            if (error.trim().length > 0 ) {
                // Update the dataset with error
                await this.prisma.dataset.update({
                    where: {id},
                    data: {
                        reportGenerationStatus: ProcessStatus.FAILED,
                        llmError: error
                    }
                })

                return { message: "Report generation failed."}
            }
            else {
                await this.prisma.$transaction(async (tx) => {
                    // Update the dataset
                    await tx.dataset.update({
                        where: {id},
                        data: {
                            reportGenerationStatus: ProcessStatus.COMPLETED,
                            llmError: ""
                        }
                    });
                    // Create a Report
                    await tx.report.create({
                        data: {
                            datasetID: id,
                            reportHTML: html_key,
                            reportPDF: pdf_key
                        }
                    })

                    this.logger.log(`Report generation results processed successfully for dataset ID: ${id}`);
                    return { message: "Report generation results processed successfully."}
                })
                
            }
        } catch (err) {
            // Handle errors and update the dataset status
            if (id) {
                await this.prisma.dataset.update({
                    where: {id},
                    data: {
                        reportGenerationStatus: ProcessStatus.FAILED,
                        llmError: err.message
                    }
                })
            }
            throw new Error(`Report generation error: ${err.message}`)
        }
    }

    // get report generation result
    async getReportGenerationData(id: string) {}

    // poll report generation status
    async pollReportGenerationStatus(id: string) {}
}