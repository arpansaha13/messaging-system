import { Router } from 'express'
import type { UserGroupService } from '../services/user-group.service'

export function createUserGroupRouter(userGroupService: UserGroupService) {
  const router = Router()

  router.get('/user/:userId', async (req, res) => {
    const groups = await userGroupService.getGroupsOfUser(Number(req.params.userId))
    res.json(groups)
  })

  router.get('/group/:groupId/members', async (req, res) => {
    const members = await userGroupService.getMembersOfGroup(Number(req.params.groupId))
    res.json(members)
  })

  router.post('/group/:groupId/join', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const groupId = Number(req.params.groupId)
    try {
      const added = await userGroupService.addUserToGroup(req.user.id, groupId)
      res.status(201).json(added)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
