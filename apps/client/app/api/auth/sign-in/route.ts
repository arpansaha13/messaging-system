import rfetch from '~api/utils/rfetch'

export async function POST(request: Request) {
  const res = await rfetch('auth/sign-in', request)

  return res
}
