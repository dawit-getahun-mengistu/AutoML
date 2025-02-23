import { Controller, Get, Post, Put, Delete, Param, Body, Patch, ClassSerializerInterceptor, UseInterceptors, NotFoundException, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { UserResponseDto, UserUpdateDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {

    constructor(private readonly userService: UserService) {}

    @UseGuards(AuthGuard('access_strategy'))
    @Get()
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userService.findAll();
        return users.map(user => plainToInstance(UserResponseDto, user));
    }

    @UseGuards(AuthGuard('access_strategy'))
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        const user = await this.userService.findOne(id);

        if (!user){
            throw new NotFoundException("User not found");
        }
        return plainToInstance(UserResponseDto, user);
    }


    @UseGuards(AuthGuard('access_strategy'))
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UserUpdateDto): Promise<UserResponseDto> {
        const user = await this.userService.update(id, data);
        return plainToInstance(UserResponseDto, user);
    }

    @UseGuards(AuthGuard('access_strategy'))
    @Delete(':id')
    async remove(@Param('id') id: string)  {
        return this.userService.remove(id);
    }
    
}
