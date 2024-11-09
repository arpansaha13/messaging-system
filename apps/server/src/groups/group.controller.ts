import { Body, Controller, Get, Param, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GroupService } from './group.service'
import { CreateGroupDto } from './dto/create-group.dto'
import { Channel } from 'src/channels/channel.entity'
import { GroupIdParam } from './dto/group-id-param.dto'
import { CreateChannelDto } from './dto/create-channel.dto'
import { TransformToPlainInterceptor } from 'src/common/interceptors/toPlain.interceptor'
import type { Request } from 'express'
import type { User } from 'src/users/user.entity'
import type { Group } from 'src/groups/group.entity'
import type { Invite } from 'src/invites/invite.entity'

@Controller('groups')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  getGroupsOfUser(@Req() request: Request): Promise<Group[]> {
    return this.groupService.getGroupsOfUser(request.user)
  }

  @Post()
  createGroup(@Req() request: Request, @Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return this.groupService.createGroup(request.user, createGroupDto)
  }

  @Get('/:groupId')
  getGroup(@Param() params: GroupIdParam): Promise<Group> {
    return this.groupService.getGroup(params.groupId)
  }

  @Get('/:groupId/channels')
  getChannelsOfGroup(@Param() params: GroupIdParam): Promise<Channel[]> {
    return this.groupService.getChannelsOfGroup(params.groupId)
  }

  @Post('/:groupId/channels')
  createChannel(@Param() params: GroupIdParam, @Body() createChannelDto: CreateChannelDto): Promise<Channel> {
    return this.groupService.createChannel(params.groupId, createChannelDto)
  }

  @Get('/:groupId/members')
  getMembersOfGroup(@Param() params: GroupIdParam): Promise<User[]> {
    return this.groupService.getMembersOfGroup(params.groupId)
  }

  @Post('/:groupId/invites')
  createInvite(@Req() request: Request, @Param() params: GroupIdParam): Promise<Invite> {
    return this.groupService.createInvite(request.user, params.groupId)
  }
}
