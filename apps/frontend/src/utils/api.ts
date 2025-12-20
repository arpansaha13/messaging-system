export interface FormRequestOptions {
  body: string
  headers: Record<string, string>
}

type FormValue = string | number | boolean | null | undefined

export function buildFormRequest(body: Record<string, FormValue>): FormRequestOptions {
  const params = new URLSearchParams()

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    params.append(key, String(value))
  })

  return {
    body: params.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
}

