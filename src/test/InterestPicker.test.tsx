import { render, screen, fireEvent } from '@testing-library/react'
import { InterestPicker } from '../components/InterestPicker'
import { Interest } from '../types'

const mockInterests: Interest[] = [
  { id: '1', name: 'Music', icon: 'music', active: true },
  { id: '2', name: 'Food', icon: 'utensils', active: false },
]

const mockOnToggle = vi.fn()

describe('InterestPicker', () => {
  it('renders interests correctly', () => {
    render(<InterestPicker interests={mockInterests} onToggle={mockOnToggle} />)

    expect(screen.getByText('Music')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('calls onToggle when button is clicked', () => {
    render(<InterestPicker interests={mockInterests} onToggle={mockOnToggle} />)

    const musicButton = screen.getByRole('button', { name: /Music/ })
    fireEvent.click(musicButton)

    expect(mockOnToggle).toHaveBeenCalledWith('1')
  })

  it('shows correct aria-pressed state', () => {
    render(<InterestPicker interests={mockInterests} onToggle={mockOnToggle} />)

    const musicButton = screen.getByRole('button', { name: /Music/ })
    const foodButton = screen.getByRole('button', { name: /Food/ })

    expect(musicButton).toHaveAttribute('aria-pressed', 'true')
    expect(foodButton).toHaveAttribute('aria-pressed', 'false')
  })
})