const PREFIX = 'agrosight-cache:'

export function getCached<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw) as { at: number; data: T }
    if (Date.now() - at > ttlMs) return null
    return data
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    // quota exceeded — ignore
  }
}
