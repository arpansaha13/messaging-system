import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GroupService } from './group.service'
import { CreateGroupDto } from './dto/create-group.dto'
import type { Request } from 'express'
import type { Group } from 'src/groups/group.entity'

@Controller('groups')
@UseGuards(AuthGuard())
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  async createGroup(@Req() request: Request, @Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return this.groupService.createGroup(request.user, createGroupDto)
  }
}
