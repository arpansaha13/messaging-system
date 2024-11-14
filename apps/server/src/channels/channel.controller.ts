import { TransformToPlainInterceptor } from 'src/common/interceptors/toPlain.interceptor'
import type { Channel } from 'src/channels/channel.entity'
import { Controller, UseGuards, UseInterceptors, Get, Param } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ChannelService } from './channel.service'
import { ChannelIdParam } from './dto/channel-id-param.dto'

@Controller('channels')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get('/:channelId')
  getGroupsOfUser(@Param() params: ChannelIdParam): Promise<Channel> {
    return this.channelService.getChannel(params.channelId)
  }
}
