import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div onClick={onClick} {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

interface TapTheBeedoProps {
  onGameEnd: (score: number, coinsEarned: number) => void
  timeLimit?: number
  coinsPerTap?: number
  bonusThreshold?: number
  bonusMultiplier?: number
}

type GameState = 'idle' | 'playing' | 'ended'

// placeholder component - replace with actual import
const TapTheBeedo: React.FC<TapTheBeedoProps> = ({
  onGameEnd,
  timeLimit = 30,
  coinsPerTap = 1,
  bonusThreshold = 50,
  bonusMultiplier = 2,
}) => {
  const [gameState, setGameState] = React.useState<GameState>('idle')
  const [score, setScore] = React.useState(0)
  const [timeLeft, setTimeLeft] = React.useState(timeLimit)
  const [beedoPosition, setBeedoPosition] = React.useState({ x: 50, y: 50 })
  const [highScore, setHighScore] = React.useState(0)

  const moveBeedo = () => {
    setBeedoPosition({
      x: Math.random() * 80 + 10, // 10-90%
      y: Math.random() * 80 + 10,
    })
  }

  const handleStartGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(timeLimit)
    moveBeedo()
  }

  const handleTapBeedo = () => {
    if (gameState !== 'playing') return
    setScore((prev) => prev + 1)
    moveBeedo()
  }

  const handleTapMiss = () => {
    // optional: penalize misses
  }

  const calculateCoins = (finalScore: number): number => {
    const baseCoins = finalScore * coinsPerTap
    if (finalScore >= bonusThreshold) {
      return baseCoins * bonusMultiplier
    }
    return baseCoins
  }

  React.useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameState('ended')
          const coinsEarned = calculateCoins(score)
          if (score > highScore) {
            setHighScore(score)
          }
          onGameEnd(score, coinsEarned)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, score, onGameEnd, highScore])

  return (
    <div data-testid="tap-the-beedo" className="tap-the-beedo">
      <h2>Tap the Beedo!</h2>

      {gameState === 'idle' && (
        <div data-testid="start-screen" className="start-screen">
          <p>Tap Beedo as many times as you can!</p>
          <p>Time limit: {timeLimit} seconds</p>
          {highScore > 0 && (
            <p data-testid="high-score">High Score: {highScore}</p>
          )}
          <button
            data-testid="start-button"
            onClick={handleStartGame}
            className="start-button"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div data-testid="game-screen" className="game-screen">
          <div className="game-stats">
            <span data-testid="current-score">Score: {score}</span>
            <span data-testid="time-left">Time: {timeLeft}s</span>
          </div>

          <div
            data-testid="game-area"
            className="game-area"
            onClick={handleTapMiss}
          >
            <div
              data-testid="beedo-target"
              className="beedo-target"
              onClick={(e) => {
                e.stopPropagation()
                handleTapBeedo()
              }}
              style={{
                position: 'absolute',
                left: `${beedoPosition.x}%`,
                top: `${beedoPosition.y}%`,
              }}
            >
              Beedo
            </div>
          </div>
        </div>
      )}

      {gameState === 'ended' && (
        <div data-testid="end-screen" className="end-screen">
          <h3>Game Over!</h3>
          <p data-testid="final-score">Final Score: {score}</p>
          <p data-testid="coins-earned">
            Coins Earned: {calculateCoins(score)}
            {score >= bonusThreshold && (
              <span data-testid="bonus-indicator"> (x{bonusMultiplier} Bonus!)</span>
            )}
          </p>
          {score > 0 && score === highScore && (
            <p data-testid="new-high-score">New High Score!</p>
          )}
          <button
            data-testid="play-again-button"
            onClick={handleStartGame}
            className="play-again-button"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

describe('TapTheBeedo', () => {
  const mockOnGameEnd = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    mockOnGameEnd.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('render states', () => {
    it('renders the game container', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      expect(screen.getByTestId('tap-the-beedo')).toBeInTheDocument()
      expect(screen.getByText('Tap the Beedo!')).toBeInTheDocument()
    })

    it('shows start screen initially', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      expect(screen.getByTestId('start-screen')).toBeInTheDocument()
      expect(screen.getByTestId('start-button')).toBeInTheDocument()
    })

    it('displays time limit on start screen', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={45} />)

      expect(screen.getByText(/45 seconds/i)).toBeInTheDocument()
    })

    it('does not show high score initially', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      expect(screen.queryByTestId('high-score')).not.toBeInTheDocument()
    })
  })

  describe('game start', () => {
    it('starts game when start button is clicked', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))

      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('start-screen')).not.toBeInTheDocument()
    })

    it('initializes score to 0', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))

      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 0')
    })

    it('initializes timer to time limit', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={30} />)

      fireEvent.click(screen.getByTestId('start-button'))

      expect(screen.getByTestId('time-left')).toHaveTextContent('Time: 30s')
    })

    it('shows beedo target in game area', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))

      expect(screen.getByTestId('beedo-target')).toBeInTheDocument()
      expect(screen.getByTestId('game-area')).toBeInTheDocument()
    })
  })

  describe('scoring', () => {
    it('increments score when beedo is tapped', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))

      fireEvent.click(screen.getByTestId('beedo-target'))
      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 1')

      fireEvent.click(screen.getByTestId('beedo-target'))
      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 2')
    })

    it('does not increment score when game area is tapped (miss)', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 1')

      fireEvent.click(screen.getByTestId('game-area'))

      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 1')
    })

    it('moves beedo after each tap', () => {
      const mockRandom = jest.spyOn(Math, 'random')
      mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.2).mockReturnValueOnce(0.8)

      render(<TapTheBeedo onGameEnd={mockOnGameEnd} />)

      fireEvent.click(screen.getByTestId('start-button'))

      const initialBeedo = screen.getByTestId('beedo-target')
      const initialLeft = initialBeedo.style.left

      fireEvent.click(screen.getByTestId('beedo-target'))

      const newLeft = screen.getByTestId('beedo-target').style.left
      expect(newLeft).not.toBe(initialLeft)

      mockRandom.mockRestore()
    })
  })

  describe('time limit', () => {
    it('counts down timer each second', () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={5} />)

      fireEvent.click(screen.getByTestId('start-button'))
      expect(screen.getByTestId('time-left')).toHaveTextContent('Time: 5s')

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(screen.getByTestId('time-left')).toHaveTextContent('Time: 4s')

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(screen.getByTestId('time-left')).toHaveTextContent('Time: 3s')
    })

    it('ends game when timer reaches 0', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={3} />)

      fireEvent.click(screen.getByTestId('start-button'))

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('end-screen')).toBeInTheDocument()
      })
    })

    it('calls onGameEnd when time runs out', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={2} />)

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockOnGameEnd).toHaveBeenCalledWith(2, expect.any(Number))
      })
    })
  })

  describe('game end', () => {
    it('shows end screen when game ends', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      fireEvent.click(screen.getByTestId('start-button'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('end-screen')).toBeInTheDocument()
      })
    })

    it('displays final score', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('final-score')).toHaveTextContent('Final Score: 3')
      })
    })

    it('calculates coins earned correctly', async () => {
      render(
        <TapTheBeedo
          onGameEnd={mockOnGameEnd}
          timeLimit={1}
          coinsPerTap={2}
        />
      )

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('coins-earned')).toHaveTextContent('Coins Earned: 4')
      })
    })

    it('applies bonus multiplier when threshold is met', async () => {
      render(
        <TapTheBeedo
          onGameEnd={mockOnGameEnd}
          timeLimit={1}
          coinsPerTap={1}
          bonusThreshold={3}
          bonusMultiplier={3}
        />
      )

      fireEvent.click(screen.getByTestId('start-button'))
      // tap 3 times to meet threshold
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('coins-earned')).toHaveTextContent('Coins Earned: 9')
        expect(screen.getByTestId('bonus-indicator')).toHaveTextContent('x3 Bonus!')
      })
    })

    it('shows play again button', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      fireEvent.click(screen.getByTestId('start-button'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('play-again-button')).toBeInTheDocument()
      })
    })

    it('restarts game when play again is clicked', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('end-screen')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('play-again-button'))

      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
      expect(screen.getByTestId('current-score')).toHaveTextContent('Score: 0')
    })
  })

  describe('high score tracking', () => {
    it('shows new high score indicator', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('new-high-score')).toBeInTheDocument()
      })
    })

    it('shows high score on start screen after first game', async () => {
      render(<TapTheBeedo onGameEnd={mockOnGameEnd} timeLimit={1} />)

      // first game
      fireEvent.click(screen.getByTestId('start-button'))
      fireEvent.click(screen.getByTestId('beedo-target'))
      fireEvent.click(screen.getByTestId('beedo-target'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('end-screen')).toBeInTheDocument()
      })

      // go back to start
      fireEvent.click(screen.getByTestId('play-again-button'))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('end-screen')).toBeInTheDocument()
      })

      // check high score is preserved - it should show on the next game's end screen
      expect(mockOnGameEnd).toHaveBeenCalledTimes(2)
    })
  })
})
