import { Router, Request, Response } from 'express'
import { UserService } from '../services/user.service'

export function createUserRouter(userService: UserService) {
  const router = Router()

  router.get('/me', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    res.json(req.user)
  })

  router.patch('/me', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const data = req.body
    try {
      const updated = await userService.updateUser(req.user.id, data)
      res.json(updated)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/search', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const q = req.query.text as string | undefined
    if (!q) return res.json([])
    try {
      const results = await userService.findUsers(req.user.id, q)
      res.json(results)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/', async (_req: Request, res: Response) => {
    const users = await userService.listUsers()
    res.json(users)
  })

  router.get('/:id', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    const id = Number(req.params.id)
    try {
      const user = await userService.getUserWithContactById(req.user.id, id)
      if (!user) return res.status(404).json({ message: 'Not found' })
      res.json(user)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.post('/', async (req: Request, res: Response) => {
    const data = req.body
    const created = await userService.createUser(data)
    res.status(201).json(created)
  })

  router.put('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const data = req.body
    const updated = await userService.updateUser(id, data)
    res.json(updated)
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    await userService.deleteUser(id)
    res.status(204).send()
  })

  return router
}
