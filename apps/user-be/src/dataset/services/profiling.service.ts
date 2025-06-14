import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatasetStatus, ProcessStatus } from "@prisma/client";
import { DmsService } from "src/dms/dms.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ProducerService } from "src/rmq/producer.service";


@Injectable()
export class ProfilingService {
  private readonly logger = new Logger(ProfilingService.name);
    constructor(
        private prisma: PrismaService,
        private producerService: ProducerService,
        private dataManagementService: DmsService,
      ) {}

  private tryParseJson(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    let s = value.trim();
    // Quick check: only attempt parse on objects/arrays
    if (!s.startsWith('{') && !s.startsWith('[')) {
      return value;
    }

    // Sanitize JS-only literals so they're valid JSON
    const sanitized = s
      .replace(/\bNaN\b/g, 'null')
      .replace(/\b(Infinity|-Infinity)\b/g, 'null');

    // If nothing changed, we'll parse the original; otherwise parse the sanitized
    const toParse = sanitized === s ? s : sanitized;

    try {
      return JSON.parse(toParse);
    } catch (e: any) {
      this.logger.error(
        `tryParseJson failed${toParse !== s ? ' (after sanitization)' : ''}: ${e.message}`
      );
      // leave it as the raw string if parsing still fails
      return value;
    }
  }

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
      const eda_object_name = (this.tryParseJson(report) as any).eda_object_name || 'N/A';
      this.logger.log(`Profiling report: ${eda_object_name}`);
      await this.prisma.dataset.update({
        where: {id},
        data: {profiling_metadata: report as any, profilingStatus: ProcessStatus.COMPLETED, profilingError: "", EDAFileViz: eda_object_name}
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
      // const presignedUrl = await this.fileService.getPresignedUrl(id, dataset.EDAFileViz, 3600);
      const url = await this.dataManagementService.getFileUrl(dataset.EDAFileViz)
      
      return { ...dataset, EDAFileViz: url };
    }
    else  {
      // Return the dataset without EDAFileViz if it doesn't exist
      return dataset;
    }
    // return dataset;
  }
}