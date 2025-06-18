import { Controller, Get, Post, Put, Delete, Param, Body, Patch, ClassSerializerInterceptor, UseInterceptors, NotFoundException, UseGuards, Req,  } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto, UserUpdateDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { Request } from 'express';
import { ApiDefaultResponses } from 'src/decorators';
import { CreateProjectDto } from 'src/project/dto';




@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {

    constructor(private readonly userService: UserService) {}


    @ApiDefaultResponses({type: UserResponseDto})
    @UseGuards(AuthGuard('access_strategy'))
    @Get()
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userService.findAllUsers();
        return users.map(user => plainToInstance(UserResponseDto, user));
    }


    @ApiDefaultResponses({type:UserResponseDto})
    @UseGuards(AuthGuard('access_strategy'))
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        const user = await this.userService.findOneUser(id);

        if (!user){
            throw new NotFoundException("User not found");
        }
        return plainToInstance(UserResponseDto, user);
    }



    @ApiDefaultResponses({type:UserUpdateDto})
    @UseGuards(AuthGuard('access_strategy'))
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UserUpdateDto): Promise<UserResponseDto> {
        const user = await this.userService.updateUser(id, data);
        return plainToInstance(UserResponseDto, user);
    }


    @ApiDefaultResponses({endpointDescription: "remove/delete a user. send the id as a param"})
    @UseGuards(AuthGuard('access_strategy'))
    @Delete(':id')
    async remove(@Param('id') id: string)  {
        return this.userService.removeUser(id);
    }


    @ApiDefaultResponses({type: CreateProjectDto})
    @UseGuards(AuthGuard('access_strategy'))
    @Get(':userId/projects')
    async getUserProjects(@Param('userId') userId:string){
        return await this.userService.getUserProjects(userId);

    }


    @ApiDefaultResponses({type: CreateProjectDto})
    @UseGuards(AuthGuard('access_strategy'))
    @Get('projects/me')
    async getMyProjects(@Req() req: Request) {        
        
        if (!req.user) throw new Error('User not found in request');
        const user = req.user as { userId: string }; 

        return await this.userService.getUserProjects(user.userId);

    }


    // // Todo: add api response decorator with report dto
    // @UseGuards(AuthGuard('access_strategy'))
    // @Get(':userId/projects/:projectId/reports')
    // async getUserProjectReports(@Param('userId') userId:string, @Param('projectId') projectId: string){
    //     return await this.userService.getUserProjectReports(userId, projectId);
    // }


    // Todo: add api response decorator with chat dto
    @UseGuards(AuthGuard('access_strategy'))
    @Get(':userId/chats')
    async getUserChats(@Param('userId') userId:string, @Req() req: Request){
        return await this.userService.getUserChats(userId);
    }

    // Todo: add api response decorator with chat dto
    @UseGuards(AuthGuard('access_strategy'))
    @Get(':userId/chats/:chatId')
    async getUserChatsById(@Param('userId') userId:string,  @Param('chatId') chatId: string, @Req() req: Request){
        return await this.userService.getUserChatById(userId, chatId);
    }


    // Todo: add api response decorator with chat dto
    @UseGuards(AuthGuard('access_strategy'))
    @Get('chats/me')
    async getMyChats(@Req() req: Request) {        
        
        if (!req.user) throw new Error('User not found in request');
        const user = req.user as { userId: string };  
        return await this.userService.getUserChats(user.userId);
    }
    
}
