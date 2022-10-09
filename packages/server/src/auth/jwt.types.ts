export interface JwtPayload {
  user_id: number
}

export interface JwtToken {
  authToken: string

  /** Time at which the token will expire. */
  expiresAt: number
}
