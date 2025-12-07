import { Router } from 'express'

export function createGroupRouter(groupService: any, userGroupService: any, channelService: any, inviteService: any) {
  const router = Router()

  router.get('/', async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const groups = await userGroupService.getGroupsOfUser(req.user.id)
    res.json(groups)
  })

  router.post('/', async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    try {
      const created = await groupService.createGroup(req.user, req.body)
      res.status(201).json(created)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:id', async (req, res) => {
    const group = await groupService.getGroup(Number(req.params.id))
    if (!group) return res.status(404).send()
    res.json(group)
  })

  router.get('/:groupId/channels', async (req: any, res: any) => {
    const groupId = Number(req.params.groupId)
    try {
      const channels = await channelService.getChannelsOfGroup(groupId)
      res.json(channels)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/:groupId/channels', async (req: any, res: any) => {
    const groupId = Number(req.params.groupId)
    try {
      const channel = await channelService.createChannel(groupId, req.body)
      res.status(201).json(channel)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:groupId/members', async (req: any, res: any) => {
    const groupId = Number(req.params.groupId)
    try {
      const members = await userGroupService.getMembersOfGroup(groupId)
      res.json(members)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/:groupId/invites', async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const groupId = Number(req.params.groupId)
    try {
      const invite = await inviteService.createInvite(req.user, groupId)
      res.status(201).json(invite)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
