import _response from '~api/utils/_response'

export async function GET(request: Request) {
  const res = await _response(request)

  return res
}
