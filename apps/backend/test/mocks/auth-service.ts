/**
 * Mock implementation of AuthService for testing
 * This replaces the actual gRPC calls with hardcoded test data
 */

export interface MockUser {
  user_id: number
  email: string
  username: string
  verified: boolean
  first_name?: string
  last_name?: string
  created_at?: Date
}

// In-memory store for mock users during tests
const mockUsers: Map<number, MockUser> = new Map()
let nextUserId = 1

export class MockAuthService {
  /**
   * Validate a session token with the auth system
   */
  static async validateSession(token: string): Promise<{ user_id: number; valid: boolean }> {
    // Mock: accept any token that exists in our mock users
    // In real tests, you'd parse JWT or use a specific format
    if (!token) {
      return { user_id: 0, valid: false }
    }

    // Extract user_id from token (format: "token_<user_id>")
    const matches = token.match(/token_(\d+)/)
    if (matches && matches[1]) {
      const userId = parseInt(matches[1])
      const user = mockUsers.get(userId)
      return {
        user_id: userId,
        valid: !!user,
      }
    }

    // Fallback: return first user (for simple tests)
    if (mockUsers.size > 0) {
      const firstUserId = mockUsers.keys().next().value
      return {
        user_id: firstUserId,
        valid: true,
      }
    }

    return { user_id: 0, valid: false }
  }

  /**
   * Logout a session with the auth system
   */
  static async logout(token: string): Promise<{ message: string }> {
    return { message: 'logout successful' }
  }

  /**
   * Create a mock user for testing
   */
  static createMockUser(overrides?: Partial<MockUser>): MockUser {
    const userId = nextUserId++
    const user: MockUser = {
      user_id: userId,
      email: `user${userId}@example.com`,
      username: `user${userId}`,
      verified: true,
      ...overrides,
    }
    mockUsers.set(userId, user)
    return user
  }

  /**
   * Generate a mock session token for a user
   */
  static generateMockToken(userId: number): string {
    return `token_${userId}`
  }

  /**
   * Clear all mock users (call in beforeEach)
   */
  static clearMockUsers(): void {
    mockUsers.clear()
    nextUserId = 1
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: number, firstName?: string, lastName?: string): Promise<MockUser> {
    const user = mockUsers.get(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    const updated: MockUser = {
      ...user,
      first_name: firstName || user.first_name,
      last_name: lastName || user.last_name,
    }

    mockUsers.set(userId, updated)
    return updated
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<MockUser> {
    for (const user of mockUsers.values()) {
      if (user.email === email) {
        return user
      }
    }
    throw new Error(`User with email ${email} not found`)
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: number): Promise<{ message: string }> {
    mockUsers.delete(userId)
    return { message: 'user deleted successfully' }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: number): Promise<MockUser> {
    const user = mockUsers.get(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    return user
  }
}
