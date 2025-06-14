import { Injectable } from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { SeaweedOptions } from "../interfaces/seaweed-module-options";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

@Injectable()
export class StorageService {
  private client: S3;

  constructor(private options: SeaweedOptions) {
    this.createConnection();
  }

  private createConnection() {
    this.client = new S3({
      credentials: {
        accessKeyId: this.options.access_key || "any", // Fallback for local
        secretAccessKey: this.options.secret_key || "any", // Fallback for local
      },
      endpoint: this.options.s3_endpoint,
      region: "us-east-1", // Required by AWS SDK, even for local
      forcePathStyle: true, // Required for S3-compatible services like SeaweedFS
      tls: false, // Disable SSL for local HTTP
      logger: console, // Enable logging for debugging
    });
  }

  async listBuckets() {
    try {
      const response = await this.client.listBuckets();
      return response.Buckets;
    } catch (error) {
      console.error(`Error listing buckets: ${error}`);
      throw error;
    }
  }

  async createBucket(bucketName: string) {
    try {
      const response = await this.client.createBucket({
        Bucket: bucketName,
      });
      return response;
    } catch (error) {
      console.error(`Error creating bucket ${bucketName}: ${error}`);
      throw error;
    }
  }

  async deleteBucket(bucketName: string) {
    try {
      const response = await this.client.deleteBucket({ Bucket: bucketName });
      return response;
    } catch (error) {
      console.error(`Error deleting bucket ${bucketName}:`, error);
      throw error;
    }
  }

  async uploadFile(bucketName: string, objectName: string, file: Buffer) {
    try {
      const response = await this.client.putObject({
        Bucket: bucketName,
        Key: objectName,
        Body: file,
      });
      return response;
    } catch (error) {
      console.error(
        `Error uploading file ${objectName} to bucket ${bucketName}:`,
        error
      );
      throw error;
    }
  }

  async deleteObject(bucketName: string, objectName: string) {
    try {
      const response = await this.client.deleteObject({
        Bucket: bucketName,
        Key: objectName,
      });
      return response;
    } catch (error) {
      console.error(
        `Error deleting object ${objectName} from bucket ${bucketName}:`,
        error
      );
      throw error;
    }
  }

  async downloadObject(
    bucketName: string,
    objectName: string
  ): Promise<Readable> {
    try {
      const response = await this.client.getObject({
        Bucket: bucketName,
        Key: objectName,
      });
      return response.Body as Readable;
    } catch (error) {
      console.error(
        `Error downloading object ${objectName} from bucket ${bucketName}:`,
        error
      );
      throw error;
    }
  }

  async getPresignedDownloadUrl(
    bucketName: string,
    objectName: string,
    expiresIn: number = 3600
  ) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });

      const response = await this.client.send(command);
      console.log("Response:", response);

      

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error(
        `Error generating presigned download URL for ${objectName}:`,
        error
      );
      throw error;
    }
  }

  async getPresignedUploadUrl(
    bucketName: string,
    objectName: string,
    expiresIn: number = 3600
  ) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      });
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error(
        `Error generating presigned upload URL for ${objectName}:`,
        error
      );
      throw error;
    }
  }
}