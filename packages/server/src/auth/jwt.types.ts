export interface JwtPayload {
  userTag: string
}

export interface JwtToken {
  authToken: string

  /** Time at which the token will expire. */
  expiresAt: number
}
