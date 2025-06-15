import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { Queues } from "src/rmq/queues";
import { EngineeringService } from "./feature_engineering.service";
import { channel } from "diagnostics_channel";
import { ConfirmChannel } from "amqplib";

@Injectable()
export class FeatureEngineeringConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(FeatureEngineeringConsumerService.name);
    private readonly queue = Queues.DATA_ENGINEERING_RESULT_QUEUE

    constructor(private engineeringService: EngineeringService){
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            this.logger.log("Initializing Feature Engineering Consumer")
            await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                            await channel.assertQueue(this.queue, {durable: true});
                            await channel.consume(this.queue, async (msg) => {
                                if (msg){
                                    
                                    try {
                                        const payload = JSON.parse(msg.content.toString());
                                        this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);   
                            
                                        await this.engineeringService.processEngineeringResult(payload)
                                        this.logger.log('Processed feature engineering result for the dataset ID');
                                    } catch (error) {
                                        this.logger.error(`Error processing feature engineering result: ${error.message}`, error.stack);
                                    } finally {
                                        channel.ack(msg); // Acknowledge the message
                                    }
                                }
                            });
                        });

        } catch (error) {
            this.logger.error('Error starting the feature engineering consumer:', error)
        }
    }
    
}