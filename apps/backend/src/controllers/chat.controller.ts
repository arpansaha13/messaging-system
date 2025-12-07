import { Router } from 'express'
import type { ChatService } from 'src/services/chat.service'

export function createChatRouter(chatService: ChatService) {
  const router = Router()

  router.get('/', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    try {
      const chats = await chatService.getChatsOfUser(req.user.id)
      res.json(chats)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:receiverId', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      const chat = await chatService.getChatOfUserWithReceiver(req.user.id, receiverId)
      res.json(chat)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/archive', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updateArchive(req.user.id, receiverId, true)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/unarchive', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updateArchive(req.user.id, receiverId, false)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/pin', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updatePin(req.user.id, receiverId, true)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/unpin', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updatePin(req.user.id, receiverId, false)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.delete('/:receiverId/clear', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.clearChat(req.user.id, receiverId)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.delete('/:receiverId/delete', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.deleteChat(req.user.id, receiverId)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
