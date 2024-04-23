import rfetch from '~api/utils/rfetch'

export async function DELETE(request: Request, { params }: { params: { roomId: number } }) {
  const res = await rfetch(`user-to-room/${params.roomId}/clear-chat`, request)

  return res
}
