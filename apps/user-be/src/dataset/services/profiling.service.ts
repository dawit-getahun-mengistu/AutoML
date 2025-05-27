import { Injectable, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { StorageService } from "SeaweedClient";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";

@Injectable()
export class ProfilingService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
        private producerService: ProducerService,
      ) {}

    // start dataset profiling
  async startProfiling(id: string, dataset: any) {

    // Send a message to a message queue to start profiling
    await this.producerService.sendToQueue(
      this.producerService.queues[0], 
      dataset,
    );

    // Update dataset status to PROFILING
    await this.prisma.dataset.update({
      where: { id },
      data: { status: DatasetStatus.PROCESSING, profilingStatus: ProcessStatus.IN_PROGRESS },
    });

    return { message: `Profiling started for dataset with ID ${id}` };
  }

  // process profiling result
  async updateDatasetProfilingData(id: string, report: any) {
    try{
      await this.prisma.dataset.update({
        where: {id},
        data: {profiling_metadata: report as any, profilingStatus: ProcessStatus.COMPLETED, profilingError: ""}
      })
      return {msg : "Profiling Success"}
    } catch (err) {
      await this.prisma.dataset.update({
        where: {id},
        data: {profilingStatus: ProcessStatus.FAILED, profilingError: err.message}
      })

    }

  }
}