import '@testing-library/jest-dom'

// Mock IntersectionObserver for framer-motion
class MockIntersectionObserver {
  observe = () => null
  disconnect = () => {}
  unobserve = () => {}
}

global.IntersectionObserver = MockIntersectionObserver as any

// Mock ResizeObserver (sometimes used by framer-motion)
class MockResizeObserver {
  observe = () => null
  disconnect = () => {}
  unobserve = () => {}
}

global.ResizeObserver = MockResizeObserver as any