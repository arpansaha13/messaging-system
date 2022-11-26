import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets'
// DTOs
import { WsChatEventDto } from './dtos/wsChatEvent.dto'
// Types
import type { Server, Socket } from 'socket.io'

import { CLIENT_ORIGIN } from 'src/constants'

@WebSocketGateway({
  cors: {
    origin: CLIENT_ORIGIN,
  },
})
export class ChatsGateway {
  @WebSocketServer()
  server: Server

  // FIXME: DTOs are not working with websocket event payloads

  @SubscribeMessage('chats')
  async handleEvent(
    @MessageBody() data: WsChatEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<any>> {
    console.log(data)
    return { event: 'chats', data }
  }
}
