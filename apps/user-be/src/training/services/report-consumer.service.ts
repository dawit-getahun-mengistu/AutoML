import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { Queues } from "src/rmq/queues";
import { ReportService } from "./report.service";


@Injectable()
export class ReportGenerationConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(ReportGenerationConsumerService.name);
    private readonly queue = Queues.REPORT_GENERATION_RESULT_QUEUE

    constructor(private reportService: ReportService ){
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            this.logger.log("Initializing Report Generation Consumer")
                        await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                            await channel.assertQueue(this.queue, {durable: true});
                            await channel.consume(this.queue, async (msg) => {
                                if (msg){
                                    
                                    try {
                                        const payload = JSON.parse(msg.content.toString());
                                        this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);   
                            
                                        await this.reportService.processReportGenerationResult(payload);
                                        this.logger.log('Processed Report Generation result for the dataset ID');
                                    } catch (error) {
                                        this.logger.error(`Error processing Report Generation result: ${error.message}`, error.stack);
                                    } finally {
                                        channel.ack(msg); // Acknowledge the message
                                    }
                                }
                            });
                        });

        }catch (error) {
            this.logger.error('Error starting the Report Generation service consumer:', error);
        }
    }
}