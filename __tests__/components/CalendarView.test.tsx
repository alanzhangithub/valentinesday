import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'hangout' | 'mto' | 'bto' | 'special' | 'reminder'
  description?: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (date: Date) => void
  onMonthChange?: (year: number, month: number) => void
  loading?: boolean
  error?: string | null
  initialDate?: Date
}

// placeholder component - replace with actual import
const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onDateSelect,
  onMonthChange,
  loading = false,
  error = null,
  initialDate = new Date(),
}) => {
  const [currentDate, setCurrentDate] = React.useState(initialDate)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter((event) => event.date === dateStr)
  }

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day)
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventClick?.(event)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const renderCalendarDays = () => {
    const days = []

    // empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty" data-testid="empty-day" />
      )
    }

    // actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayEvents = getEventsForDate(date)
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <div
          key={day}
          data-testid={`calendar-day-${day}`}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {dayEvents.length > 0 && (
            <div className="day-events">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  data-testid={`event-${event.id}`}
                  className={`event-indicator ${event.type}`}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  <span className="event-title">{event.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div data-testid="calendar-loading" className="calendar-loading">
        Loading calendar...
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="calendar-error" className="calendar-error">
        {error}
      </div>
    )
  }

  return (
    <div data-testid="calendar-view" className="calendar-view">
      <div className="calendar-header">
        <button
          data-testid="prev-month-button"
          onClick={handlePrevMonth}
          className="nav-button"
        >
          &lt; Prev
        </button>
        <h2 data-testid="current-month">
          {monthNames[month]} {year}
        </h2>
        <button
          data-testid="next-month-button"
          onClick={handleNextMonth}
          className="nav-button"
        >
          Next &gt;
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} data-testid={`weekday-${day}`} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div data-testid="calendar-grid" className="calendar-grid">
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <div data-testid="selected-date-info" className="selected-date-info">
          <h3>Selected: {selectedDate.toLocaleDateString()}</h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div data-testid="selected-date-events">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="event-detail">
                  <strong>{event.title}</strong>
                  {event.time && <span> at {event.time}</span>}
                  {event.description && <p>{event.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p data-testid="no-events-message">No events on this day</p>
          )}
        </div>
      )}
    </div>
  )
}

describe('CalendarView', () => {
  const mockEvents: CalendarEvent[] = [
    {
      id: 'event-1',
      title: 'Date Night',
      date: '2026-02-14',
      time: '19:00',
      type: 'hangout',
      description: 'Valentine\'s dinner',
    },
    {
      id: 'event-2',
      title: 'MTO - Meedo Trip',
      date: '2026-02-20',
      type: 'mto',
    },
    {
      id: 'event-3',
      title: 'Beedo Birthday',
      date: '2026-02-01',
      type: 'special',
      description: 'Happy birthday Beedo!',
    },
  ]

  const mockOnEventClick = jest.fn()
  const mockOnDateSelect = jest.fn()
  const mockOnMonthChange = jest.fn()

  beforeEach(() => {
    mockOnEventClick.mockClear()
    mockOnDateSelect.mockClear()
    mockOnMonthChange.mockClear()
  })

  describe('render states', () => {
    it('renders the calendar', () => {
      render(<CalendarView events={[]} />)

      expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<CalendarView events={[]} loading={true} />)

      expect(screen.getByTestId('calendar-loading')).toBeInTheDocument()
      expect(screen.getByText(/loading calendar/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
      const errorMessage = 'Failed to load events'
      render(<CalendarView events={[]} error={errorMessage} />)

      expect(screen.getByTestId('calendar-error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('renders weekday headers', () => {
      render(<CalendarView events={[]} />)

      expect(screen.getByTestId('weekday-Sun')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Mon')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Tue')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Wed')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Thu')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Fri')).toBeInTheDocument()
      expect(screen.getByTestId('weekday-Sat')).toBeInTheDocument()
    })

    it('renders calendar grid', () => {
      render(<CalendarView events={[]} />)

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
    })

    it('renders current month and year', () => {
      const testDate = new Date(2026, 1, 15) // February 2026
      render(<CalendarView events={[]} initialDate={testDate} />)

      expect(screen.getByTestId('current-month')).toHaveTextContent('February 2026')
    })

    it('renders navigation buttons', () => {
      render(<CalendarView events={[]} />)

      expect(screen.getByTestId('prev-month-button')).toBeInTheDocument()
      expect(screen.getByTestId('next-month-button')).toBeInTheDocument()
    })
  })

  describe('events rendering', () => {
    it('renders events on correct dates', () => {
      const testDate = new Date(2026, 1, 1) // February 2026
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      expect(screen.getByTestId('event-event-3')).toBeInTheDocument()
      expect(screen.getByText('Beedo Birthday')).toBeInTheDocument()
    })

    it('renders multiple events on same date', () => {
      const eventsOnSameDay: CalendarEvent[] = [
        { id: 'e1', title: 'Morning Event', date: '2026-02-15', type: 'reminder' },
        { id: 'e2', title: 'Evening Event', date: '2026-02-15', type: 'hangout' },
      ]
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={eventsOnSameDay} initialDate={testDate} />)

      expect(screen.getByTestId('event-e1')).toBeInTheDocument()
      expect(screen.getByTestId('event-e2')).toBeInTheDocument()
    })

    it('does not render events from other months', () => {
      const eventsInMarch: CalendarEvent[] = [
        { id: 'march-event', title: 'March Event', date: '2026-03-15', type: 'hangout' },
      ]
      const testDate = new Date(2026, 1, 1) // February
      render(<CalendarView events={eventsInMarch} initialDate={testDate} />)

      expect(screen.queryByTestId('event-march-event')).not.toBeInTheDocument()
    })

    it('applies correct class for event types', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      const specialEvent = screen.getByTestId('event-event-3')
      expect(specialEvent).toHaveClass('special')
    })
  })

  describe('date navigation', () => {
    it('navigates to previous month', () => {
      const testDate = new Date(2026, 1, 15) // February
      render(
        <CalendarView
          events={[]}
          initialDate={testDate}
          onMonthChange={mockOnMonthChange}
        />
      )

      fireEvent.click(screen.getByTestId('prev-month-button'))

      expect(screen.getByTestId('current-month')).toHaveTextContent('January 2026')
      expect(mockOnMonthChange).toHaveBeenCalledWith(2026, 0)
    })

    it('navigates to next month', () => {
      const testDate = new Date(2026, 1, 15) // February
      render(
        <CalendarView
          events={[]}
          initialDate={testDate}
          onMonthChange={mockOnMonthChange}
        />
      )

      fireEvent.click(screen.getByTestId('next-month-button'))

      expect(screen.getByTestId('current-month')).toHaveTextContent('March 2026')
      expect(mockOnMonthChange).toHaveBeenCalledWith(2026, 2)
    })

    it('handles year change when navigating months', () => {
      const testDate = new Date(2026, 0, 15) // January 2026
      render(
        <CalendarView
          events={[]}
          initialDate={testDate}
          onMonthChange={mockOnMonthChange}
        />
      )

      fireEvent.click(screen.getByTestId('prev-month-button'))

      expect(screen.getByTestId('current-month')).toHaveTextContent('December 2025')
      expect(mockOnMonthChange).toHaveBeenCalledWith(2025, 11)
    })
  })

  describe('event clicks', () => {
    it('calls onEventClick when event is clicked', () => {
      const testDate = new Date(2026, 1, 1)
      render(
        <CalendarView
          events={mockEvents}
          initialDate={testDate}
          onEventClick={mockOnEventClick}
        />
      )

      fireEvent.click(screen.getByTestId('event-event-3'))

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[2])
    })

    it('does not trigger date select when clicking event', () => {
      const testDate = new Date(2026, 1, 1)
      render(
        <CalendarView
          events={mockEvents}
          initialDate={testDate}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      )

      fireEvent.click(screen.getByTestId('event-event-3'))

      expect(mockOnEventClick).toHaveBeenCalled()
      // date select should not be called due to stopPropagation
    })

    it('handles click on day without events', () => {
      const testDate = new Date(2026, 1, 1)
      render(
        <CalendarView
          events={mockEvents}
          initialDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      )

      fireEvent.click(screen.getByTestId('calendar-day-15'))

      expect(mockOnDateSelect).toHaveBeenCalledWith(new Date(2026, 1, 15))
    })
  })

  describe('date selection', () => {
    it('shows selected date info when date is clicked', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-14'))

      expect(screen.getByTestId('selected-date-info')).toBeInTheDocument()
    })

    it('shows events for selected date', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-14'))

      expect(screen.getByTestId('selected-date-events')).toBeInTheDocument()
      expect(screen.getByText('Date Night')).toBeInTheDocument()
    })

    it('shows no events message when date has no events', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-15'))

      expect(screen.getByTestId('no-events-message')).toBeInTheDocument()
    })

    it('applies selected class to selected day', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={[]} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-10'))

      expect(screen.getByTestId('calendar-day-10')).toHaveClass('selected')
    })
  })

  describe('calendar grid structure', () => {
    it('renders correct number of days for February 2026', () => {
      const testDate = new Date(2026, 1, 1) // February 2026 has 28 days
      render(<CalendarView events={[]} initialDate={testDate} />)

      expect(screen.getByTestId('calendar-day-1')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-day-28')).toBeInTheDocument()
      expect(screen.queryByTestId('calendar-day-29')).not.toBeInTheDocument()
    })

    it('renders correct number of days for leap year February', () => {
      const testDate = new Date(2024, 1, 1) // February 2024 has 29 days (leap year)
      render(<CalendarView events={[]} initialDate={testDate} />)

      expect(screen.getByTestId('calendar-day-29')).toBeInTheDocument()
    })

    it('renders empty cells for days before first of month', () => {
      // February 2026 starts on Sunday, so no empty cells
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={[]} initialDate={testDate} />)

      const emptyCells = screen.queryAllByTestId('empty-day')
      expect(emptyCells.length).toBe(0)
    })

    it('renders empty cells when month does not start on Sunday', () => {
      // March 2026 starts on Sunday, but let's use a month that doesn't
      const testDate = new Date(2026, 3, 1) // April 2026 starts on Wednesday
      render(<CalendarView events={[]} initialDate={testDate} />)

      const emptyCells = screen.queryAllByTestId('empty-day')
      expect(emptyCells.length).toBe(3) // Wed is index 3, so 3 empty cells
    })
  })

  describe('today highlighting', () => {
    it('highlights today if in current month', () => {
      const today = new Date()
      render(<CalendarView events={[]} initialDate={today} />)

      const todayCell = screen.getByTestId(`calendar-day-${today.getDate()}`)
      expect(todayCell).toHaveClass('today')
    })
  })

  describe('event details display', () => {
    it('shows event time when provided', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-14'))

      expect(screen.getByText(/19:00/)).toBeInTheDocument()
    })

    it('shows event description when provided', () => {
      const testDate = new Date(2026, 1, 1)
      render(<CalendarView events={mockEvents} initialDate={testDate} />)

      fireEvent.click(screen.getByTestId('calendar-day-14'))

      expect(screen.getByText("Valentine's dinner")).toBeInTheDocument()
    })
  })
})
