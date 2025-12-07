import { Router } from 'express'
import cookieParser from 'cookie-parser'
import { AuthService } from '../services/auth.service'

export function createAuthRouter() {
  const router = Router()
  const authService = new AuthService()

  router.use(cookieParser())

  router.get('/check-auth', async (req, res) => {
    const result = await authService.checkAuth(req)
    res.json(result)
  })

  router.post('/sign-up', async (req, res) => {
    try {
      await authService.signUp(req.body)
      res.status(201).send()
    } catch (err) {
      res.status(500).json({ message: 'Error' })
    }
  })

  router.post('/login', async (req, res) => authService.login(res, req.body))

  router.post('/logout', async (req, res) => authService.logout(req, res))

  router.get('/validate-link/account/:hash', async (req, res) => {
    const { hash } = req.params
    const result = await authService.validateVerificationLink(hash)
    res.json(result)
  })

  router.post('/verification/:hash', async (req, res) => {
    try {
      await authService.verifyAccount(req.params.hash, req.body.otp)
      res.status(201).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
