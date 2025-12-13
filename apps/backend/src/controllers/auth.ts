import { Router } from 'express'
import type { AuthService } from '../services/auth'
import cookieParser from 'cookie-parser'
import { validateDto } from '../utils/validate-dto'
import { LoginDto, SignUpDto, VerifyAccountDto } from '../dto/auth'

export function createAuthRouter(authService: AuthService) {
  const router = Router()

  router.use(cookieParser())

  router.get('/check-auth', async (req, res) => {
    const result = await authService.checkAuth(req)
    res.json(result)
  })

  router.post('/sign-up', validateDto(SignUpDto), async (req, res) => {
    try {
      await authService.signUp(req.body)
      res.status(201).send()
    } catch (err) {
      res.status(500).json({ message: 'Error' })
    }
  })

  router.post('/login', validateDto(LoginDto), async (req, res) => authService.login(res, req.body))

  router.post('/logout', async (req, res) => authService.logout(req, res))

  router.get('/validate-link/account/:hash', async (req, res) => {
    const { hash } = req.params
    const result = await authService.validateVerificationLink(hash)
    res.json(result)
  })

  router.post('/verification/:hash', validateDto(VerifyAccountDto), async (req, res) => {
    try {
      await authService.verifyAccount(req.params.hash, req.body.otp)
      res.status(201).send()
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  return router
}
