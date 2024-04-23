import rfetch from '~api/utils/rfetch'

export async function GET(request: Request) {
  const res = await rfetch('auth/check-auth', request)

  return res
}
