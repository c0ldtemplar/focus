import '@testing-library/jest-dom'
import * as React from 'react'

// React 19 compatibility: make act available globally
if (!React.act) {
  React.act = () => {}
}

// Mock IntersectionObserver for framer-motion
class MockIntersectionObserver {
  observe = () => null
  disconnect = () => {}
  unobserve = () => {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.IntersectionObserver = MockIntersectionObserver as any

// Mock ResizeObserver (sometimes used by framer-motion)
class MockResizeObserver {
  observe = () => null
  disconnect = () => {}
  unobserve = () => {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.ResizeObserver = MockResizeObserver as any