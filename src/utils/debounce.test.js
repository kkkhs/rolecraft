import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createDebouncer } from './debounce.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('createDebouncer', () => {
  it('runs only the latest callback scheduled for a key', async () => {
    const debouncer = createDebouncer(10)
    const calls = []

    debouncer.schedule('skill', () => calls.push('first'))
    debouncer.schedule('skill', () => calls.push('second'))

    await wait(30)

    assert.deepEqual(calls, ['second'])
  })

  it('tracks keys independently', async () => {
    const debouncer = createDebouncer(10)
    const calls = []

    debouncer.schedule('alpha', () => calls.push('alpha'))
    debouncer.schedule('beta', () => calls.push('beta'))

    await wait(30)

    assert.deepEqual(calls.sort(), ['alpha', 'beta'])
  })

  it('cancels pending callbacks', async () => {
    const debouncer = createDebouncer(10)
    let called = false

    debouncer.schedule('skill', () => {
      called = true
    })
    assert.equal(debouncer.cancel('skill'), true)
    assert.equal(debouncer.cancel('missing'), false)

    await wait(30)

    assert.equal(called, false)
  })

  it('cancels every pending callback', async () => {
    const debouncer = createDebouncer(10)
    const calls = []

    debouncer.schedule('alpha', () => calls.push('alpha'))
    debouncer.schedule('beta', () => calls.push('beta'))
    debouncer.cancelAll()

    await wait(30)

    assert.deepEqual(calls, [])
  })

  it('handles rejected async callbacks', async () => {
    const debouncer = createDebouncer(10)
    let unhandled = false
    const onUnhandledRejection = () => {
      unhandled = true
    }

    process.once('unhandledRejection', onUnhandledRejection)
    try {
      debouncer.schedule('skill', async () => {
        throw new Error('callback failed')
      })

      await wait(30)

      assert.equal(unhandled, false)
    } finally {
      process.removeListener('unhandledRejection', onUnhandledRejection)
    }
  })
})
