import { type NextRequest } from 'next/server'
import rfetch from '~api/utils/rfetch'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  let res: Response

  if (userId) res = await rfetch(`contacts?userId=${userId}`, request)
  else res = await rfetch('contacts', request)

  return res
}

export async function POST(request: Request) {
  const res = await rfetch('contacts', request)

  return res
}
