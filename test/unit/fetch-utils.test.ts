import { describe, it, expect } from 'vitest'
import { toPlainHeaders, isFetchError } from '../../src/runtime/utils/fetch-helpers'

describe('toPlainHeaders', () => {
  it('returns empty object for undefined', () => {
    expect(toPlainHeaders(undefined)).toEqual({})
  })

  it('converts Headers instance to plain object', () => {
    const headers = new Headers()
    headers.set('content-type', 'application/json')
    headers.set('authorization', 'Bearer token')
    const result = toPlainHeaders(headers)
    expect(result['content-type']).toBe('application/json')
    expect(result['authorization']).toBe('Bearer token')
  })

  it('converts array of tuples to plain object', () => {
    const headers: [string, string][] = [
      ['content-type', 'application/json'],
      ['x-custom', 'value'],
    ]
    expect(toPlainHeaders(headers)).toEqual({
      'content-type': 'application/json',
      'x-custom': 'value',
    })
  })

  it('clones plain object', () => {
    const headers = { 'content-type': 'text/plain' }
    const result = toPlainHeaders(headers)
    expect(result).toEqual({ 'content-type': 'text/plain' })
    expect(result).not.toBe(headers)
  })
})

describe('isFetchError', () => {
  it('returns true for matching status', () => {
    const error = { response: { status: 401 } }
    expect(isFetchError(error, 401)).toBe(true)
  })

  it('returns false for non-matching status', () => {
    const error = { response: { status: 403 } }
    expect(isFetchError(error, 401)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isFetchError(null, 401)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isFetchError(undefined, 401)).toBe(false)
  })

  it('returns false for Error without response', () => {
    expect(isFetchError(new Error('test'), 401)).toBe(false)
  })

  it('returns false for object without response', () => {
    expect(isFetchError({ message: 'error' }, 401)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isFetchError('string', 401)).toBe(false)
    expect(isFetchError(42, 401)).toBe(false)
  })
})
