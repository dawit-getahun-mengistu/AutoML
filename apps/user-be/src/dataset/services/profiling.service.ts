import { Injectable, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";
import { FileService } from "./file.service";

@Injectable()
export class ProfilingService {
    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private fileService: FileService
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
      data: { status: DatasetStatus.PROCESSING, profilingStatus: ProcessStatus.IN_PROGRESS, profilingError: "" },
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

  // get profiling data
  async getDatasetProfilingData(id: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      select: {
        profiling_metadata: true,
        profilingStatus: true,
        profilingError: true,
      },
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    return dataset;
  }

  // poll profiling status
  async pollProfilingStatus(id: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      select: {
        profilingStatus: true,
        profilingError: true,
        EDAFileViz: true, // include EDAFileViz if needed
      }, // only fetch profiling status and error
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // get presigned URL for EDAFileViz if it exists
    if (dataset.EDAFileViz) {
      const presignedUrl = await this.fileService.getPresignedUrl(id, dataset.EDAFileViz, 3600);
      // Return the dataset with the presigned URL for EDAFileViz
      return { ...dataset, EDAFileViz: presignedUrl };
    }
    else  {
      // Return the dataset without EDAFileViz if it doesn't exist
      return dataset;
    }
  }
}