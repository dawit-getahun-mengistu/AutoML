import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResponseDto, UserUpdateDto } from './dto';

@Injectable()
export class UserService {
    constructor(private readonly prismaService :PrismaService) {}

    async findAllUsers() {
        return this.prismaService.user.findMany();
    }

    async findOneUser(id: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                id:id
            }
        });
        return user;
    }

    async updateUser(id: string, data: Partial<UserUpdateDto>){
        const user =await this.prismaService.user.update({
            where: {
                id: id
            },
            data: data
        });
        return user;
    }

    async removeUser(id: string): Promise<void> {
        await this.prismaService.user.delete({
            where: {
                id: id
            }
        })
    }

    async getUserProjects(id: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                id: id
            },
            include: {
                projects: true
            }
        });
        return user.projects;
    }


    async getUserProjectReports(userId: string, projectId: string){

        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            include: {
                projects: {
                    where: {
                        id: projectId
                    },
                    include: {
                        datasets: true,
                    }
                }
            }
        });
        return [];
        
    }
    
    
    async getUserChats(userId: string){        
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            include: {
                chats: true
            }
        });
        return user.chats;
    }

    async getUserChatById(userId: string, chatId: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            include: {
                chats: {
                    where: {
                        id: chatId
                    }
                }
            }
        });
        return user.chats[0];
    }

}
