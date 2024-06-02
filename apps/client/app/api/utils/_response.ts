import rfetch from '~api/utils/rfetch'

interface Options {
  status: number
  statusText: string
  data: any
  setCookie: string[]
}

export default async function _response(request: Request) {
  const res = await rfetch(request)

  const { status, statusText } = res
  const setCookie = res.headers.getSetCookie()

  if (status === 204 || res.body === null) {
    return createResponse({ data: null, status, statusText, setCookie })
  }

  let data = await res.text()

  try {
    data = JSON.parse(data)
  } catch {
    return createResponse({ data, status, statusText, setCookie }) // text data
  }

  return createResponse({ data, status, statusText, setCookie })
}

function createResponse(options: Options): Response {
  const { data, setCookie, status, statusText } = options

  const responseInit: ResponseInit = { status, statusText }

  if (setCookie.length > 0) {
    const headers = new Headers()

    for (const cookie of setCookie) {
      headers.append('Set-Cookie', cookie)
    }

    responseInit.headers = headers
  }

  if (data === null || typeof data === 'string') {
    return new Response(data, responseInit)
  }

  return Response.json(data, responseInit)
}
