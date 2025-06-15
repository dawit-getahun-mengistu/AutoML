import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateDatasetDto } from './../dto/create-dataset.dto';
import { UpdateDatasetDto } from './../dto/update-dataset.dto';
import { DatasetStatus, ProcessStatus, } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ProducerService } from 'src/rmq/producer.service';
import { ProfilingService } from './profiling.service';
import type { Readable } from 'stream';
import { DmsService } from 'src/dms/dms.service';
import { EngineeringService } from './feature_engineering.service';
import { TargetSpecificationDto } from '../dto/target-specification.dto';

@Injectable()
export class DatasetService {
  private readonly logger = new Logger(DatasetService.name);
  constructor(
    private prisma: PrismaService,
    private dataManagementService: DmsService,
    private producerService: ProducerService,
    private profilingService: ProfilingService,
    private engineeringService: EngineeringService
  ) {}

  async create(
    createDatasetDto: CreateDatasetDto,
    file: Express.Multer.File,
    start_profiling: boolean = false,
  ) {
    const { projectId, name, description, format } = createDatasetDto;

    const { url, key, isPublic } = await this.dataManagementService.uploadSingleFile({file, isPublic: true});
    

    // Create dataset in the database
    const dataset = await this.prisma.dataset.create({
      data: {
        name,
        description,
        format,
        projectId,
        file: key,
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

  async specifyTargets(id: string, targetDto: TargetSpecificationDto) {
    // Lookup the dataset and ensure it exists
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    const { targetColumnName, taskType } = targetDto;

    // Update both the project's task type and the dataset's target column name atomically
    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: dataset.projectId },
        data: { taskType }
      }),
      this.prisma.dataset.update({
        where: { id },
        data: { targetColumnName }
      })
    ]);

    // Return the updated dataset
    return this.prisma.dataset.findUnique({ where: { id } });
  }

  async areTargetsFullySpecified(id: string, dataset: any = undefined): Promise<boolean> {
    if (!dataset){
      // Fetch the dataset by ID
      dataset = await this.prisma.dataset.findUnique({
        where: { id },
        select: { targetColumnName: true, project: { select: { taskType: true } } }, // Fetch targetColumnName and taskType
      });
    }

    // If the dataset does not exist, throw an exception
    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Check if both targetColumnName and taskType are specified
    const isTargetColumnSpecified = !!dataset.targetColumnName; // True if targetColumnName is not null or undefined
    const isTaskTypeSpecified = !!dataset.project?.taskType; // True if taskType is not null or undefined

    return isTargetColumnSpecified && isTaskTypeSpecified; // Return true only if both are specified
  }

  async remove(id: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Delete file from SeaweedFS
    // await this.storageService.deleteObject('datasets', dataset.file);
    await this.dataManagementService.deleteFile(dataset.file)

    // Delete dataset from the database
    return this.prisma.dataset.delete({
      where: { id },
    });
  }

  async getDatasetUrl(
    id: string
  ){
    try {
      const dataset = await this.findOne(id);
      if (!dataset) {
        throw new NotFoundException(`Dataset with ID ${id} not found`);
      }
      
      return this.dataManagementService.getFileUrl(dataset.file);
    } catch (error) {
      this.logger.error(`Download failed for dataset ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`File for dataset with ID ${id} not found`);
    }
  }

  async startDatasetProfiling(id: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id }});

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    if (!await this.areTargetsFullySpecified(id, dataset)) {
      throw new BadRequestException('Target Column or Task Type are not fully specified');
    }

    // Check if the dataset is already being profiled
      if ( dataset.profilingStatus === ProcessStatus.IN_PROGRESS) {
        throw new Error(`Dataset with ID ${id} is already being profiled`);
      }

    // Start profiling
    return await this.profilingService.startProfiling(id, dataset);

  }


  async startDatasetFeatureEngineering(id: string) {
    // First check targets are fully specified
    if (!await this.areTargetsFullySpecified(id)) {
      throw new BadRequestException('Target Column or Task Type are not fully specified');
    }
    // Start Engineering
    return await this.engineeringService.startFeatureEngineering(id);
  }

}