import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GroupService } from './group.service'
import { CreateGroupDto } from './dto/create-group.dto'
import { Channel } from 'src/channels/channel.entity'
import { GroupIdParam } from './dto/group-id-param.dto'
import type { Request } from 'express'
import type { Group } from 'src/groups/group.entity'

@Controller('groups')
@UseGuards(AuthGuard())
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  getGroupsOfUser(@Req() request: Request): Promise<Group[]> {
    return this.groupService.getGroupsOfUser(request.user)
  }

  @Get('/:groupId')
  getGroup(@Param() params: GroupIdParam): Promise<Group> {
    return this.groupService.getGroup(params.groupId)
  }

  @Get('/:groupId/channels')
  getChannelsOfGroup(@Param() params: GroupIdParam): Promise<Channel[]> {
    return this.groupService.getChannelsOfGroup(params.groupId)
  }

  @Post()
  createGroup(@Req() request: Request, @Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return this.groupService.createGroup(request.user, createGroupDto)
  }
}
