import { Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { CreateGroupDto, GroupIdParam as GroupIdParamDto } from '../dto/group.dto'
import { CreateChannelDto } from '../dto/channel.dto'
import type { ChannelService } from '../services/channel.service'
import type { GroupService } from '../services/group.service'
import type { InviteService } from '../services/invite.service'
import type { UserGroupService } from '../services/user-group.service'

export function createGroupRouter(
  groupService: GroupService,
  userGroupService: UserGroupService,
  channelService: ChannelService,
  inviteService: InviteService,
) {
  const router = Router()

  router.get('/', async (req: Request, res) => {
    const groups = await userGroupService.getGroupsOfUser(req.user.id)
    res.json(groups)
  })

  router.post('/', validateDto(CreateGroupDto), async (req: Request, res) => {
    try {
      const created = await groupService.createGroup(req.user, req.body)
      res.status(201).json(created)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:id', async (req: Request, res) => {
    const group = await groupService.getGroup(Number(req.params.id))
    if (!group) return res.status(404).send()
    res.json(group)
  })

  router.get('/:groupId/channels', validateDto(GroupIdParamDto, 'params'), async (req: Request, res) => {
    const groupId = Number(req.params.groupId)
    try {
      const channels = await channelService.getChannelsOfGroup(groupId)
      res.json(channels)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post(
    '/:groupId/channels',
    validateDto(GroupIdParamDto, 'params'),
    validateDto(CreateChannelDto),
    async (req: Request, res) => {
      const groupId = Number(req.params.groupId)
      try {
        const channel = await channelService.createChannel(groupId, req.body)
        res.status(201).json(channel)
      } catch (err: any) {
        res.status(400).json({ message: err.message })
      }
    },
  )

  router.get('/:groupId/members', validateDto(GroupIdParamDto, 'params'), async (req: Request, res) => {
    const groupId = Number(req.params.groupId)
    try {
      const members = await userGroupService.getMembersOfGroup(groupId)
      res.json(members)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/:groupId/invites', validateDto(GroupIdParamDto, 'params'), async (req: Request, res) => {
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
