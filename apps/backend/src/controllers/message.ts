import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import {
  ReceiverIdParam,
  ChannelIdParam,
  SendPersonalMessageDto,
  HandleDeliveredDto,
  HandleReadMultipleDto,
  SendGroupMessageDto,
} from '../dto/message'
import type { MessageService } from '../services/message'

export function createMessageRouter(messageService: MessageService) {
  const router = Router()

  router.get('/:receiverId', validateDto(ReceiverIdParam, 'params'), async (req: Request, res) => {
    const receiverId = Number(req.params.receiverId)
    const clearedAt = new Date(0)
    try {
      const msgs = await messageService.getMessagesBetween(req.context, receiverId, clearedAt)
      res.json(msgs)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/channel/:channelId', validateDto(ChannelIdParam, 'params'), async (req: Request, res) => {
    const channelId = Number(req.params.channelId)
    try {
      const msgs = await messageService.getMessagesInChannel(channelId)
      res.json(msgs)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/send/personal', validateDto(SendPersonalMessageDto), async (req: Request, res) => {
    try {
      const result = await messageService.sendPersonalMessage(req.context, req.body)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/send/group', validateDto(SendGroupMessageDto), async (req: Request, res) => {
    try {
      const result = await messageService.sendGroupMessage(req.context, req.body)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/status/delivered', validateDto(HandleDeliveredDto), async (req: Request, res) => {
    try {
      const result = await messageService.handleDelivered(req.context, req.body)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/status/read', validateDto(HandleReadMultipleDto), async (req: Request, res) => {
    try {
      const result = await messageService.handleRead(req.context, req.body.messages)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
