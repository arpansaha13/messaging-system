import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { UserIdParam, GroupIdParam } from '../dto/user-group'
import type { UserGroupService } from '../services/user-group'

export function createUserGroupRouter(userGroupService: UserGroupService) {
  const router = Router()

  router.get('/user/:userId', validateDto(UserIdParam, 'params'), async (req: Request, res: any) => {
    const groups = await userGroupService.getGroupsOfUser(req.context)
    res.json(groups)
  })

  router.get('/group/:groupId/members', validateDto(GroupIdParam, 'params'), async (req: Request, res: any) => {
    const members = await userGroupService.getMembersOfGroup(Number(req.params.groupId))
    res.json(members)
  })

  router.post('/group/:groupId/join', validateDto(GroupIdParam, 'params'), async (req: Request, res: any) => {
    const groupId = Number(req.params.groupId)
    try {
      const added = await userGroupService.addUserToGroup(req.context, groupId)
      res.status(201).json(added)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
