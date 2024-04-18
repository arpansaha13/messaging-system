export default function rfetch(url: string, request: Request) {
  if (process.env.API_BASE_URL!.endsWith('/')) {
    url = process.env.API_BASE_URL! + url
  } else {
    url = process.env.API_BASE_URL! + '/' + url
  }

  console.log(request.url)

  return fetch(url, request)
}
