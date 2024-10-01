import _fetch from './_fetch'

interface ILoginBody {
  email: string
  password: string
}

interface ISignupBody {
  email: string
  globalName: string
  password: string
  confirmPassword: string
}

interface IVerificationBody {
  otp: string
}

export function _login(body: ILoginBody): Promise<void> {
  return _fetch('auth/login', { method: 'POST', body })
}

export function _signup(body: ISignupBody): Promise<void> {
  return _fetch('auth/sign-up', { method: 'POST', body })
}

export function _verification(hash: string, body: IVerificationBody): Promise<void> {
  return _fetch(`auth/verification/${hash}`, { method: 'POST', body })
}

export function _logout(): Promise<void> {
  return _fetch('auth/logout', { method: 'POST' })
}
