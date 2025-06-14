import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Patch,
  Delete,
  ParseFilePipe,
  MaxFileSizeValidator,
  NotFoundException,
  StreamableFile,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { DatasetFormat } from '@prisma/client';
import { ApiDefaultResponses } from 'src/decorators';
import { DatasetService } from '../services/dataset.service';
import { getFileValidator } from './file-type-validaor';
import { ProfilingService } from '../services/profiling.service';



@Controller('datasets')
export class DatasetController {
  /**
   * Controller for managing datasets, including uploading, retrieving, updating, and deleting datasets.
   * It also provides functionality to download dataset files.
   */
  constructor(
    private readonly datasetService: DatasetService,
    private readonly profilingService: ProfilingService, 
  ) {}


  @ApiOperation({ summary: 'Upload a dataset with metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dataset file and metadata',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Customer Data' },
        description: { type: 'string', example: 'Dataset containing customer details' },
        projectId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        format: { type: 'string', enum: Object.values(DatasetFormat) },
        file: { type: 'string', format: 'binary' },
        start_profiling: { type: 'boolean', example: false }, // Add start_profiling to the schema
      },
    },
  })
  @ApiDefaultResponses({ type: CreateDatasetDto })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createDatasetDto: CreateDatasetDto,
    @UploadedFile(
      getFileValidator(), // Custom file type validator
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
          // new FileTypeValidator({ fileType: /(csv|json|xlsx)/ }), // Allow CSV, JSON, Excel
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('start_profiling') start_profiling: boolean = false, // Add start_profiling parameter
  ) {
    return this.datasetService.create(createDatasetDto, file, start_profiling);
  }


  @ApiDefaultResponses({type: CreateDatasetDto})
  @Get('project/:projectId')
  async findAll(@Param('projectId') projectId: string) {
    return this.datasetService.findAll(projectId);
  }


  @ApiDefaultResponses({type: CreateDatasetDto})
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.datasetService.findOne(id);
  }


  @ApiDefaultResponses({type: UpdateDatasetDto})
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDatasetDto: UpdateDatasetDto,
  ) {
    return this.datasetService.update(id, updateDatasetDto);
  }

  @ApiDefaultResponses({type: CreateDatasetDto})
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.datasetService.remove(id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string): Promise<StreamableFile> {
    try {
      const { fileStream, filename } = await this.datasetService.downloadDatasetFile(id);
      
      return new StreamableFile(await fileStream, {
        disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
        type: 'application/octet-stream',
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  @ApiDefaultResponses({ type: CreateDatasetDto }) // Adjust response type if needed
  @Patch(':id/start-profiling')
  async startProfiling(@Param('id') id: string) {
    return this.datasetService.startDatasetProfiling(id);
  }

  @Get(':id/eda')
  async getEda(@Param('id') id: string) {
    return this.profilingService.pollProfilingStatus(id);
  }
}