import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
    form: ({ children, onSubmit, ...props }: React.PropsWithChildren<{ onSubmit?: (e: React.FormEvent) => void }>) => (
      <form onSubmit={onSubmit} {...props}>{children}</form>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

interface Wish {
  id?: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'granted' | 'denied'
}

interface WishingWellProps {
  onSubmit: (wish: Wish) => Promise<void>
  loading?: boolean
  error?: string | null
  recentWishes?: Wish[]
}

// placeholder component - replace with actual import
const WishingWell: React.FC<WishingWellProps> = ({
  onSubmit,
  loading = false,
  error = null,
  recentWishes = [],
}) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Wish['priority']>('medium')
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Please enter a wish title')
      return false
    }
    if (title.length < 3) {
      setValidationError('Wish title must be at least 3 characters')
      return false
    }
    if (title.length > 100) {
      setValidationError('Wish title must be less than 100 characters')
      return false
    }
    if (description.length > 500) {
      setValidationError('Description must be less than 500 characters')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await onSubmit({ title, description, priority })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      // error handled by parent
    }
  }

  return (
    <div data-testid="wishing-well" className="wishing-well">
      <h2>Wish Upon Mod</h2>
      <p className="subtitle">What does your heart desire?</p>

      {error && (
        <div data-testid="wishing-well-error" className="error-message">
          {error}
        </div>
      )}

      {validationError && (
        <div data-testid="validation-error" className="validation-error">
          {validationError}
        </div>
      )}

      {submitted && (
        <div data-testid="success-message" className="success-message">
          Your wish has been sent to Mod!
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="wish-form">
        <div className="form-group">
          <label htmlFor="wish-title">Your Wish</label>
          <input
            id="wish-title"
            data-testid="wish-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="I wish for..."
            disabled={loading}
            maxLength={100}
          />
          <span data-testid="title-char-count" className="char-count">
            {title.length}/100
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="wish-description">Details (optional)</label>
          <textarea
            id="wish-description"
            data-testid="wish-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell Mod more about your wish..."
            disabled={loading}
            maxLength={500}
          />
          <span data-testid="description-char-count" className="char-count">
            {description.length}/500
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="wish-priority">Priority</label>
          <select
            id="wish-priority"
            data-testid="wish-priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Wish['priority'])}
            disabled={loading}
          >
            <option value="low">Low - whenever</option>
            <option value="medium">Medium - soon please</option>
            <option value="high">High - really want this</option>
            <option value="urgent">Urgent - need this now!</option>
          </select>
        </div>

        <button
          type="submit"
          data-testid="submit-wish-button"
          disabled={loading}
          className="submit-button"
        >
          {loading ? (
            <span data-testid="loading-indicator">Sending to Mod...</span>
          ) : (
            'Make a Wish'
          )}
        </button>
      </form>

      {recentWishes.length > 0 && (
        <div data-testid="recent-wishes" className="recent-wishes">
          <h3>Recent Wishes</h3>
          {recentWishes.map((wish, index) => (
            <div key={wish.id || index} data-testid={`recent-wish-${index}`} className="recent-wish">
              <span className="wish-title">{wish.title}</span>
              <span className={`wish-status ${wish.status}`}>{wish.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

describe('WishingWell', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  describe('render states', () => {
    it('renders the wishing well form', () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('wishing-well')).toBeInTheDocument()
      expect(screen.getByTestId('wish-form')).toBeInTheDocument()
      expect(screen.getByText('Wish Upon Mod')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('wish-title-input')).toBeInTheDocument()
      expect(screen.getByTestId('wish-description-input')).toBeInTheDocument()
      expect(screen.getByTestId('wish-priority-select')).toBeInTheDocument()
      expect(screen.getByTestId('submit-wish-button')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<WishingWell onSubmit={mockOnSubmit} loading={true} />)

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('submit-wish-button')).toBeDisabled()
      expect(screen.getByTestId('wish-title-input')).toBeDisabled()
      expect(screen.getByTestId('wish-description-input')).toBeDisabled()
      expect(screen.getByTestId('wish-priority-select')).toBeDisabled()
    })

    it('renders error state', () => {
      const errorMessage = 'Failed to submit wish'
      render(<WishingWell onSubmit={mockOnSubmit} error={errorMessage} />)

      expect(screen.getByTestId('wishing-well-error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('renders recent wishes when provided', () => {
      const recentWishes: Wish[] = [
        { id: '1', title: 'More cuddles', description: '', priority: 'high', status: 'granted' },
        { id: '2', title: 'Pizza night', description: '', priority: 'medium', status: 'pending' },
      ]
      render(<WishingWell onSubmit={mockOnSubmit} recentWishes={recentWishes} />)

      expect(screen.getByTestId('recent-wishes')).toBeInTheDocument()
      expect(screen.getByTestId('recent-wish-0')).toBeInTheDocument()
      expect(screen.getByTestId('recent-wish-1')).toBeInTheDocument()
    })

    it('does not render recent wishes section when empty', () => {
      render(<WishingWell onSubmit={mockOnSubmit} recentWishes={[]} />)

      expect(screen.queryByTestId('recent-wishes')).not.toBeInTheDocument()
    })
  })

  describe('input validation', () => {
    it('shows validation error for empty title', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument()
        expect(screen.getByText(/please enter a wish title/i)).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows validation error for title too short', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'ab' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument()
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows validation error for title too long', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      const longTitle = 'a'.repeat(101)
      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: longTitle } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument()
        expect(screen.getByText(/less than 100 characters/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for description too long', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Valid title' } })
      const longDescription = 'a'.repeat(501)
      fireEvent.change(screen.getByTestId('wish-description-input'), { target: { value: longDescription } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument()
        expect(screen.getByText(/less than 500 characters/i)).toBeInTheDocument()
      })
    })

    it('updates character count for title', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('title-char-count')).toHaveTextContent('0/100')

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Hello' } })

      expect(screen.getByTestId('title-char-count')).toHaveTextContent('5/100')
    })

    it('updates character count for description', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('description-char-count')).toHaveTextContent('0/500')

      fireEvent.change(screen.getByTestId('wish-description-input'), { target: { value: 'Test description' } })

      expect(screen.getByTestId('description-char-count')).toHaveTextContent('16/500')
    })
  })

  describe('submit handler', () => {
    it('calls onSubmit with form data', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'More movie nights' } })
      fireEvent.change(screen.getByTestId('wish-description-input'), { target: { value: 'Watch scary movies together' } })
      fireEvent.change(screen.getByTestId('wish-priority-select'), { target: { value: 'high' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'More movie nights',
          description: 'Watch scary movies together',
          priority: 'high',
        })
      })
    })

    it('clears form after successful submit', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Test wish' } })
      fireEvent.change(screen.getByTestId('wish-description-input'), { target: { value: 'Test description' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('wish-title-input')).toHaveValue('')
        expect(screen.getByTestId('wish-description-input')).toHaveValue('')
      })
    })

    it('shows success message after submit', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Test wish' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
        expect(screen.getByText(/sent to Mod/i)).toBeInTheDocument()
      })
    })

    it('resets priority to medium after submit', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Test wish' } })
      fireEvent.change(screen.getByTestId('wish-priority-select'), { target: { value: 'urgent' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      await waitFor(() => {
        expect(screen.getByTestId('wish-priority-select')).toHaveValue('medium')
      })
    })
  })

  describe('priority selection', () => {
    it('has medium as default priority', () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('wish-priority-select')).toHaveValue('medium')
    })

    it('allows selecting all priority levels', () => {
      render(<WishingWell onSubmit={mockOnSubmit} />)

      const select = screen.getByTestId('wish-priority-select')

      fireEvent.change(select, { target: { value: 'low' } })
      expect(select).toHaveValue('low')

      fireEvent.change(select, { target: { value: 'high' } })
      expect(select).toHaveValue('high')

      fireEvent.change(select, { target: { value: 'urgent' } })
      expect(select).toHaveValue('urgent')
    })
  })

  describe('loading state behavior', () => {
    it('prevents form submission during loading', async () => {
      render(<WishingWell onSubmit={mockOnSubmit} loading={true} />)

      fireEvent.change(screen.getByTestId('wish-title-input'), { target: { value: 'Test' } })
      fireEvent.click(screen.getByTestId('submit-wish-button'))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows loading text on submit button', () => {
      render(<WishingWell onSubmit={mockOnSubmit} loading={true} />)

      expect(screen.getByTestId('loading-indicator')).toHaveTextContent('Sending to Mod...')
    })
  })
})
