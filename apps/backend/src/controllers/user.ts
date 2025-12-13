import { Router, Request, Response } from 'express'
import type { UserService } from '../services/user'
import { validateDto } from '../utils/validate-dto'
import { CreateUserDto, UpdateUserDto } from '../dto/user'

export function createUserRouter(userService: UserService) {
  const router = Router()

  router.get('/me', async (req: Request, res: Response) => {
    res.json(await userService.getAuthUser(req.user))
  })

  router.patch('/me', validateDto(UpdateUserDto), async (req: Request, res: Response) => {
    const data = req.body
    try {
      const updated = await userService.updateUser(req.user.id, data)
      res.json(updated)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/search', async (req: Request, res: Response) => {
    const q = req.query.text as string | undefined
    if (!q) return res.json([])
    try {
      const results = await userService.findUsers(req.user.id, q)
      res.json(results)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    try {
      const user = await userService.getUserWithContactById(req.user.id, id)
      res.json(user)
    } catch (err: any) {
      res.status(404).json({ message: err.message })
    }
  })

  router.post('/', validateDto(CreateUserDto), async (req: Request, res: Response) => {
    const created = await userService.createUser(req.body)
    res.status(201).json(created)
  })

  router.put('/:id', validateDto(UpdateUserDto), async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const updated = await userService.updateUser(id, req.body)
    res.json(updated)
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    await userService.deleteUser(id)
    res.status(204).send()
  })

  return router
}
