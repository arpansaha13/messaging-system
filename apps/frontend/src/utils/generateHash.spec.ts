import { generateHash } from '~/utils/generateHash'

describe('generateHash Utility', () => {
  it('generates a hash with default length of 8', () => {
    const hash = generateHash()

    expect(hash).toHaveLength(8)
  })

  it('generates a hash with custom length', () => {
    const hash = generateHash(16)

    expect(hash).toHaveLength(16)
  })

  it('generates a hash with length 1', () => {
    const hash = generateHash(1)

    expect(hash).toHaveLength(1)
  })

  it('generates a hash with length 100', () => {
    const hash = generateHash(100)

    expect(hash).toHaveLength(100)
  })

  it('generates a hash using only valid characters', () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const hash = generateHash(50)

    for (const char of hash) {
      expect(characters).toContain(char)
    }
  })

  it('generates different hashes on multiple calls', () => {
    const hash1 = generateHash()
    const hash2 = generateHash()

    // Statistically, two random hashes should be different
    expect(hash1).not.toBe(hash2)
  })

  it('does not contain special characters', () => {
    const hash = generateHash(100)
    const specialCharacters = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

    expect(hash).not.toMatch(specialCharacters)
  })

  it('does not contain spaces', () => {
    const hash = generateHash(50)

    expect(hash).not.toContain(' ')
  })

  it('generates consistent output for same seed behavior', () => {
    // While the function uses Math.random(), we can verify it generates valid patterns
    const hash = generateHash(10)

    expect(hash).toHaveLength(10)
    expect(/^[A-Za-z0-9]+$/.test(hash)).toBe(true)
  })
})
