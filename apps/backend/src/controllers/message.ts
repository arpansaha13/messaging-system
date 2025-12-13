import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { ReceiverIdParam, ChannelIdParam } from '../dto/message'
import type { MessageService } from '../services/message'

export function createMessageRouter(messageService: MessageService) {
  const router = Router()

  router.get('/:receiverId', validateDto(ReceiverIdParam, 'params'), async (req: Request, res) => {
    const receiverId = Number(req.params.receiverId)
    const clearedAt = new Date(0)
    try {
      const msgs = await messageService.getMessagesBetween(req.user.id, receiverId, clearedAt)
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

  return router
}
