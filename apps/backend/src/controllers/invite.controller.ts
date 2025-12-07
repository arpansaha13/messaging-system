import { Router } from 'express'

export function createInviteRouter(inviteService: any) {
  const router = Router()

  router.post('/group/:groupId', async (req, res) => {
    const authUser = req.user
    if (!authUser) return res.status(401).json({ message: 'Unauthorized' })
    const invite = await inviteService.createInvite(authUser, Number(req.params.groupId))
    res.status(201).json(invite)
  })

  router.get('/:hash', async (req, res) => {
    const inv = await inviteService.findByHash(req.params.hash)
    if (!inv) return res.status(404).send()
    res.json(inv)
  })

  router.post('/:hash/accept', async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    try {
      const result = await inviteService.acceptInvite(req.user, req.params.hash)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
