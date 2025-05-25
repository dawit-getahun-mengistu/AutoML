import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus } from "@nestjs/common";  
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { Channel } from "amqplib";
import { channel } from "diagnostics_channel";




@Injectable()
export class ProducerService {
    private channelWrapper: ChannelWrapper;
    private readonly queues = [
        process.env.DATA_PROFILING_REQUEST_QUEUE || 'DATA_PROFILING_REQUEST_QUEUE',
        process.env.DATA_PROFILING_RESULT_QUEUE || 'DATA_PROFILING_RESULT_QUEUE',
    ];
    constructor() {
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://localhost']);
        this.channelWrapper = connection.createChannel({
            setup: async (channel: Channel) => {
                // Assert all queues
                for (const queue of this.queues){
                    if (!queue) {
                        Logger.error(`Queue name is not defined: ${queue}`);
                        continue;
                    }
                    Logger.log(`Asserting queue: ${queue}`);
                    await channel.assertQueue(queue, { durable: true });
                }
                
            },
        });
    }

    async sendToQueue(queue: string, payload: any) {
        try {
            await this.channelWrapper.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
                persistent: true,
            });
            Logger.log(`Message sent to queue ${queue}: ${JSON.stringify(payload)}`);
        } catch (error) {
            Logger.error(`Failed to send message to queue ${queue}: ${error}`);
            throw new HttpException(`Failed to send message to queue ${queue}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}