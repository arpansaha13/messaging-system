import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets'
// DTOs
import { WsChatEventDto } from './dtos/chatGateway.dto'
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

  /** A map of all clients (user_id's) to their socket client id's. */
  clients = new Map<number, string>()

  // FIXME: DTOs are not working with websocket event payloads

  // @SubscribeMessage('connect')
  // handleConnection(@ConnectedSocket() client: Socket) {
  //   console.log('connect', client.id)
  // }

  // @SubscribeMessage('disconnect')
  // handleDisconnect(@ConnectedSocket() client: Socket) {
  //   console.log('disconnect', client.id)
  // }

  @SubscribeMessage('session-connect')
  addSession(
    @MessageBody('userId') userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(userId, client.id)
    console.log(this.clients)
  }

  @SubscribeMessage('chat')
  async handleEvent(
    @MessageBody() data: WsChatEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<any>> {
    const receiverClientId = this.clients.get(data.receiverId)
    if (typeof receiverClientId === 'undefined') {
      return
    }
    const receiverSocket = this.server.sockets.sockets.get(receiverClientId)
    // Send the message to receiver
    receiverSocket.emit('chat', data)
  }
}
