import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { stdout } from 'node:process'
import { createSpinner, createProgressBar } from './spinner.js'

const origIsTTY = stdout.isTTY
const origWrite = stdout.write
const origColumns = stdout.columns

const calls = {
  logs: [],
  writes: [],
  errors: [],
}

function capture(name, output) {
  calls[name].push(String(output))
}

beforeEach(() => {
  calls.logs = []
  calls.writes = []
  calls.errors = []
  stdout.write = (chunk) => {
    capture('writes', chunk)
    return true
  }
  console.log = (chunk) => capture('logs', chunk)
  console.error = (chunk) => capture('errors', chunk)
})

afterEach(() => {
  stdout.isTTY = origIsTTY
  stdout.write = origWrite
  stdout.columns = origColumns
})

describe('createSpinner', () => {
  describe('non-TTY', () => {
    beforeEach(() => {
      stdout.isTTY = false
    })

    it('start logs the text', () => {
      createSpinner('installing').start()
      assert.deepEqual(calls.logs, ['installing'])
    })

    it('succeed logs the message', () => {
      createSpinner('install').succeed('done')
      assert.deepEqual(calls.logs, ['done'])
    })

    it('succeed without message logs nothing', () => {
      createSpinner('install').succeed()
      assert.deepEqual(calls.logs, [])
    })

    it('fail logs the message via stderr', () => {
      createSpinner('install').fail('oops')
      assert.deepEqual(calls.errors, ['oops'])
    })
  })

  describe('TTY', () => {
    beforeEach(() => {
      stdout.isTTY = true
    })

    it('succeed writes a check mark and clears the interval', () => {
      const spinner = createSpinner('install')
      spinner.start()
      spinner.succeed()
      assert.ok(calls.writes[calls.writes.length - 1].includes('✓'))
    })

    it('succeed writes the message when provided', () => {
      const spinner = createSpinner('install')
      spinner.start()
      spinner.succeed('ready')
      assert.ok(calls.writes[calls.writes.length - 1].includes('ready'))
    })

    it('fail writes a cross mark', () => {
      const spinner = createSpinner('install')
      spinner.start()
      spinner.fail()
      assert.ok(calls.writes[calls.writes.length - 1].includes('✗'))
    })

    it('start writes the initial frame', () => {
      const spinner = createSpinner('install')
      spinner.start()
      spinner.succeed()
      assert.ok(calls.writes.includes('⠋ install'))
    })
  })
})

describe('createProgressBar', () => {
  describe('non-TTY', () => {
    beforeEach(() => {
      stdout.isTTY = false
    })

    it('start logs the text', () => {
      createProgressBar('downloading').start()
      assert.deepEqual(calls.logs, ['downloading'])
    })

    it('update is a no-op', () => {
      const bar = createProgressBar('download')
      bar.start()
      bar.update(50)
      assert.deepEqual(calls.logs, ['download'])
      assert.deepEqual(calls.writes, [])
    })

    it('succeed logs the message', () => {
      createProgressBar('download').succeed('finished')
      assert.deepEqual(calls.logs, ['finished'])
    })

    it('fail logs the message via stderr', () => {
      createProgressBar('download').fail('broke')
      assert.deepEqual(calls.errors, ['broke'])
    })
  })

  describe('TTY', () => {
    beforeEach(() => {
      stdout.isTTY = true
      stdout.columns = 80
    })

    it('update renders the bar with the correct percentage', () => {
      const bar = createProgressBar('download')
      bar.start()
      bar.update(50)
      const out = calls.writes[calls.writes.length - 1]
      assert.ok(out.includes('50%'))
      assert.ok(out.includes('download'))
    })

    it('update clears the interval by rendering a single frame', () => {
      const bar = createProgressBar('download')
      bar.start()
      bar.update(10)
      assert.ok(calls.writes.some((w) => w.includes('10%')))
    })

    it('succeed renders 100%', () => {
      const bar = createProgressBar('download')
      bar.start()
      bar.succeed()
      const out = calls.writes[calls.writes.length - 2]
      assert.ok(out.includes('100%'))
    })
  })
})
