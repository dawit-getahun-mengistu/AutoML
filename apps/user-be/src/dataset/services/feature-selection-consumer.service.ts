import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { Queues } from "src/rmq/queues";
import { FeatureSelectionService } from "./feature_selection.service";

@Injectable()
export class FeatureSelectionConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(FeatureSelectionConsumerService.name);
    private readonly queue = Queues.DATA_SELECTION_RESULT_QUEUE
    
    constructor(private featureSelectionService: FeatureSelectionService){
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            this.logger.log("Initializing Feature Selection Consumer")
                        await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                                        await channel.assertQueue(this.queue, {durable: true});
                                        await channel.consume(this.queue, async (msg) => {
                                            if (msg){
                                                
                                                try {
                                                    const payload = JSON.parse(msg.content.toString());
                                                    this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);   
                                        
                                                    await this.featureSelectionService.processFeatureSelectionResult(payload)
                                                    this.logger.log('Processed feature selection result for the dataset ID');
                                                } catch (error) {
                                                    this.logger.error(`Error processing feature selection result: ${error.message}`, error.stack);
                                                } finally {
                                                    channel.ack(msg); // Acknowledge the message
                                                }
                                            }
                                        });
                                    });
            
        } catch (error) {
            this.logger.error('Error starting the feature selection consumer:', error);
        }
    }

}