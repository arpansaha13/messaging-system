import * as grpc from '@grpc/grpc-js'
import { proto } from '../pb/auth'

// Type aliases for convenience
type AuthServiceClient = proto.AuthServiceClient
type SignupRequest = proto.SignupRequest
type SignupResponse = proto.SignupResponse
type VerifyOTPRequest = proto.VerifyOTPRequest
type VerifyOTPResponse = proto.VerifyOTPResponse
type LoginRequest = proto.LoginRequest
type LoginResponse = proto.LoginResponse
type ValidateSessionRequest = proto.ValidateSessionRequest
type ValidateSessionResponse = proto.ValidateSessionResponse
type LogoutRequest = proto.LogoutRequest
type LogoutResponse = proto.LogoutResponse
type GetUserRequest = proto.GetUserRequest
type GetUserResponse = proto.GetUserResponse
type GetUserByEmailRequest = proto.GetUserByEmailRequest
type GetUserByEmailResponse = proto.GetUserByEmailResponse
type DeleteUserRequest = proto.DeleteUserRequest
type DeleteUserResponse = proto.DeleteUserResponse

let authServiceClient: AuthServiceClient | null = null

/**
 * Initialize the gRPC connection to the auth service
 */
export function initializeAuthService(): AuthServiceClient {
  if (authServiceClient) {
    return authServiceClient
  }

  const credentials = grpc.ChannelCredentials.createInsecure()
  authServiceClient = new proto.AuthServiceClient(process.env.AUTH_SYSTEM_HOST, credentials)

  return authServiceClient
}

/**
 * Close the gRPC connection to the auth service
 */
export async function closeAuthService(): Promise<void> {
  if (!authServiceClient) {
    return
  }

  authServiceClient.close()
  authServiceClient = null
}

/**
 * Create gRPC metadata with optional authorization token
 */
function createMetadata(token?: string): grpc.Metadata {
  const metadata = new grpc.Metadata()
  if (token) {
    metadata.add('authorization', `Bearer ${token}`)
  }
  return metadata
}

/**
 * Promisify a gRPC unary call with optional token
 */
function promisifyGrpcCall<TReq, TRes>(
  call: (req: TReq, metadata: grpc.Metadata, callback: grpc.requestCallback<TRes>) => grpc.ClientUnaryCall,
  request: TReq,
  token?: string,
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const metadata = createMetadata(token)
    call(request, metadata, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response!)
      }
    })
  })
}

export class AuthService {
  /**
   * Signup a new user with the auth system
   */
  static async signup(email: string, password: string): Promise<SignupResponse> {
    const client = initializeAuthService()
    const request = new proto.SignupRequest({ email, password })
    return promisifyGrpcCall(client.Signup.bind(client), request)
  }

  /**
   * Verify OTP code with the auth system
   */
  static async verifyOTP(otpHash: string, code: string): Promise<VerifyOTPResponse> {
    const client = initializeAuthService()
    const request = new proto.VerifyOTPRequest({ otp_hash: otpHash, code })
    return promisifyGrpcCall(client.VerifyOTP.bind(client), request)
  }

  /**
   * Login a user with the auth system
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const client = initializeAuthService()
    const request = new proto.LoginRequest({ email, password })
    return promisifyGrpcCall(client.Login.bind(client), request)
  }

  /**
   * Validate a session token with the auth system
   */
  static async validateSession(token: string): Promise<ValidateSessionResponse> {
    const client = initializeAuthService()
    const request = new proto.ValidateSessionRequest()
    return promisifyGrpcCall(client.ValidateSession.bind(client), request, token)
  }

  /**
   * Logout a session with the auth system
   */
  static async logout(token: string): Promise<LogoutResponse> {
    const client = initializeAuthService()
    const request = new proto.LogoutRequest()
    return promisifyGrpcCall(client.Logout.bind(client), request, token)
  }

  /**
   * Get user by user ID
   */
  static async getUser(userId: number, token: string): Promise<GetUserResponse> {
    const client = initializeAuthService()
    const request = new proto.GetUserRequest({ user_id: userId })
    return promisifyGrpcCall(client.GetUser.bind(client), request, token)
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string, token: string): Promise<GetUserByEmailResponse> {
    const client = initializeAuthService()
    const request = new proto.GetUserByEmailRequest({ email })
    return promisifyGrpcCall(client.GetUserByEmail.bind(client), request, token)
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: number, token: string): Promise<DeleteUserResponse> {
    const client = initializeAuthService()
    const request = new proto.DeleteUserRequest({ user_id: userId })
    return promisifyGrpcCall(client.DeleteUser.bind(client), request, token)
  }
}
