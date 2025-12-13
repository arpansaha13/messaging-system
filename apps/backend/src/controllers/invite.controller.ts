import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { GroupIdParam as GroupIdParamDto, InviteHashParam } from '../dto/invite.dto'
import type { InviteService } from '../services/invite.service'

export function createInviteRouter(inviteService: InviteService) {
  const router = Router()

  router.post('/group/:groupId', validateDto(GroupIdParamDto, 'params'), async (req: Request, res) => {
    const authUser = req.user
    if (!authUser) return res.status(401).json({ message: 'Unauthorized' })
    const invite = await inviteService.createInvite(authUser, Number(req.params.groupId))
    res.status(201).json(invite)
  })

  router.get('/:hash', validateDto(InviteHashParam, 'params'), async (req: Request, res) => {
    const inv = await inviteService.findByHash(req.params.hash)
    if (!inv) return res.status(404).send()
    res.json(inv)
  })

  router.post('/:hash/accept', validateDto(InviteHashParam, 'params'), async (req: Request, res) => {
    try {
      const result = await inviteService.acceptInvite(req.user, req.params.hash)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
