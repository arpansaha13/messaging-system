import _response from '~/utils/api/_response'

export async function POST(request: Request) {
  const res = await _response(request)

  return res
}
