import rfetch from '~api/utils/rfetch'

export async function GET(request: Request, { params }: { params: { roomId: number } }) {
  const res = await rfetch(`rooms/${params.roomId}/messages`, request)

  return res
}
