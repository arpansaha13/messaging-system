import { Controller, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Controller('rooms')
@UseGuards(AuthGuard())
export class RoomController {
  constructor() {}
}
