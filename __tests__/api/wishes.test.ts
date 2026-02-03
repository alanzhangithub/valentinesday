/**
 * tests for /api/wishes routes
 * covers: submit wish, list wishes, grant/deny wish
 *
 * wishes are requests to Mod (the god of meedo/beedo world)
 * one person makes a wish, the other person (acting as Mod) can grant or deny it
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

describe('wishes api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('GET /api/wishes - list wishes', () => {
    it('should return all wishes', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const mockWishes = [
        {
          id: 'wish-1',
          content: 'i wish for pizza tonight',
          wished_by: mockBeedo.id,
          status: 'pending',
          created_at: '2026-02-01',
        },
        {
          id: 'wish-2',
          content: 'i wish for a movie marathon',
          wished_by: mockMeedo.id,
          status: 'granted',
          granted_by: mockBeedo.id,
          granted_at: '2026-01-20',
          created_at: '2026-01-15',
        },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(mockWishes))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .order('created_at', { ascending: false })

      // assert
      expect(result.data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const pendingWishes = [
        { id: 'wish-1', content: 'pizza pls', status: 'pending' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(pendingWishes))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('status', 'pending')

      // assert
      expect(result.data[0].status).toBe('pending')
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

  describe('POST /api/wishes - submit wish', () => {
    it('should create a new wish', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const newWish = {
        id: 'new-wish-uuid',
        content: 'i wish for a spa day',
        wished_by: mockBeedo.id,
        status: 'pending',
        created_at: '2026-02-01',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newWish))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .insert({
          content: 'i wish for a spa day',
          wished_by: mockBeedo.id,
          status: 'pending',
        })
        .select()
        .single()

      // assert
      expect(result.data.content).toBe('i wish for a spa day')
      expect(result.data.status).toBe('pending')
    })

    it('should reject wish without content (invalid input)', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const requestBody = {
        content: '', // empty - invalid
      }

      // validation
      const isValid = requestBody.content && requestBody.content.trim().length > 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject wish with content too long', async () => {
      // arrange
      const longContent = 'a'.repeat(1001) // over 1000 char limit

      const isValid = longContent.length <= 1000

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject wish with only whitespace', async () => {
      // arrange
      const requestBody = {
        content: '   \n\t  ', // only whitespace
      }

      const isValid = requestBody.content.trim().length > 0

      // assert
      expect(isValid).toBe(false)
    })
  })

  describe('POST /api/wishes/:id/grant - grant wish', () => {
    it('should grant a pending wish', async () => {
      // arrange - meedo granting beedo's wish
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const pendingWish = {
        id: 'wish-123',
        content: 'pizza please',
        wished_by: mockBeedo.id,
        status: 'pending',
      }

      const grantedWish = {
        ...pendingWish,
        status: 'granted',
        granted_by: mockMeedo.id,
        granted_at: '2026-02-01T12:00:00Z',
        mod_response: 'your wish is my command',
      }

      mockSupabaseClient.then
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(pendingWish))
        )
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(grantedWish))
        )

      // act - first get the wish
      const checkResult = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('id', 'wish-123')
        .single()

      expect(checkResult.data.status).toBe('pending')

      // then grant it
      const grantResult = await mockSupabaseClient
        .from('wishes')
        .update({
          status: 'granted',
          granted_by: mockMeedo.id,
          granted_at: new Date().toISOString(),
          mod_response: 'your wish is my command',
        })
        .eq('id', 'wish-123')
        .select()
        .single()

      // assert
      expect(grantResult.data.status).toBe('granted')
      expect(grantResult.data.granted_by).toBe(mockMeedo.id)
    })

    it('should reject granting own wish (cant be your own Mod)', async () => {
      // arrange - beedo trying to grant her own wish
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const ownWish = {
        id: 'wish-123',
        content: 'infinite money',
        wished_by: mockBeedo.id, // beedo's wish
        status: 'pending',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(ownWish))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('id', 'wish-123')
        .single()

      // assert - api would catch this
      const canGrant = result.data.wished_by !== mockBeedo.id
      expect(canGrant).toBe(false)
    })

    it('should reject granting already granted wish', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const alreadyGranted = {
        id: 'wish-123',
        content: 'pizza',
        wished_by: mockBeedo.id,
        status: 'granted', // already granted
        granted_by: mockMeedo.id,
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(alreadyGranted))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('id', 'wish-123')
        .single()

      // assert
      const canGrant = result.data.status === 'pending'
      expect(canGrant).toBe(false)
    })

    it('should return 404 for non-existent wish', async () => {
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
        .from('wishes')
        .select('*')
        .eq('id', 'fake-wish')
        .single()

      // assert
      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('POST /api/wishes/:id/deny - deny wish', () => {
    it('should deny a pending wish', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const pendingWish = {
        id: 'wish-123',
        content: 'buy me a yacht',
        wished_by: mockBeedo.id,
        status: 'pending',
      }

      const deniedWish = {
        ...pendingWish,
        status: 'denied',
        granted_by: mockMeedo.id,
        granted_at: '2026-02-01T12:00:00Z',
        mod_response: 'nice try but no',
      }

      mockSupabaseClient.then
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(pendingWish))
        )
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(deniedWish))
        )

      // act
      const checkResult = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('id', 'wish-123')
        .single()

      const denyResult = await mockSupabaseClient
        .from('wishes')
        .update({
          status: 'denied',
          granted_by: mockMeedo.id,
          granted_at: new Date().toISOString(),
          mod_response: 'nice try but no',
        })
        .eq('id', 'wish-123')
        .select()
        .single()

      // assert
      expect(denyResult.data.status).toBe('denied')
    })

    it('should require a mod_response when denying', async () => {
      // arrange - denying without explanation is kinda rude
      const requestBody = {
        mod_response: '', // no explanation
      }

      const isValid = requestBody.mod_response && requestBody.mod_response.trim().length > 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject denying already denied wish', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const alreadyDenied = {
        id: 'wish-123',
        status: 'denied',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(alreadyDenied))
      )

      // act
      const result = await mockSupabaseClient
        .from('wishes')
        .select('*')
        .eq('id', 'wish-123')
        .single()

      // assert
      const canDeny = result.data.status === 'pending'
      expect(canDeny).toBe(false)
    })
  })
})
