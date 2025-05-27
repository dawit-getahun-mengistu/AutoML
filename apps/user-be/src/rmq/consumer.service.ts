import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ChannelWrapper } from "amqp-connection-manager";

@Injectable()
export class ConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(ConsumerService.name);

    constructor() {

    }

    public async onModuleInit() {
        try {

        } catch (error) {
            this.logger.error('Error starting the consumer:', error)
        }
    }
}