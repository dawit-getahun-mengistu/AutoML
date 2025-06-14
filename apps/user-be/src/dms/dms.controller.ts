import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DmsService } from './dms.service';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';


const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

 
@Controller('dms')
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}
 
  @ApiOperation({ summary: 'Upload a file to DMS' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        isPublic: { type: 'string', example: 'true', description: 'Whether the file is public' },
      },
    },
  })
  @Post('/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
        //   new FileTypeValidator({ fileType: '.(csv|json|xlsx)' }),
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'File is too large. Max file size is 100MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('isPublic') isPublic: string,
  ) {
    const isPublicBool = isPublic === 'true' ? true : false;
    return this.dmsService.uploadSingleFile({ file, isPublic: isPublicBool });
  }
 


  @Get(':key')
 async getFileUrl(@Param('key') key: string) {
    return this.dmsService.getFileUrl(key);
  }
 
 @Get('/signed-url/:key')
  async getSingedUrl(@Param('key') key: string) {
    return this.dmsService.getPresignedSignedUrl(key);
  }
 
 @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    return this.dmsService.deleteFile(key);
  }
}