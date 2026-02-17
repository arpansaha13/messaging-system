import { MessageStatus } from '@shared/constants'

describe('isUnread Utility', () => {
  it('returns false when latestMsg is null', () => {
    const result = isUnread(1, null as any)

    expect(result).toBe(false)
  })

  it('returns false when latestMsg is undefined', () => {
    const result = isUnread(1, undefined as any)

    expect(result).toBe(false)
  })

  it('returns false when auth user is the sender', () => {
    const latestMsg = {
      senderId: 1,
      status: MessageStatus.SENT,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(false)
  })

  it('returns false when auth user is sender with SENT status', () => {
    const latestMsg = {
      senderId: 5,
      status: MessageStatus.SENT,
    } as any

    const result = isUnread(5, latestMsg)

    expect(result).toBe(false)
  })

  it('returns false when message status is READ', () => {
    const latestMsg = {
      senderId: 2,
      status: MessageStatus.READ,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(false)
  })

  it('returns true when auth user is not sender and status is SENT', () => {
    const latestMsg = {
      senderId: 2,
      status: MessageStatus.SENT,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(true)
  })

  it('returns true when auth user is not sender and status is SENDING', () => {
    const latestMsg = {
      senderId: 2,
      status: MessageStatus.SENDING,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(true)
  })

  it('returns true when auth user is not sender and status is DELIVERED', () => {
    const latestMsg = {
      senderId: 2,
      status: MessageStatus.DELIVERED,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(true)
  })

  it('returns false when auth user is not sender but status is READ', () => {
    const latestMsg = {
      senderId: 2,
      status: MessageStatus.READ,
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(false)
  })

  it('correctly identifies unread for different user IDs', () => {
    const latestMsg = {
      senderId: 100,
      status: MessageStatus.SENT,
    } as any

    expect(isUnread(1, latestMsg)).toBe(true)
    expect(isUnread(100, latestMsg)).toBe(false)
    expect(isUnread(999, latestMsg)).toBe(true)
  })

  it('handles message with all properties', () => {
    const latestMsg = {
      id: 1,
      senderId: 2,
      status: MessageStatus.SENT,
      content: 'Hello',
      createdAt: '2024-01-15T10:30:00Z',
    } as any

    const result = isUnread(1, latestMsg)

    expect(result).toBe(true)
  })
})
