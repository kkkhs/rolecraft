export const WATCH_DEBOUNCE_MS = 300

export function createDebouncer(waitMs) {
  const timers = new Map()

  function schedule(key, callback) {
    cancel(key)

    const timer = setTimeout(async () => {
      timers.delete(key)
      await callback()
    }, waitMs)

    timers.set(key, timer)
  }

  function cancel(key) {
    const timer = timers.get(key)
    if (!timer) return false

    clearTimeout(timer)
    timers.delete(key)
    return true
  }

  function cancelAll() {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }
    timers.clear()
  }

  return { schedule, cancel, cancelAll }
}
