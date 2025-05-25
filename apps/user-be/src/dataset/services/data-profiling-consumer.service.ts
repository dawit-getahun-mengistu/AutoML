import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { DatasetService } from './dataset.service';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class DataProfilingConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(DataProfilingConsumerService.name);
    private readonly queue = process.env.DATA_PROFILING_RESULT_QUEUE || 'DATA_PROFILING_RESULT_QUEUE';

    constructor(private datasetService: DatasetService) {
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://localhost']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                await channel.assertQueue(this.queue, {durable: true});
                await channel.consume(this.queue, async (msg) => {
                    if (msg){
                        const payload = JSON.parse(msg.content.toString());
                        this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);
                        try {
                            // Process the data profiling result
                            // const { datasetId, profilingData } = payload;
                            // await this.datasetService.updateDatasetProfilingData(datasetId, profilingData);
                            // this.logger.log(`Processed data profiling result for dataset ID: ${datasetId}`);
                        } catch (error) {
                            this.logger.error(`Error processing data profiling result: ${error.message}`, error.stack);
                        } finally {
                            channel.ack(msg); // Acknowledge the message
                        }
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error starting the data profiling consumer:', error);
        }
    }
}
