import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { Queues } from "src/rmq/queues";
import { ClassicalService } from "./classical_training.service";

@Injectable()
export class ClassicalTrainingConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(ClassicalTrainingConsumerService.name);
    private readonly queue = Queues.CLASSICAL_TRAINING_RESULT_QUEUE

    constructor(private classicalService: ClassicalService){
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit(){
        try {
            this.logger.log("Initializing Classical Training Consumer")
            await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                await channel.assertQueue(this.queue, {durable: true});
                await channel.consume(this.queue, async (msg) => {
                    if (msg){
                        
                        try {
                            const payload = JSON.parse(msg.content.toString());
                            this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);   
                
                            await this.classicalService.processClassicalTrainingResult(payload);
                            this.logger.log('Processed classical training result for the dataset ID');
                        } catch (error) {
                            this.logger.error(`Error processing classical training result: ${error.message}`, error.stack);
                        } finally {
                            channel.ack(msg); // Acknowledge the message
                        }
                    }
                });
            });
            

        } catch (error) {
            this.logger.error('Error starting the classical training consumer:', error);
        }
    }

}