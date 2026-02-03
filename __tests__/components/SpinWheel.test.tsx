import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, style, ...props }: React.PropsWithChildren<{ animate?: unknown; style?: React.CSSProperties }>) => (
      <div style={style} {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
  }),
}))

interface WheelSegment {
  id: string
  label: string
  color: string
  weight: number
  value: number | string
}

interface SpinWheelProps {
  segments: WheelSegment[]
  onResult: (segment: WheelSegment) => void
  spinDuration?: number
  disabled?: boolean
}

// placeholder component - replace with actual import
const SpinWheel: React.FC<SpinWheelProps> = ({
  segments,
  onResult,
  spinDuration = 3000,
  disabled = false,
}) => {
  const [spinning, setSpinning] = React.useState(false)
  const [rotation, setRotation] = React.useState(0)
  const [selectedSegment, setSelectedSegment] = React.useState<WheelSegment | null>(null)
  const [showResult, setShowResult] = React.useState(false)

  const selectWeightedRandom = (): WheelSegment => {
    const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0)
    let random = Math.random() * totalWeight

    for (const segment of segments) {
      random -= segment.weight
      if (random <= 0) {
        return segment
      }
    }
    return segments[segments.length - 1]
  }

  const calculateRotationForSegment = (segment: WheelSegment): number => {
    const segmentIndex = segments.findIndex((s) => s.id === segment.id)
    const segmentAngle = 360 / segments.length
    const targetAngle = segmentIndex * segmentAngle + segmentAngle / 2
    // add multiple rotations for effect
    return 360 * 5 + (360 - targetAngle)
  }

  const handleSpin = async () => {
    if (spinning || disabled) return

    setSpinning(true)
    setShowResult(false)
    setSelectedSegment(null)

    const result = selectWeightedRandom()
    const targetRotation = calculateRotationForSegment(result)
    setRotation((prev) => prev + targetRotation)

    // wait for animation
    await new Promise((resolve) => setTimeout(resolve, spinDuration))

    setSelectedSegment(result)
    setShowResult(true)
    setSpinning(false)
    onResult(result)
  }

  const segmentAngle = 360 / segments.length

  return (
    <div data-testid="spin-wheel" className="spin-wheel">
      <h2>Spin the Wheel!</h2>

      <div data-testid="wheel-container" className="wheel-container">
        <div
          data-testid="wheel"
          className={`wheel ${spinning ? 'spinning' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              data-testid={`segment-${segment.id}`}
              className="segment"
              style={{
                backgroundColor: segment.color,
                transform: `rotate(${index * segmentAngle}deg)`,
              }}
            >
              <span className="segment-label">{segment.label}</span>
            </div>
          ))}
        </div>
        <div data-testid="wheel-pointer" className="wheel-pointer">
          ^
        </div>
      </div>

      {showResult && selectedSegment && (
        <div data-testid="result-display" className="result-display">
          <p data-testid="result-text">
            You got: <strong>{selectedSegment.label}</strong>
          </p>
          <p data-testid="result-value">Value: {selectedSegment.value}</p>
        </div>
      )}

      <button
        data-testid="spin-button"
        onClick={handleSpin}
        disabled={spinning || disabled}
        className="spin-button"
      >
        {spinning ? (
          <span data-testid="spinning-indicator">Spinning...</span>
        ) : (
          'Spin!'
        )}
      </button>

      {disabled && !spinning && (
        <p data-testid="disabled-message">Wheel is currently disabled</p>
      )}

      <div data-testid="segment-list" className="segment-list">
        <h3>Prizes</h3>
        <ul>
          {segments.map((segment) => (
            <li key={segment.id} data-testid={`prize-${segment.id}`}>
              {segment.label} - {segment.value}
              <span className="weight-indicator"> (Weight: {segment.weight})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

describe('SpinWheel', () => {
  const mockSegments: WheelSegment[] = [
    { id: 'coins-10', label: '10 Coins', color: '#FFD700', weight: 40, value: 10 },
    { id: 'coins-25', label: '25 Coins', color: '#C0C0C0', weight: 30, value: 25 },
    { id: 'coins-50', label: '50 Coins', color: '#CD7F32', weight: 20, value: 50 },
    { id: 'jackpot', label: 'Jackpot!', color: '#FF0000', weight: 10, value: 100 },
  ]

  const mockOnResult = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    mockOnResult.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('render states', () => {
    it('renders the spin wheel', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      expect(screen.getByTestId('spin-wheel')).toBeInTheDocument()
      expect(screen.getByText('Spin the Wheel!')).toBeInTheDocument()
    })

    it('renders all segments', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      mockSegments.forEach((segment) => {
        expect(screen.getByTestId(`segment-${segment.id}`)).toBeInTheDocument()
      })
    })

    it('renders wheel pointer', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      expect(screen.getByTestId('wheel-pointer')).toBeInTheDocument()
    })

    it('renders spin button', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      expect(screen.getByTestId('spin-button')).toBeInTheDocument()
      expect(screen.getByTestId('spin-button')).toHaveTextContent('Spin!')
    })

    it('renders segment list with prizes', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      expect(screen.getByTestId('segment-list')).toBeInTheDocument()
      mockSegments.forEach((segment) => {
        expect(screen.getByTestId(`prize-${segment.id}`)).toBeInTheDocument()
        expect(screen.getByTestId(`prize-${segment.id}`)).toHaveTextContent(segment.label)
      })
    })

    it('shows disabled message when disabled', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} disabled={true} />)

      expect(screen.getByTestId('disabled-message')).toBeInTheDocument()
      expect(screen.getByText(/currently disabled/i)).toBeInTheDocument()
    })

    it('disables spin button when disabled prop is true', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} disabled={true} />)

      expect(screen.getByTestId('spin-button')).toBeDisabled()
    })
  })

  describe('spin animation', () => {
    it('shows spinning indicator during spin', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.getByTestId('spinning-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('spinning-indicator')).toHaveTextContent('Spinning...')
    })

    it('disables spin button during animation', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.getByTestId('spin-button')).toBeDisabled()
    })

    it('adds spinning class to wheel during spin', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.getByTestId('wheel')).toHaveClass('spinning')
    })

    it('enables spin button after animation completes', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('spin-button')).not.toBeDisabled()
      })
    })

    it('updates wheel rotation', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      const wheel = screen.getByTestId('wheel')
      const initialTransform = wheel.style.transform

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(wheel.style.transform).not.toBe(initialTransform)
    })
  })

  describe('result callback', () => {
    it('calls onResult when spin completes', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(1)
      })
    })

    it('passes selected segment to onResult', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            label: expect.any(String),
            value: expect.anything(),
          })
        )
      })
    })

    it('displays result after spin', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('result-display')).toBeInTheDocument()
        expect(screen.getByTestId('result-text')).toBeInTheDocument()
        expect(screen.getByTestId('result-value')).toBeInTheDocument()
      })
    })
  })

  describe('weighted selection', () => {
    it('selects segment based on weights', async () => {
      // mock random to return specific value
      const mockRandom = jest.spyOn(Math, 'random')
      // total weight is 100, return 0.95 to get jackpot (last 10%)
      mockRandom.mockReturnValue(0.95)

      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'jackpot' })
        )
      })

      mockRandom.mockRestore()
    })

    it('selects higher weight segments more often with low random', async () => {
      const mockRandom = jest.spyOn(Math, 'random')
      // return 0.1 which should select first segment (40% weight)
      mockRandom.mockReturnValue(0.1)

      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'coins-10' })
        )
      })

      mockRandom.mockRestore()
    })

    it('respects segment weights distribution', async () => {
      const mockRandom = jest.spyOn(Math, 'random')
      // 0.5 * 100 = 50, should fall in second segment (40 + 30 = 70 threshold)
      mockRandom.mockReturnValue(0.5)

      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'coins-25' })
        )
      })

      mockRandom.mockRestore()
    })
  })

  describe('custom spin duration', () => {
    it('uses default spin duration of 3000ms', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      // should still be spinning at 2000ms
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      expect(screen.getByTestId('spinning-indicator')).toBeInTheDocument()

      // should complete at 3000ms
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        expect(screen.queryByTestId('spinning-indicator')).not.toBeInTheDocument()
      })
    })

    it('respects custom spin duration', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={500} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('multiple spins', () => {
    it('allows multiple spins in sequence', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      // first spin
      fireEvent.click(screen.getByTestId('spin-button'))
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // second spin
      fireEvent.click(screen.getByTestId('spin-button'))
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockOnResult).toHaveBeenCalledTimes(2)
    })

    it('hides previous result when new spin starts', async () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} spinDuration={1000} />)

      // first spin
      fireEvent.click(screen.getByTestId('spin-button'))
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('result-display')).toBeInTheDocument()
      })

      // second spin
      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.queryByTestId('result-display')).not.toBeInTheDocument()
    })
  })

  describe('segment styling', () => {
    it('applies segment colors', () => {
      render(<SpinWheel segments={mockSegments} onResult={mockOnResult} />)

      const firstSegment = screen.getByTestId('segment-coins-10')
      expect(firstSegment).toHaveStyle({ backgroundColor: '#FFD700' })
    })

    it('calculates correct rotation for segments', () => {
      const twoSegments: WheelSegment[] = [
        { id: 'a', label: 'A', color: '#FFF', weight: 50, value: 1 },
        { id: 'b', label: 'B', color: '#000', weight: 50, value: 2 },
      ]

      render(<SpinWheel segments={twoSegments} onResult={mockOnResult} />)

      const firstSegment = screen.getByTestId('segment-a')
      const secondSegment = screen.getByTestId('segment-b')

      expect(firstSegment).toHaveStyle({ transform: 'rotate(0deg)' })
      expect(secondSegment).toHaveStyle({ transform: 'rotate(180deg)' })
    })
  })
})
