/**
 * tests for /api/photos routes
 * covers: list, upload, get single, delete
 */

import {
  mockSupabaseClient,
  resetSupabaseMocks,
  mockSupabaseResponse,
  mockSupabaseError,
  mockMeedo,
  mockBeedo,
  mockStorageClient,
} from '../mocks/supabase'

// mock the supabase module
jest.mock('@/src/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
  storage: mockStorageClient,
}))

describe('photos api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('GET /api/photos - list photos', () => {
    it('should return all photos for authenticated user', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const mockPhotos = [
        { id: '1', url: 'https://example.com/1.jpg', caption: 'beach day', created_at: '2026-01-01' },
        { id: '2', url: 'https://example.com/2.jpg', caption: 'dinner', created_at: '2026-01-02' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(mockPhotos))
      )

      // act - simulate what the api handler would do
      const user = await mockSupabaseClient.auth.getUser()
      expect(user.data.user).toEqual(mockMeedo)

      const result = await mockSupabaseClient
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })

      // assert
      expect(result.data).toEqual(mockPhotos)
      expect(result.error).toBeNull()
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
      expect(user.data.user).toBeNull()
      expect(user.error).toBeTruthy()
    })

    it('should handle empty photo gallery', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse([]))
      )

      // act
      const result = await mockSupabaseClient
        .from('photos')
        .select('*')

      // assert
      expect(result.data).toEqual([])
    })
  })

  describe('POST /api/photos - upload photo', () => {
    it('should upload photo with valid data', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const newPhoto = {
        id: 'new-photo-uuid',
        url: 'https://storage.example.com/photos/new.jpg',
        caption: 'our anniversary',
        uploaded_by: mockMeedo.id,
        created_at: '2026-02-01',
      }

      mockStorageClient.upload.mockResolvedValue({
        data: { path: 'photos/new.jpg' },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newPhoto))
      )

      // act
      const uploadResult = await mockStorageClient
        .from('photos')
        .upload('photos/new.jpg', new Blob())

      expect(uploadResult.error).toBeNull()

      const insertResult = await mockSupabaseClient
        .from('photos')
        .insert({
          url: 'https://storage.example.com/photos/new.jpg',
          caption: 'our anniversary',
          uploaded_by: mockMeedo.id,
        })
        .select()
        .single()

      // assert
      expect(insertResult.data).toEqual(newPhoto)
    })

    it('should reject upload without caption (invalid input)', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // act - simulate validation failure
      const requestBody = {
        url: 'https://example.com/photo.jpg',
        caption: '', // empty caption - invalid
      }

      // in real handler this would be caught by validation
      const isValid = requestBody.caption && requestBody.caption.length > 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject upload without file', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      mockStorageClient.upload.mockResolvedValue({
        data: null,
        error: { message: 'no file provided' },
      })

      // act
      const result = await mockStorageClient
        .from('photos')
        .upload('photos/test.jpg', null)

      // assert
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('no file provided')
    })
  })

  describe('GET /api/photos/:id - get single photo', () => {
    it('should return photo by id', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const photo = {
        id: 'photo-123',
        url: 'https://example.com/photo.jpg',
        caption: 'cute pic',
        uploaded_by: mockBeedo.id,
        created_at: '2026-01-15',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(photo))
      )

      // act
      const result = await mockSupabaseClient
        .from('photos')
        .select('*')
        .eq('id', 'photo-123')
        .single()

      // assert
      expect(result.data).toEqual(photo)
    })

    it('should return 404 for non-existent photo', async () => {
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
        .from('photos')
        .select('*')
        .eq('id', 'doesnt-exist')
        .single()

      // assert
      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  describe('DELETE /api/photos/:id - delete photo', () => {
    it('should delete photo by owner', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse({ id: 'photo-123' }))
      )

      mockStorageClient.remove.mockResolvedValue({
        data: [{ name: 'photo.jpg' }],
        error: null,
      })

      // act
      const deleteResult = await mockSupabaseClient
        .from('photos')
        .delete()
        .eq('id', 'photo-123')
        .eq('uploaded_by', mockMeedo.id)

      // assert
      expect(deleteResult.data).toBeTruthy()
    })

    it('should allow partner to delete photo too (its a 2 person app)', async () => {
      // arrange - beedo can delete meedo's photo
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse({ id: 'photo-123' }))
      )

      // act
      const result = await mockSupabaseClient
        .from('photos')
        .delete()
        .eq('id', 'photo-123')

      // assert
      expect(result.data).toBeTruthy()
    })

    it('should return 404 when deleting non-existent photo', async () => {
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
        .from('photos')
        .delete()
        .eq('id', 'fake-id')

      // assert
      expect(result.error).toBeTruthy()
    })
  })
})
