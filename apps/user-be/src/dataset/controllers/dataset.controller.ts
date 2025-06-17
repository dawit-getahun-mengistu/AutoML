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
import { TargetSpecificationDto } from '../dto/target-specification.dto';
import { ResponseDatasetDto } from '../dto/response-dataset.dto';
import { EngineeringService } from '../services/feature_engineering.service';
import { FeatureSelectionService } from '../services/feature_selection.service';



@Controller('datasets')
export class DatasetController {
  /**
   * Controller for managing datasets, including uploading, retrieving, updating, and deleting datasets, and data pre-processing [feature engineering & feature selection].
   * It also provides functionality to download dataset files.
   */
  constructor(
    private readonly datasetService: DatasetService,
    private readonly profilingService: ProfilingService, 
    private readonly engineeringService: EngineeringService,
    private readonly featureSelectionService: FeatureSelectionService
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
  @ApiDefaultResponses({ type: ResponseDatasetDto })
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


  @ApiDefaultResponses({type: ResponseDatasetDto})
  @Get('project/:projectId')
  async findAll(@Param('projectId') projectId: string) {
    return this.datasetService.findAll(projectId);
  }


  @ApiDefaultResponses({type: ResponseDatasetDto})
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.datasetService.findOne(id);
  }


  @ApiDefaultResponses({type: ResponseDatasetDto})
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDatasetDto: UpdateDatasetDto,
  ) {
    return this.datasetService.update(id, updateDatasetDto);
  }

  @ApiOperation({ summary: 'Specify target column and task type for a dataset' })
  @ApiDefaultResponses({ type: ResponseDatasetDto })
  @Patch(':id/specify-targets')
  async specifyTargets(
    @Param('id') id: string,
    @Body() targetDto: TargetSpecificationDto,
  ) {
    return this.datasetService.specifyTargets(id, targetDto);
  }

  @ApiDefaultResponses({type: ResponseDatasetDto})
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.datasetService.remove(id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string) {
    return this.datasetService.getDatasetUrl(id);
  }

  // DATA PROFILING
  @Patch(':id/start-profiling')
  async startProfiling(@Param('id') id: string) {
    return this.datasetService.startDatasetProfiling(id);
  }

  @Get(':id/eda')
  async getEda(@Param('id') id: string) {
    return this.profilingService.pollProfilingStatus(id);
  }


  // FEATURE ENGINEERING
  @Patch(':id/start-feature-engineering')
  async startFeatEngineering(@Param('id') id: string) {
    return this.datasetService.startDatasetFeatureEngineering(id);
  }

  @Get(':id/feature-engineering')
  async getFeatureEngineering(@Param('id') id: string){
    return this.engineeringService.pollEngineeringStatus(id);
  }

  // FEATURE SELECTION
  @Patch(':id/start-feature-selection')
  async startFeatSelection(@Param('id') id: string) {
    return this.datasetService.startDatasetFeatureSelection(id);
  }

  @Get(':id/feature-selection')
  async getFeatureSelection(@Param('id') id: string) {
    return this.featureSelectionService.pollSelectionStatus(id);
  }

}