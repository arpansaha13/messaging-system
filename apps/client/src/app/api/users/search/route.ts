import _response from '~/utils/api/_response'

export async function GET(request: Request) {
  const res = await _response(request)
  return res
}
