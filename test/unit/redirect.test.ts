import { describe, it, expect, vi, beforeEach } from 'vitest'
import { navigateTo } from '#imports'
import { handleRedirect } from '../../src/runtime/utils/redirect'

vi.mock('#imports', () => ({
  navigateTo: vi.fn(),
}))

const mockNavigateTo = vi.mocked(navigateTo)

describe('handleRedirect', () => {
  beforeEach(() => {
    mockNavigateTo.mockClear()
  })

  it('does nothing when no config provided', () => {
    handleRedirect()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does nothing for undefined', () => {
    handleRedirect(undefined)
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('does nothing for empty string', () => {
    handleRedirect('')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('navigates to string URL as internal redirect', () => {
    handleRedirect('/login')
    expect(mockNavigateTo).toHaveBeenCalledWith('/login', { external: false })
  })

  it('navigates with RedirectTarget object', () => {
    handleRedirect({ url: '/dashboard', external: false })
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard', { external: false })
  })

  it('navigates externally when external is true', () => {
    handleRedirect({ url: 'https://example.com', external: true })
    expect(mockNavigateTo).toHaveBeenCalledWith('https://example.com', { external: true })
  })

  it('defaults external to undefined for RedirectTarget without explicit external', () => {
    handleRedirect({ url: '/home' })
    expect(mockNavigateTo).toHaveBeenCalledWith('/home', { external: undefined })
  })

  it('handles root path', () => {
    handleRedirect('/')
    expect(mockNavigateTo).toHaveBeenCalledWith('/', { external: false })
  })

  it('handles path with query params', () => {
    handleRedirect('/login?redirect=/dashboard')
    expect(mockNavigateTo).toHaveBeenCalledWith('/login?redirect=/dashboard', { external: false })
  })

  it('handles path with hash', () => {
    handleRedirect('/page#section')
    expect(mockNavigateTo).toHaveBeenCalledWith('/page#section', { external: false })
  })
})
