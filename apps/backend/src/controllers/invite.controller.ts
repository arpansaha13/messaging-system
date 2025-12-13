import { type Request, Router } from 'express'
import { validateDto } from '../utils/validate-dto'
import { InviteHashParam } from '../dto/invite.dto'
import type { InviteService } from '../services/invite.service'

export function createInviteRouter(inviteService: InviteService) {
  const router = Router()

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
