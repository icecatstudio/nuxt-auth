import { describe, it, expect } from 'vitest'
import { isObject, getNestedProperty, setNestedProperty, isDefined, safeJsonParse } from '../../src/runtime/utils/helpers'

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject(Object.create(null))).toBe(true)
  })

  it('returns false for non-objects', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject(() => {})).toBe(false)
    expect(isObject(true)).toBe(false)
  })
})

describe('getNestedProperty', () => {
  it('gets top-level property', () => {
    expect(getNestedProperty({ name: 'Alice' }, 'name')).toBe('Alice')
  })

  it('gets nested property', () => {
    const obj = { data: { user: { name: 'Bob' } } }
    expect(getNestedProperty(obj, 'data.user.name')).toBe('Bob')
  })

  it('returns undefined for missing key', () => {
    expect(getNestedProperty({ a: 1 }, 'b')).toBeUndefined()
    expect(getNestedProperty({ a: { b: 1 } }, 'a.c')).toBeUndefined()
  })

  it('returns undefined for null/undefined input', () => {
    expect(getNestedProperty(null, 'a')).toBeUndefined()
    expect(getNestedProperty(undefined, 'a')).toBeUndefined()
  })

  it('returns undefined when intermediate path is not an object', () => {
    expect(getNestedProperty({ a: 'string' }, 'a.b')).toBeUndefined()
  })
})

describe('setNestedProperty', () => {
  it('sets top-level property', () => {
    const obj: Record<string, unknown> = {}
    setNestedProperty(obj, 'name', 'Alice')
    expect(obj.name).toBe('Alice')
  })

  it('sets nested property creating intermediate objects', () => {
    const obj: Record<string, unknown> = {}
    setNestedProperty(obj, 'data.user.name', 'Bob')
    expect((obj.data as Record<string, unknown> & { user: { name: string } }).user.name).toBe('Bob')
  })

  it('overwrites existing value', () => {
    const obj: Record<string, unknown> = { name: 'Alice' }
    setNestedProperty(obj, 'name', 'Bob')
    expect(obj.name).toBe('Bob')
  })

  it('does nothing with empty path', () => {
    const obj: Record<string, unknown> = { a: 1 }
    setNestedProperty(obj, '', 'value')
    expect(obj).toEqual({ a: 1 })
  })

  it('replaces non-object intermediate with object', () => {
    const obj: Record<string, unknown> = { a: 'string' }
    setNestedProperty(obj, 'a.b', 'value')
    expect((obj.a as Record<string, unknown>).b).toBe('value')
  })
})

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true)
    expect(isDefined('')).toBe(true)
    expect(isDefined(false)).toBe(true)
    expect(isDefined({})).toBe(true)
    expect(isDefined([])).toBe(true)
  })

  it('returns false for null and undefined', () => {
    expect(isDefined(null)).toBe(false)
    expect(isDefined(undefined)).toBe(false)
  })
})

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 })
    expect(safeJsonParse('"hello"')).toBe('hello')
    expect(safeJsonParse('42')).toBe(42)
    expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('returns null for invalid JSON by default', () => {
    expect(safeJsonParse('not json')).toBeNull()
    expect(safeJsonParse('')).toBeNull()
  })

  it('returns custom fallback for invalid JSON', () => {
    expect(safeJsonParse('bad', { default: true })).toEqual({ default: true })
    expect(safeJsonParse('bad', 'fallback')).toBe('fallback')
  })
})
