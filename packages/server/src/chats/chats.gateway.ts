import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
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

  /** A map of all clients (user_id's) to their client socket id's. */
  clients = new Map<number, string>()

  // FIXME: DTOs are not working with websocket event payloads

  // @SubscribeMessage('connect')
  // handleConnection(@ConnectedSocket() senderSocket: Socket) {
  //   console.log('connect', senderSocket.id)
  // }

  // @SubscribeMessage('disconnect')
  // handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
  //   console.log('disconnect', senderSocket.id)
  // }

  @SubscribeMessage('session-connect')
  addSession(
    @MessageBody('userId') userId: number,
    @ConnectedSocket() senderSocket: Socket,
  ) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(userId, senderSocket.id)
    console.log(this.clients)
  }

  @SubscribeMessage('send-message')
  handleEvent(
    @MessageBody() data: WsChatEventDto,
    @ConnectedSocket() senderSocket: Socket,
  ) {
    const receiverClientId = this.clients.get(data.receiverId)

    function emitMsgStatus(status: 'sent' | 'delivered' | 'read') {
      this.server.to(senderSocket.id).emit('message-status', {
        status,
        /** The chats are mapped with receiver user_id in client-side. */
        userId: data.receiverId,
        time: data.time,
      })
    }

    // Inform the sender that the message has been "sent"
    // TODO: Store the message in database and if the storing (save) is successful then send this "sent" signal to sender.
    //       If the save is not successful, then send a "failed to send" signal to sender.
    emitMsgStatus.bind(this)('sent')

    // If the receiver is not online
    if (typeof receiverClientId === 'undefined') {
      return
    }

    // Send the message to receiver
    // Client should listen to `receive-message` event
    this.server.to(receiverClientId).emit('receive-message', {
      userId: data.senderId,
      msg: data.msg,
      time: data.time,
    })
    // Inform the sender that the message has been "delivered"
    emitMsgStatus.bind(this)('delivered')
  }
}
