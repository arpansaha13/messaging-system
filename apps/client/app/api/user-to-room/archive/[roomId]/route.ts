import rfetch from '~api/utils/rfetch'

export async function PATCH(request: Request, { params }: { params: { roomId: number } }) {
  const res = await rfetch(`user-to-room/archive/${params.roomId}`, request)

  return res
}
