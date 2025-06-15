import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { Queues } from "src/rmq/queues";

@Injectable()
export class FeatureSelectionConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(FeatureSelectionConsumerService.name);
    private readonly queue = Queues.DATA_SELECTION_RESULT_QUEUE
    
    constructor(){
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            
        } catch (error) {
            this.logger.error('Error starting the feature selection consumer:', error);
        }
    }

}