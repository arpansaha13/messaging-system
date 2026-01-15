import { Router, Request, Response } from 'express'
import type { UserService } from '../services/user'
import { validateDto } from '../utils/validate-dto'
import { CreateUserDto, UpdateUserDto } from '../dto/user'

export function createUserRouter(userService: UserService) {
  const router = Router()

  router.get('/me', async (req: Request, res: Response) => {
    if (!req.context?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    res.json(await userService.getAuthUser(req.context))
  })

  router.patch('/me', validateDto(UpdateUserDto), async (req: Request, res: Response) => {
    if (!req.context?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const data = req.body
    try {
      const updated = await userService.updateUser(req.context, req.context.user.id, data)
      res.json(updated)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/search', async (req: Request, res: Response) => {
    const q = req.query.text as string | undefined
    if (!q) return res.json([])
    if (!req.context?.user) {
      return res.json([])
    }
    try {
      const results = await userService.findUsers(req.context, req.context.user.id, q)
      res.json(results)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!req.context?.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      const user = await userService.getUserWithContactById(req.context, req.context.user.id, id)
      res.json(user)
    } catch (err: any) {
      res.status(404).json({ message: err.message })
    }
  })

  router.post('/', validateDto(CreateUserDto), async (req: Request, res: Response) => {
    try {
      // Filter to only UserProfile fields
      const profileData = {
        globalName: req.body.globalName,
        bio: req.body.bio,
        dp: req.body.dp,
      }
      const created = await userService.createUser(profileData)
      res.status(201).json(created)
    } catch (err: any) {
      res.status(500).json({ message: err.message })
    }
  })

  router.put('/:id', validateDto(UpdateUserDto), async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const updated = await userService.updateUser(req.context, id, req.body)
    res.json(updated)
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    await userService.deleteUser(id)
    res.status(204).send()
  })

  return router
}
