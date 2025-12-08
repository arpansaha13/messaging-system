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

  router.get('/group/:groupId', async (req, res) => {
    const groupId = Number(req.params.groupId)
    const channels = await channelService.getChannelsOfGroup(groupId)
    res.json(channels)
  })

  router.post('/group/:groupId', async (req, res) => {
    const groupId = Number(req.params.groupId)
    const created = await channelService.createChannel(groupId, req.body)
    res.status(201).json(created)
  })

  return router
}
