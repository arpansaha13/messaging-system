export default function rfetch(url: string, request: Request) {
  let newURL

  if (process.env.API_BASE_URL!.endsWith('/')) {
    newURL = process.env.API_BASE_URL! + url
  } else {
    newURL = process.env.API_BASE_URL! + '/' + url
  }

  // TypeError: Request with GET/HEAD method cannot have body.
  // Probably the "method" does not get copied while cloning a Request object

  const { cache, credentials, headers, integrity, method, mode, redirect, referrer, referrerPolicy, body } = request

  return fetch(newURL, {
    cache,
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
    duplex: 'half',
  })
}
