import path from 'node:path'
import { fileURLToPath } from 'node:url'
import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import { AUTH_GRPC_ADDRESS } from './config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../../')
const protoPath = path.join(repoRoot, 'apps/backend/proto/auth.proto')

const packageDef = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const loaded = grpc.loadPackageDefinition(packageDef) as {
  proto: {
    AuthService: new (address: string, creds: grpc.ChannelCredentials) => AuthServiceClient
  }
}

export interface AuthServiceClient extends grpc.Client {
  Login: (
    req: { email: string; password: string },
    callback: (err: grpc.ServiceError | null, res: { session_token: string }) => void,
  ) => void
  ValidateSession: (
    req: Record<string, never>,
    meta: grpc.Metadata,
    callback: (err: grpc.ServiceError | null, res: { user_id: string; valid: boolean }) => void,
  ) => void
  LiveZ: (
    req: Record<string, never>,
    callback: (err: grpc.ServiceError | null, res: Record<string, never>) => void,
  ) => void
}

export function createAuthClient(): AuthServiceClient {
  return new loaded.proto.AuthService(AUTH_GRPC_ADDRESS, grpc.credentials.createInsecure())
}

export async function grpcLogin(client: AuthServiceClient, email: string, password: string): Promise<string> {
  const res = await unary<{ email: string; password: string }, { session_token: string }>(client, 'Login', {
    email,
    password,
  })
  return res.session_token
}

export async function grpcValidateSession(client: AuthServiceClient, sessionToken: string): Promise<boolean> {
  const metadata = new grpc.Metadata()
  metadata.set('authorization', `Bearer ${sessionToken}`)
  const res = await unary<Record<string, never>, { valid: boolean }>(client, 'ValidateSession', {}, metadata)
  return Boolean(res.valid)
}

export async function grpcLiveZ(client: AuthServiceClient): Promise<void> {
  await unary<Record<string, never>, Record<string, never>>(client, 'LiveZ', {})
}

function unary<TReq, TRes>(
  client: AuthServiceClient,
  method: keyof AuthServiceClient,
  req: TReq,
  metadata?: grpc.Metadata,
  timeoutMs = 8_000,
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const options = { deadline: new Date(Date.now() + timeoutMs) }
    const callback = (err: grpc.ServiceError | null, res: TRes) => {
      if (err) return reject(err)
      resolve(res)
    }
    if (metadata) {
      ;(client[method] as any)(req, metadata, options, callback)
      return
    }
    ;(client[method] as any)(req, options, callback)
  })
}
