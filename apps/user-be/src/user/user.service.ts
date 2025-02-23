import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResponseDto, UserUpdateDto } from './dto';

@Injectable()
export class UserService {
    constructor(private readonly prismaService :PrismaService) {}

    async findAll() {
        return this.prismaService.user.findMany();
    }

    async findOne(id: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                id:id
            }
        });
        return user;
    }

    async update(id: string, data: Partial<UserUpdateDto>){
        const user =await this.prismaService.user.update({
            where: {
                id: id
            },
            data: data
        });
        return user;
    }

    async remove(id: string): Promise<void> {
        await this.prismaService.user.delete({
            where: {
                id: id
            }
        })
    }
}
