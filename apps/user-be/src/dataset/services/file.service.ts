import { Injectable, NotFoundException } from "@nestjs/common";
import { StorageService } from "SeaweedClient";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FileService {
    private readonly bucketName: string = 'datasets' // Default bucket 
    
    /**
     * Service for handling file operations related to datasets.
     * It provides methods to download dataset files and generate presigned URLs for downloading.
     */
    constructor(
        private storageService: StorageService, 
        private prisma: PrismaService,

    ) {}
    

    async downloadObject(objectName: string) {
        return this.storageService.downloadObject(this.bucketName, objectName);
    }

    async getPresignedUrl(id: string, objectName: string, expiresIn: number = 3600) {
        const dataset = await this.prisma.dataset.findUnique({ where: { id }, select: { id: true } });
    
        if (!dataset) {
          throw new NotFoundException(`Dataset with ID ${id} not found`);
        }
    
        // Generate a presigned URL for downloading the file
        const url = await this.storageService.getPresignedDownloadUrl(
            this.bucketName,
            objectName,
            expiresIn
        );
        return url;
    }

    async deleteObject(objectName: string) {
        return this.storageService.deleteObject(this.bucketName, objectName);
    }
}