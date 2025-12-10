import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { createMockFetch, resetMockData } from './mocks/api.mock.js'

// Save original fetch
const originalFetch = global.fetch

// Setup mock fetch before all tests
beforeEach(() => {
  // Reset mock data
  resetMockData()

  // Setup mock fetch
  global.fetch = createMockFetch()

  // Mock ResizeObserver (needed for Recharts)
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock crypto.subtle (needed for JWT signing in tests)
  if (!global.crypto) {
    global.crypto = {}
  }
  if (!global.crypto.subtle) {
    global.crypto.subtle = {
      importKey: vi.fn().mockResolvedValue({}),
      sign: vi.fn().mockResolvedValue(new Uint8Array(256))
    }
  }
})

// Restore after each test
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  global.fetch = originalFetch
})
