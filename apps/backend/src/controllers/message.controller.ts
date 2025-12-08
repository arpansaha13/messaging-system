import { Router } from 'express'
import type { MessageService } from '../services/message.service'

export function createMessageRouter(messageService: MessageService) {
  const router = Router()

  router.get('/:receiverId', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    const clearedAt = new Date(0)
    try {
      const msgs = await messageService.getMessagesBetween(req.user.id, receiverId, clearedAt)
      res.json(msgs)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/channel/:channelId', async (req, res) => {
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
