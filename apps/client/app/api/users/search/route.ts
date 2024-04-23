import { type NextRequest } from 'next/server'
import rfetch from '~api/utils/rfetch'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchTerm = searchParams.get('search')
  const res = await rfetch(`users/search?search=${searchTerm}`, request)
  return res
}
