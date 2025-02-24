import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
    constructor(private readonly prismaService: PrismaService){

    }

    async create(createProjectDto: CreateProjectDto){
        return await this.prismaService.project.create({
            data: createProjectDto
        });
    }

    async findAll(){
        return await this.prismaService.project.findMany();
    }

    async findMy(userId: string){
        return await this.prismaService.project.findMany({
            where: {
                userId: userId
            }
        });
    }

    async findOne(id: string){
        return await this.prismaService.project.findUnique({
            where: {
                id: id
            }
        });
    }

    async update(id: string, data: UpdateProjectDto){
        return await this.prismaService.project.update({
            where: {
                id: id
            },
            data: data
        });
    }

    async remove(id: string){
        return await this.prismaService.project.delete({
            where: {
                id: id
            }
        });
    }
}
