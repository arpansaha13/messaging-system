import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { InviteHashparam } from './dto/invite-hash-param.dto'
import { InviteService } from './invite.service'
import type { Request } from 'express'
import type { Invite } from './invite.entity'
import type { Group } from 'src/groups/group.entity'

@Controller('invites')
@UseGuards(AuthGuard())
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @Get('/:hash')
  async getInvite(@Req() request: Request, @Param() params: InviteHashparam): Promise<Invite> {
    return this.inviteService.getInvite(request.user, params.hash)
  }

  @Post('/:hash/accept')
  async acceptInvite(@Req() request: Request, @Param() params: InviteHashparam): Promise<Group> {
    return this.inviteService.acceptInvite(request.user, params.hash)
  }
}
