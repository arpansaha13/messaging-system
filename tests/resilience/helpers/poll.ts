export interface PollOptions {
  timeoutMs?: number
  intervalMs?: number
  description?: string
}

export async function poll<T>(
  fn: () => Promise<T> | T,
  predicate: (value: T) => boolean,
  options: PollOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 90_000
  const intervalMs = options.intervalMs ?? 1_000
  const description = options.description ?? 'condition'
  const startedAt = Date.now()

  let lastValue: T
  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await fn()
    if (predicate(lastValue)) {
      return lastValue
    }
    await sleep(intervalMs)
  }

  throw new Error(`Timed out waiting for ${description} after ${timeoutMs}ms`)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
