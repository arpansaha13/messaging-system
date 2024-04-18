import rfetch from '~api/utils/rfetch'

export async function POST(request: Request, { params }: { params: { hash: string } }) {
  const res = await rfetch(`auth/verification/${params.hash}`, request)

  return res
}
