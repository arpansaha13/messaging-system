interface LoginBody {
  email: string
  password: string
}

interface SignupBody {
  email: string
  globalName: string
  password: string
  confirmPassword: string
}

interface SignupResoonse {
  otpHash: string
  message: string
}

interface VerificationBody {
  hash: string
  code: string
}

export function login(body: LoginBody) {
  const { $api } = useNuxtApp()
  return $api('/api/auth/login', {
    method: 'POST',
    body,
  })
}

export function signup(body: SignupBody) {
  const { $api } = useNuxtApp()
  return $api<SignupResoonse>('/api/auth/signup', {
    method: 'POST',
    body,
  })
}

export function verifySignup(body: VerificationBody) {
  const { $api } = useNuxtApp()
  return $api(`/api/auth/verify/${body.hash}`, {
    method: 'POST',
    body: { code: body.code },
  })
}

export function logout() {
  const { $api } = useNuxtApp()
  return $api('/api/auth/logout', {
    method: 'POST',
  })
}
