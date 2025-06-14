import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DmsService {
  private readonly client: S3Client;
  private readonly bucketName: string = 'automldatastorage';
  private readonly logger = new Logger(DmsService.name);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.error('Missing AWS credentials or region in environment variables');
      throw new Error('AWS configuration is incomplete');
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadSingleFile({
    file,
    isPublic = true,
  }: {
    file: Express.Multer.File;
    isPublic: boolean;
  }) {
    const key = uuidv4();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      await this.client.send(command);

      const url = isPublic
        ? (await this.getFileUrl(key)).url
        : (await this.getPresignedSignedUrl(key)).url;

      return {
        url,
        key,
        isPublic,
      };
    } catch (error) {
      this.logger.error(`S3 Upload Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async getFileUrl(key: string) {
    return {
      url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
    };
  }

  async getPresignedSignedUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return { url };
    } catch (error) {
      this.logger.error(`Presigned URL Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      return { message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`S3 Delete Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }
}
