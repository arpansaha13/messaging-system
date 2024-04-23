import rfetch from '~api/utils/rfetch'

export async function GET(request: Request) {
  const res = await rfetch('users/convo', request)

  return res
}
