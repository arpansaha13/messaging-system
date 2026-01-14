import { Request, Response, Router } from 'express'
import { AuthService } from '../services/auth'

export function createAuthRouter(): Router {
  const router = Router()

  /**
   * POST /auth/signup
   * Register a new user
   */
  router.post('/signup', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        })
      }

      // Call auth service to signup
      const signupResponse = await AuthService.signup(email, password)

      res.status(201).json({
        message: signupResponse.message,
        otp_hash: signupResponse.otp_hash,
      })
    } catch (error: any) {
      console.error('Signup error:', error)
      const message = error.message || 'Signup failed'

      // Handle specific error types
      if (message.includes('conflict')) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      if (message.includes('validation')) {
        return res.status(400).json({ error: message })
      }

      res.status(500).json({ error: message })
    }
  })

  /**
   * POST /auth/login
   * Authenticate a user and return session token in HttpOnly Secure cookie
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        })
      }

      // Call auth service to login
      const loginResponse = await AuthService.login(email, password)

      // Convert Timestamp to milliseconds if it exists
      let maxAge = 30 * 60 * 1000 // 30 minutes default
      if (loginResponse.expires_at) {
        const expiresAtMs =
          typeof loginResponse.expires_at === 'object'
            ? (loginResponse.expires_at.seconds ?? 0) * 1000 + (loginResponse.expires_at.nanos ?? 0) / 1000000
            : new Date(loginResponse.expires_at).getTime()
        maxAge = Math.max(0, expiresAtMs - Date.now())
      }

      // Set session token as HttpOnly Secure cookie
      res.cookie(process.env.AUTH_COOKIE_NAME, loginResponse.session_token, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: maxAge,
        path: '/',
      })

      res.status(200).json({
        message: 'Login successful',
        user_id: undefined, // Don't expose user_id in response, it will be in the cookie
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const message = error.message || 'Login failed'

      // Handle specific error types
      if (message.includes('unauthorized') || message.includes('not verified')) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      if (message.includes('validation')) {
        return res.status(400).json({ error: message })
      }

      res.status(500).json({ error: message })
    }
  })

  /**
   * POST /auth/verify/:otpHash
   * Verify OTP sent to user's email
   */
  router.post('/verify/:otpHash', async (req: Request, res: Response) => {
    try {
      const { otpHash } = req.params
      const { code } = req.body

      // Validate input
      if (!otpHash || !code) {
        return res.status(400).json({
          error: 'OTP hash and code are required',
        })
      }

      // Call auth service to verify OTP
      const verifyResponse = await AuthService.verifyOTP(otpHash, code)

      // Set session token as HttpOnly Secure cookie
      res.cookie(process.env.AUTH_COOKIE_NAME, verifyResponse.session_token, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000, // 30 minutes
        path: '/',
      })

      res.status(200).json({
        message: verifyResponse.message,
        username: verifyResponse.username,
      })
    } catch (error: any) {
      console.error('Verification error:', error)
      const message = error.message || 'Verification failed'

      // Handle specific error types
      if (message.includes('invalid') || message.includes('expired')) {
        return res.status(401).json({ error: 'Invalid or expired OTP code' })
      }

      if (message.includes('validation')) {
        return res.status(400).json({ error: message })
      }

      if (message.includes('not found')) {
        return res.status(404).json({ error: 'OTP not found' })
      }

      res.status(500).json({ error: message })
    }
  })

  return router
}
