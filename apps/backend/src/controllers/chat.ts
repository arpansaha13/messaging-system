import { Router } from 'express'
import type { ChatService } from 'src/services/chat'
import { validateDto } from '../utils/validate-dto'
import { ReceiverParamDto } from '../dto/chat'

export function createChatRouter(chatService: ChatService) {
  const router = Router()

  router.get('/', async (req, res) => {
    try {
      const chats = await chatService.getChatsOfUser(req.user.id)
      res.json(chats)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:receiverId', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      const chat = await chatService.getChatOfUserWithReceiver(req.user.id, receiverId)
      res.json(chat)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/archive', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updateArchive(req.user.id, receiverId, true)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/unarchive', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updateArchive(req.user.id, receiverId, false)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/pin', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updatePin(req.user.id, receiverId, true)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:receiverId/unpin', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.updatePin(req.user.id, receiverId, false)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.delete('/:receiverId/clear', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
    const receiverId = Number(req.params.receiverId)
    try {
      await chatService.clearChat(req.user.id, receiverId)
      res.status(204).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.delete('/:receiverId/delete', validateDto(ReceiverParamDto, 'params'), async (req, res) => {
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
