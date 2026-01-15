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

interface VerificationBody {
  hash: string
  otp: string
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
  return $api('/api/auth/signup', {
    method: 'POST',
    body,
  })
}

export function verifySignup(body: VerificationBody) {
  const { $api } = useNuxtApp()
  return $api(`/api/auth/verification/${body.hash}`, {
    method: 'POST',
    body: { otp: body.otp },
  })
}

export function logout() {
  const { $api } = useNuxtApp()
  return $api('/api/auth/logout', {
    method: 'POST',
  })
}
