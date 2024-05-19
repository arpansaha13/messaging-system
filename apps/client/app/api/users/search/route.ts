import { type NextRequest } from 'next/server'
import rfetch from '~api/utils/rfetch'

export async function GET(request: NextRequest) {
  const res = await rfetch(request)
  return res
}
