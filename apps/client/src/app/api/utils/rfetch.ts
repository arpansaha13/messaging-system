export default function rfetch(request: Request) {
  const url = new URL(request.url)
  const newURL = new URL(url.pathname + url.search, process.env.API_BASE_URL!).toString()

  // TypeError: Request with GET/HEAD method cannot have body.
  // Probably the "method" does not get copied while cloning a Request object

  const { credentials, headers, integrity, method, mode, redirect, referrer, referrerPolicy, body } = request

  return fetch(newURL, {
    credentials,
    headers,
    integrity,
    method,
    mode,
    redirect,
    referrer,
    referrerPolicy,
    body,

    // TypeError: RequestInit: duplex option is required when sending a body.
    // @ts-ignore
    duplex: 'half',

    // Disable all caching for now
    cache: 'no-store',
  })
}
