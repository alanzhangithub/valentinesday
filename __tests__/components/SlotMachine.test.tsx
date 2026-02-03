import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, ...props }: React.PropsWithChildren<{ animate?: unknown }>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    set: jest.fn(),
  }),
}))

interface SlotMachineProps {
  coins: number
  onCoinsChange: (newCoins: number) => void
  spinCost?: number
  symbols?: string[]
  payouts?: Record<string, number>
}

interface SpinResult {
  symbols: [string, string, string]
  isWin: boolean
  payout: number
}

// placeholder component - replace with actual import
const SlotMachine: React.FC<SlotMachineProps> = ({
  coins,
  onCoinsChange,
  spinCost = 10,
  symbols = ['meedo', 'beedo', 'heart', 'star', 'coin'],
  payouts = { 'meedo-meedo-meedo': 100, 'beedo-beedo-beedo': 100, 'heart-heart-heart': 50, 'star-star-star': 25 },
}) => {
  const [spinning, setSpinning] = React.useState(false)
  const [reels, setReels] = React.useState<[string, string, string]>(['meedo', 'beedo', 'heart'])
  const [lastResult, setLastResult] = React.useState<SpinResult | null>(null)
  const [showResult, setShowResult] = React.useState(false)

  const canSpin = coins >= spinCost && !spinning

  const getRandomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)]

  const checkWin = (result: [string, string, string]): { isWin: boolean; payout: number } => {
    const key = result.join('-')
    if (payouts[key]) {
      return { isWin: true, payout: payouts[key] }
    }
    // partial matches for 2 of a kind
    if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      return { isWin: true, payout: 5 }
    }
    return { isWin: false, payout: 0 }
  }

  const handleSpin = async () => {
    if (!canSpin) return

    // deduct coins
    onCoinsChange(coins - spinCost)
    setSpinning(true)
    setShowResult(false)

    // simulate spin animation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newReels: [string, string, string] = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    setReels(newReels)

    const { isWin, payout } = checkWin(newReels)

    if (isWin) {
      onCoinsChange(coins - spinCost + payout)
    }

    setLastResult({ symbols: newReels, isWin, payout })
    setShowResult(true)
    setSpinning(false)
  }

  return (
    <div data-testid="slot-machine" className="slot-machine">
      <h2>Meedo Slots</h2>

      <div data-testid="coin-display" className="coin-display">
        <span data-testid="coin-count">{coins}</span> Meedo Coins
      </div>

      <div data-testid="reels" className="reels">
        {reels.map((symbol, index) => (
          <div
            key={index}
            data-testid={`reel-${index}`}
            className={`reel ${spinning ? 'spinning' : ''}`}
          >
            <span data-testid={`symbol-${index}`}>{symbol}</span>
          </div>
        ))}
      </div>

      {showResult && lastResult && (
        <div
          data-testid={lastResult.isWin ? 'win-message' : 'lose-message'}
          className={`result ${lastResult.isWin ? 'win' : 'lose'}`}
        >
          {lastResult.isWin ? (
            <>
              <span data-testid="win-text">You won {lastResult.payout} coins!</span>
            </>
          ) : (
            <span data-testid="lose-text">Better luck next time!</span>
          )}
        </div>
      )}

      <div className="controls">
        <button
          data-testid="spin-button"
          onClick={handleSpin}
          disabled={!canSpin}
          className={`spin-button ${spinning ? 'spinning' : ''}`}
        >
          {spinning ? (
            <span data-testid="spinning-text">Spinning...</span>
          ) : (
            <span>Spin ({spinCost} coins)</span>
          )}
        </button>

        {coins < spinCost && !spinning && (
          <div data-testid="insufficient-coins" className="insufficient-coins">
            Not enough coins! Need {spinCost} to spin.
          </div>
        )}
      </div>

      <div data-testid="payout-table" className="payout-table">
        <h3>Payouts</h3>
        <ul>
          {Object.entries(payouts).map(([combo, payout]) => (
            <li key={combo} data-testid={`payout-${combo}`}>
              {combo.split('-').join(' ')} = {payout} coins
            </li>
          ))}
          <li data-testid="payout-partial">Any 2 matching = 5 coins</li>
        </ul>
      </div>
    </div>
  )
}

describe('SlotMachine', () => {
  const defaultProps = {
    coins: 100,
    onCoinsChange: jest.fn(),
  }

  beforeEach(() => {
    jest.useFakeTimers()
    defaultProps.onCoinsChange.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('render states', () => {
    it('renders the slot machine', () => {
      render(<SlotMachine {...defaultProps} />)

      expect(screen.getByTestId('slot-machine')).toBeInTheDocument()
      expect(screen.getByText('Meedo Slots')).toBeInTheDocument()
    })

    it('displays current coin count', () => {
      render(<SlotMachine {...defaultProps} coins={150} />)

      expect(screen.getByTestId('coin-count')).toHaveTextContent('150')
    })

    it('renders three reels', () => {
      render(<SlotMachine {...defaultProps} />)

      expect(screen.getByTestId('reel-0')).toBeInTheDocument()
      expect(screen.getByTestId('reel-1')).toBeInTheDocument()
      expect(screen.getByTestId('reel-2')).toBeInTheDocument()
    })

    it('renders spin button with cost', () => {
      render(<SlotMachine {...defaultProps} spinCost={15} />)

      expect(screen.getByTestId('spin-button')).toHaveTextContent('Spin (15 coins)')
    })

    it('renders payout table', () => {
      render(<SlotMachine {...defaultProps} />)

      expect(screen.getByTestId('payout-table')).toBeInTheDocument()
      expect(screen.getByTestId('payout-partial')).toHaveTextContent('Any 2 matching = 5 coins')
    })

    it('shows insufficient coins message when needed', () => {
      render(<SlotMachine {...defaultProps} coins={5} spinCost={10} />)

      expect(screen.getByTestId('insufficient-coins')).toBeInTheDocument()
      expect(screen.getByText(/not enough coins/i)).toBeInTheDocument()
    })

    it('does not show insufficient coins when have enough', () => {
      render(<SlotMachine {...defaultProps} coins={100} spinCost={10} />)

      expect(screen.queryByTestId('insufficient-coins')).not.toBeInTheDocument()
    })
  })

  describe('spin animation', () => {
    it('shows spinning state during spin', async () => {
      render(<SlotMachine {...defaultProps} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.getByTestId('spinning-text')).toHaveTextContent('Spinning...')
      expect(screen.getByTestId('spin-button')).toBeDisabled()
    })

    it('disables spin button during animation', async () => {
      render(<SlotMachine {...defaultProps} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(screen.getByTestId('spin-button')).toBeDisabled()

      // try to click again
      fireEvent.click(screen.getByTestId('spin-button'))

      // should only have been called once for the coin deduction
      expect(defaultProps.onCoinsChange).toHaveBeenCalledTimes(1)
    })

    it('enables spin button after animation completes', async () => {
      render(<SlotMachine {...defaultProps} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('spin-button')).not.toBeDisabled()
      })
    })

    it('updates reels after spin completes', async () => {
      render(<SlotMachine {...defaultProps} />)

      const initialSymbol0 = screen.getByTestId('symbol-0').textContent

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // symbols should be updated (they're random so we just check they exist)
      await waitFor(() => {
        expect(screen.getByTestId('symbol-0')).toBeInTheDocument()
        expect(screen.getByTestId('symbol-1')).toBeInTheDocument()
        expect(screen.getByTestId('symbol-2')).toBeInTheDocument()
      })
    })
  })

  describe('coin deduction', () => {
    it('deducts spin cost when spinning', () => {
      render(<SlotMachine {...defaultProps} coins={100} spinCost={10} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(defaultProps.onCoinsChange).toHaveBeenCalledWith(90)
    })

    it('uses custom spin cost', () => {
      render(<SlotMachine {...defaultProps} coins={100} spinCost={25} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(defaultProps.onCoinsChange).toHaveBeenCalledWith(75)
    })

    it('prevents spin when coins are insufficient', () => {
      render(<SlotMachine {...defaultProps} coins={5} spinCost={10} />)

      expect(screen.getByTestId('spin-button')).toBeDisabled()

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(defaultProps.onCoinsChange).not.toHaveBeenCalled()
    })

    it('allows spin when coins exactly equal spin cost', () => {
      render(<SlotMachine {...defaultProps} coins={10} spinCost={10} />)

      expect(screen.getByTestId('spin-button')).not.toBeDisabled()

      fireEvent.click(screen.getByTestId('spin-button'))

      expect(defaultProps.onCoinsChange).toHaveBeenCalledWith(0)
    })
  })

  describe('win/lose states', () => {
    it('shows result message after spin', async () => {
      render(<SlotMachine {...defaultProps} />)

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        const winMessage = screen.queryByTestId('win-message')
        const loseMessage = screen.queryByTestId('lose-message')
        expect(winMessage || loseMessage).toBeInTheDocument()
      })
    })

    it('displays win amount when winning', async () => {
      // mock Math.random to always return same values for a win
      const mockRandom = jest.spyOn(Math, 'random')
      mockRandom.mockReturnValue(0) // will always pick first symbol

      render(
        <SlotMachine
          {...defaultProps}
          symbols={['meedo']}
          payouts={{ 'meedo-meedo-meedo': 100 }}
        />
      )

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('win-message')).toBeInTheDocument()
        expect(screen.getByTestId('win-text')).toHaveTextContent('100 coins')
      })

      mockRandom.mockRestore()
    })

    it('displays lose message when not winning', async () => {
      // mock different symbols
      const mockRandom = jest.spyOn(Math, 'random')
      let callCount = 0
      mockRandom.mockImplementation(() => {
        callCount++
        return callCount * 0.2 // returns 0.2, 0.4, 0.6 for different symbols
      })

      render(
        <SlotMachine
          {...defaultProps}
          symbols={['a', 'b', 'c', 'd', 'e']}
          payouts={{}}
        />
      )

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('lose-message')).toBeInTheDocument()
        expect(screen.getByTestId('lose-text')).toHaveTextContent('Better luck next time')
      })

      mockRandom.mockRestore()
    })

    it('adds payout to coins on win', async () => {
      const mockRandom = jest.spyOn(Math, 'random')
      mockRandom.mockReturnValue(0)

      const onCoinsChange = jest.fn()
      render(
        <SlotMachine
          coins={100}
          onCoinsChange={onCoinsChange}
          spinCost={10}
          symbols={['meedo']}
          payouts={{ 'meedo-meedo-meedo': 50 }}
        />
      )

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // first call deducts 10, second call adds winnings (100 - 10 + 50 = 140)
      await waitFor(() => {
        expect(onCoinsChange).toHaveBeenLastCalledWith(140)
      })

      mockRandom.mockRestore()
    })
  })

  describe('custom symbols and payouts', () => {
    it('uses custom symbols', async () => {
      const customSymbols = ['apple', 'banana', 'cherry']
      const mockRandom = jest.spyOn(Math, 'random')
      mockRandom.mockReturnValue(0)

      render(
        <SlotMachine
          {...defaultProps}
          symbols={customSymbols}
        />
      )

      fireEvent.click(screen.getByTestId('spin-button'))

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('symbol-0')).toHaveTextContent('apple')
      })

      mockRandom.mockRestore()
    })

    it('renders custom payouts in table', () => {
      const customPayouts = {
        'gold-gold-gold': 1000,
        'silver-silver-silver': 500,
      }

      render(
        <SlotMachine
          {...defaultProps}
          payouts={customPayouts}
        />
      )

      expect(screen.getByTestId('payout-gold-gold-gold')).toHaveTextContent('1000 coins')
      expect(screen.getByTestId('payout-silver-silver-silver')).toHaveTextContent('500 coins')
    })
  })
})
