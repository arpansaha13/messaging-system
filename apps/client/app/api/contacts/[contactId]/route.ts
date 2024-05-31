import rfetch from '~api/utils/rfetch'

export async function PATCH(request: Request) {
  const res = await rfetch(request)

  return res
}

export async function DELETE(request: Request) {
  const res = await rfetch(request)

  return res
}
