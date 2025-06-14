import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateDatasetDto } from './../dto/create-dataset.dto';
import { UpdateDatasetDto } from './../dto/update-dataset.dto';
import { DatasetStatus, ProcessStatus, } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from 'SeaweedClient';
import { ProducerService } from 'src/rmq/producer.service';
import { ProfilingService } from './profiling.service';
import { FileService } from './file.service';
import type { Readable } from 'stream';

@Injectable()
export class DatasetService {
  private readonly logger = new Logger(DatasetService.name);
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
    private storageService: StorageService,
    private producerService: ProducerService,
    private profilingService: ProfilingService
  ) {}

  async create(
    createDatasetDto: CreateDatasetDto,
    file: Express.Multer.File,
    start_profiling: boolean = false,
  ) {
    const { projectId, name, description, format } = createDatasetDto;

    // Upload file to SeaweedFS
    const objectName = `${projectId}/${uuidv4()}-${file.originalname}`;
    await this.storageService.uploadFile('datasets', objectName, file.buffer);
    

    // Create dataset in the database
    const dataset = await this.prisma.dataset.create({
      data: {
        name,
        description,
        format,
        projectId,
        file: objectName,
        status: DatasetStatus.UPLOADED,
        size: file.size,
      },
    });

    // Send message to the queue to start profiling
    if (start_profiling){
      const msg = await this.producerService.sendToQueue(
        this.producerService.queues[0], 
        dataset,
      );
      return {
        dataset: dataset,
        msg: msg
      }
    }

    return dataset;
  }

  async findAll(projectId: string) {
    return this.prisma.dataset.findMany({
      where: { projectId },
    });
  }

  async findOne(id: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: { attributes: true },
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    return dataset;
  }

  async update(id: string, updateDatasetDto: UpdateDatasetDto) {
    return this.prisma.dataset.update({
      where: { id },
      data: updateDatasetDto,
    });
  }

  async remove(id: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Delete file from SeaweedFS
    await this.storageService.deleteObject('datasets', dataset.file);

    // Delete dataset from the database
    return this.prisma.dataset.delete({
      where: { id },
    });
  }

  async downloadDatasetFile(
    id: string
  ): Promise<{ fileStream: Promise<Readable>; filename: string }> {
    try {
      const dataset = await this.findOne(id);
      if (!dataset) {
        throw new NotFoundException(`Dataset with ID ${id} not found`);
      }

      // Return stream promise without resolving it here
      const fileStream = this.fileService.downloadObject(dataset.file);
      const filename = this.extractFilename(dataset.file);

      return { fileStream, filename };
    } catch (error) {
      this.logger.error(`Download failed for dataset ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`File for dataset with ID ${id} not found`);
    }
  }

  private extractFilename(filePath: string): string {
    return filePath.split('/').pop() || 'dataset-file';
  }

  async startDatasetProfiling(id: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id }});

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Check if the dataset is already being profiled
      if ( dataset.profilingStatus === ProcessStatus.IN_PROGRESS) {
        throw new Error(`Dataset with ID ${id} is already being profiled`);
      }

    // Start profiling
    return await this.profilingService.startProfiling(id, dataset)

  }

}