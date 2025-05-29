import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateDatasetDto } from './../dto/create-dataset.dto';
import { UpdateDatasetDto } from './../dto/update-dataset.dto';
import { DatasetStatus, ProcessStatus, } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from 'SeaweedClient';
import { ProducerService } from 'src/rmq/producer.service';
import { ProfilingService } from './profiling.service';

@Injectable()
export class DatasetService {
  constructor(
    private prisma: PrismaService,
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

  async downloadObject(objectName: string){
    return this.storageService.downloadObject('datasets', objectName);
  }

  async getDownloadUrl(id: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Generate a presigned URL for downloading the file
    const url = await this.storageService.getPresignedDownloadUrl(
      'datasets',
      dataset.file,
    );
    return url.replace('seaweedfs-s3', process.env.SEAWEED_EXTERNAL_ENDPOINT || 'localhost');
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