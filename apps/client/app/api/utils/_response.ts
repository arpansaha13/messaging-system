import rfetch from '~api/utils/rfetch'

export default async function _response(request: Request) {
  const res = await rfetch(request)

  const { status, statusText } = res

  if (status === 204 || res.body === null) {
    return new Response(null, { status, statusText })
  }

  let data = await res.text()

  try {
    data = JSON.parse(data)
  } catch {
    return new Response(data, { status, statusText }) // text data
  }

  return Response.json(data, { status, statusText })
}
