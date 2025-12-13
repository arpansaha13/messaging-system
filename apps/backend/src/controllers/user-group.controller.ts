import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { UserIdParam, GroupIdParam } from '../dto/user-group.dto'
import type { UserGroupService } from '../services/user-group.service'

export function createUserGroupRouter(userGroupService: UserGroupService) {
  const router = Router()

  router.get('/user/:userId', validateDto(UserIdParam, 'params'), async (req: Request, res: any) => {
    const groups = await userGroupService.getGroupsOfUser(Number(req.params.userId))
    res.json(groups)
  })

  router.get('/group/:groupId/members', validateDto(GroupIdParam, 'params'), async (req: Request, res: any) => {
    const members = await userGroupService.getMembersOfGroup(Number(req.params.groupId))
    res.json(members)
  })

  router.post('/group/:groupId/join', validateDto(GroupIdParam, 'params'), async (req: Request, res: any) => {
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
