import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { Request } from 'express';

@ApiBearerAuth('access-token')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}


  // @UseGuards(AuthGuard('access_strategy'))
  @Post()
  async create(@Body() createProjectDto: CreateProjectDto){
    return await this.projectService.create(createProjectDto);

  }

  // @UseGuards(AuthGuard('access_strategy'))
  @Get()
  async findAll(){
    return await this.projectService.findAll();

  }

  // @UseGuards(AuthGuard('access_strategy'))
  @Get('me')
  async findMy(@Req() req: Request){
    if (!req.user) throw new Error('User not found in request');
    const user = req.user as { userId: string };  
    return await this.projectService.findMy(user.userId);

  }

  // @UseGuards(AuthGuard('access_strategy'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.projectService.findOne(id);

  }

  // @UseGuards(AuthGuard('access_strategy'))
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto){
    return await this.projectService.update(id, updateProjectDto);

  }

  // @UseGuards(AuthGuard('access_strategy'))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.projectService.remove(id);

  }
}
