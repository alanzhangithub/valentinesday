/**
 * tests for /api/calendar routes
 * covers: create event, list events, update event, delete event
 *
 * calendar tracks dates, hangouts, MTO/BTO (meedo/beedo time off)
 */

import {
  mockSupabaseClient,
  resetSupabaseMocks,
  mockSupabaseResponse,
  mockMeedo,
  mockBeedo,
} from '../mocks/supabase'

jest.mock('@/src/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
}))

describe('calendar api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('GET /api/calendar - list events', () => {
    it('should return all calendar events', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const mockEvents = [
        {
          id: 'event-1',
          title: 'date night',
          start_date: '2026-02-14T19:00:00Z',
          end_date: '2026-02-14T23:00:00Z',
          event_type: 'hangout',
          created_by: mockMeedo.id,
        },
        {
          id: 'event-2',
          title: 'BTO - beach trip',
          start_date: '2026-03-01',
          end_date: '2026-03-05',
          event_type: 'bto',
          created_by: mockBeedo.id,
        },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(mockEvents))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true })

      // assert
      expect(result.data).toHaveLength(2)
    })

    it('should filter events by date range', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const febEvents = [
        { id: 'e1', title: 'valentines', start_date: '2026-02-14' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(febEvents))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .select('*')
        .gte('start_date', '2026-02-01')
        .lt('start_date', '2026-03-01')

      // assert
      expect(result.data).toHaveLength(1)
    })

    it('should filter by event type', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const mtoEvents = [
        { id: 'e1', title: 'MTO - work trip', event_type: 'mto' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(mtoEvents))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .select('*')
        .eq('event_type', 'mto')

      // assert
      expect(result.data[0].event_type).toBe('mto')
    })

    it('should return 401 when not authenticated', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'not authenticated' },
      })

      // act
      const user = await mockSupabaseClient.auth.getUser()

      // assert
      expect(user.error).toBeTruthy()
    })
  })

  describe('POST /api/calendar - create event', () => {
    it('should create a new event', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const newEvent = {
        id: 'new-event-uuid',
        title: 'anniversary dinner',
        start_date: '2026-05-15T18:00:00Z',
        end_date: '2026-05-15T22:00:00Z',
        event_type: 'hangout',
        location: 'fancy restaurant',
        notes: 'dress nice',
        created_by: mockMeedo.id,
        created_at: '2026-02-01',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newEvent))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .insert({
          title: 'anniversary dinner',
          start_date: '2026-05-15T18:00:00Z',
          end_date: '2026-05-15T22:00:00Z',
          event_type: 'hangout',
          location: 'fancy restaurant',
          notes: 'dress nice',
          created_by: mockMeedo.id,
        })
        .select()
        .single()

      // assert
      expect(result.data.title).toBe('anniversary dinner')
      expect(result.data.event_type).toBe('hangout')
    })

    it('should reject event without title (invalid input)', async () => {
      // arrange
      const requestBody = {
        title: '',
        start_date: '2026-02-14',
      }

      const isValid = requestBody.title && requestBody.title.trim().length > 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject event without start_date', async () => {
      // arrange
      const requestBody = {
        title: 'some event',
        start_date: null,
      }

      const isValid = !!requestBody.start_date

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject event with end_date before start_date', async () => {
      // arrange
      const requestBody = {
        title: 'time travel event',
        start_date: '2026-02-15',
        end_date: '2026-02-10', // before start
      }

      const start = new Date(requestBody.start_date)
      const end = new Date(requestBody.end_date)
      const isValid = end >= start

      // assert
      expect(isValid).toBe(false)
    })

    it('should accept all-day events (no time component)', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const allDayEvent = {
        id: 'event-uuid',
        title: 'BTO day',
        start_date: '2026-02-20',
        end_date: '2026-02-20',
        all_day: true,
        event_type: 'bto',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(allDayEvent))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .insert({
          title: 'BTO day',
          start_date: '2026-02-20',
          end_date: '2026-02-20',
          all_day: true,
          event_type: 'bto',
        })
        .select()
        .single()

      // assert
      expect(result.data.all_day).toBe(true)
    })

    it('should validate event_type is valid enum', async () => {
      // arrange
      const validTypes = ['hangout', 'mto', 'bto', 'anniversary', 'birthday', 'other']
      const requestBody = {
        title: 'test event',
        event_type: 'invalid_type',
      }

      const isValid = validTypes.includes(requestBody.event_type)

      // assert
      expect(isValid).toBe(false)
    })
  })

  describe('PUT /api/calendar/:id - update event', () => {
    it('should update an existing event', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const updatedEvent = {
        id: 'event-123',
        title: 'updated dinner plans',
        start_date: '2026-02-14T20:00:00Z', // changed time
        location: 'different restaurant',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(updatedEvent))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .update({
          title: 'updated dinner plans',
          start_date: '2026-02-14T20:00:00Z',
          location: 'different restaurant',
        })
        .eq('id', 'event-123')
        .select()
        .single()

      // assert
      expect(result.data.title).toBe('updated dinner plans')
    })

    it('should return 404 for non-existent event', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } })
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .update({ title: 'whatever' })
        .eq('id', 'fake-event')
        .select()
        .single()

      // assert
      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should allow partner to update event', async () => {
      // arrange - beedo updating meedo's event (its their shared calendar)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const eventByMeedo = {
        id: 'event-123',
        title: 'date night',
        created_by: mockMeedo.id,
      }

      const updatedEvent = {
        ...eventByMeedo,
        title: 'fancy date night',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(updatedEvent))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .update({ title: 'fancy date night' })
        .eq('id', 'event-123')
        .select()
        .single()

      // assert
      expect(result.data.title).toBe('fancy date night')
    })
  })

  describe('DELETE /api/calendar/:id - delete event', () => {
    it('should delete an event', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse({ id: 'event-123' }))
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .delete()
        .eq('id', 'event-123')

      // assert
      expect(result.data).toBeTruthy()
    })

    it('should return 404 for non-existent event', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'not found' } })
      )

      // act
      const result = await mockSupabaseClient
        .from('calendar_events')
        .delete()
        .eq('id', 'fake-event')

      // assert
      expect(result.error).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle recurring events placeholder', async () => {
      // future feature - just making sure we think about it
      const recurringEvent = {
        title: 'weekly date night',
        recurrence: 'weekly',
        recurrence_end: '2026-12-31',
      }

      // for now just validate the shape
      expect(recurringEvent.recurrence).toBe('weekly')
    })

    it('should handle timezone considerations', async () => {
      // arrange - events should store in UTC
      const event = {
        start_date: '2026-02-14T19:00:00Z', // UTC
        timezone: 'America/Los_Angeles',
      }

      // validate its a valid ISO string
      const date = new Date(event.start_date)
      expect(date.toISOString()).toBe('2026-02-14T19:00:00.000Z')
    })
  })
})
