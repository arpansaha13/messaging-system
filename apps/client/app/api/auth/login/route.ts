import _response from '~api/utils/_response'

export async function POST(request: Request) {
  const res = await _response(request)

  return res
}
