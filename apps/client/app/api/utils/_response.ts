import rfetch from '~api/utils/rfetch'

/**
 * Fires a fetch request and returns a response.
 * Use this overload if the body does not need to be modified.
 */
async function _response(request: Request): Promise<Response>;

/**
 * Returns a response object with the provided body.
 * Use this overload if the body needs to be modified.
 */
async function _response(res: Response, body: any): Promise<Response>;

async function _response(requestOrRes: Request | Response, body?: any): Promise<Response> {
  if (requestOrRes instanceof Request) {
    const res = await rfetch(requestOrRes)
    const resBody = await getBody(res)
    return createResponse(res, resBody)
  }

  if (requestOrRes instanceof Response && body !== undefined) {
    return createResponse(requestOrRes, body)
  }

  throw new Error("Unsupported parameters in _response().")
}

export default _response

async function getBody(res: Response) {
  if (res.status === 204 || res.body === null) {
    return null
  }

  let body = await res.text()

  try {
    body = JSON.parse(body)
  } finally {
    return body // text data
  }
}

function createResponse(res: Response, body: any): Response {
  const { status, statusText } = res
  const setCookie = res.headers.getSetCookie()

  const responseInit: ResponseInit = { status, statusText }

  if (setCookie.length > 0) {
    const headers = new Headers()

    for (const cookie of setCookie) {
      headers.append('Set-Cookie', cookie)
    }

    responseInit.headers = headers
  }

  if (body === null || typeof body === 'string') {
    return new Response(body, responseInit)
  }

  return Response.json(body, responseInit)
}
