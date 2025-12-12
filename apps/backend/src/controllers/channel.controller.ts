import { Router } from 'express'
import type { ChannelService } from '../services/channel.service'

export function createChannelRouter(channelService: ChannelService) {
  const router = Router()

  router.get('/:channelId', async (req, res) => {
    const channelId = Number(req.params.channelId)
    try {
      const channel = await channelService.getChannel(channelId)
      if (!channel) return res.status(404).json({ message: 'Not found' })
      res.json(channel)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
