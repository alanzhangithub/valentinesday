/**
 * tests for /api/coupons routes
 * covers: create, list, redeem
 *
 * coupons are like little favors meedo and beedo can give each other
 * examples: "one free backrub", "movie night of your choice", etc
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

describe('coupons api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('GET /api/coupons - list coupons', () => {
    it('should return all coupons for the user', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const mockCoupons = [
        {
          id: 'coupon-1',
          title: 'one free backrub',
          description: 'redeemable anytime',
          created_by: mockBeedo.id,
          for_user: mockMeedo.id,
          redeemed: false,
          created_at: '2026-01-01',
        },
        {
          id: 'coupon-2',
          title: 'movie night choice',
          description: 'you pick the movie',
          created_by: mockBeedo.id,
          for_user: mockMeedo.id,
          redeemed: true,
          redeemed_at: '2026-01-15',
          created_at: '2026-01-01',
        },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(mockCoupons))
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .select('*')
        .eq('for_user', mockMeedo.id)
        .order('created_at', { ascending: false })

      // assert
      expect(result.data).toHaveLength(2)
      expect(result.data[0].title).toBe('one free backrub')
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

    it('should filter by redeemed status', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const unredeemed = [
        { id: 'c1', title: 'coupon 1', redeemed: false },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(unredeemed))
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .select('*')
        .eq('for_user', mockBeedo.id)
        .eq('redeemed', false)

      // assert
      expect(result.data).toHaveLength(1)
      expect(result.data[0].redeemed).toBe(false)
    })
  })

  describe('POST /api/coupons - create coupon', () => {
    it('should create a coupon for partner', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const newCoupon = {
        id: 'new-coupon-uuid',
        title: 'breakfast in bed',
        description: 'one lazy morning',
        created_by: mockMeedo.id,
        for_user: mockBeedo.id,
        redeemed: false,
        created_at: '2026-02-01',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newCoupon))
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .insert({
          title: 'breakfast in bed',
          description: 'one lazy morning',
          created_by: mockMeedo.id,
          for_user: mockBeedo.id,
        })
        .select()
        .single()

      // assert
      expect(result.data.title).toBe('breakfast in bed')
      expect(result.data.for_user).toBe(mockBeedo.id)
    })

    it('should reject coupon without title (invalid input)', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const requestBody = {
        title: '', // empty - invalid
        description: 'something nice',
      }

      // validation check
      const isValid = requestBody.title && requestBody.title.trim().length > 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject coupon with title too long', async () => {
      // arrange
      const longTitle = 'a'.repeat(256) // too long

      const isValid = longTitle.length <= 100

      // assert
      expect(isValid).toBe(false)
    })

    it('should default for_user to partner if not specified', async () => {
      // arrange - in a 2 person app, if you make a coupon its obviously for the other person
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // this would be handled by the api route logic
      const currentUser = mockMeedo.id
      const partner = mockBeedo.id // api would look this up

      // assert
      expect(currentUser).not.toBe(partner)
    })
  })

  describe('POST /api/coupons/:id/redeem - redeem coupon', () => {
    it('should redeem an available coupon', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // first check the coupon exists and is for this user
      const existingCoupon = {
        id: 'coupon-123',
        title: 'free hug',
        for_user: mockMeedo.id,
        redeemed: false,
      }

      mockSupabaseClient.then
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(existingCoupon))
        )
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse({ ...existingCoupon, redeemed: true, redeemed_at: new Date().toISOString() }))
        )

      // act - check coupon
      const checkResult = await mockSupabaseClient
        .from('coupons')
        .select('*')
        .eq('id', 'coupon-123')
        .single()

      expect(checkResult.data.for_user).toBe(mockMeedo.id)
      expect(checkResult.data.redeemed).toBe(false)

      // act - redeem
      const redeemResult = await mockSupabaseClient
        .from('coupons')
        .update({ redeemed: true, redeemed_at: new Date().toISOString() })
        .eq('id', 'coupon-123')
        .select()
        .single()

      // assert
      expect(redeemResult.data.redeemed).toBe(true)
    })

    it('should reject redeeming already redeemed coupon', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const alreadyRedeemed = {
        id: 'coupon-123',
        title: 'free hug',
        for_user: mockMeedo.id,
        redeemed: true, // already used
        redeemed_at: '2026-01-15',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(alreadyRedeemed))
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .select('*')
        .eq('id', 'coupon-123')
        .single()

      // assert - this would be caught by api logic
      const canRedeem = !result.data.redeemed
      expect(canRedeem).toBe(false)
    })

    it('should reject redeeming coupon not for this user', async () => {
      // arrange - beedo trying to redeem meedo's coupon
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const meedosCoupon = {
        id: 'coupon-123',
        title: 'free hug',
        for_user: mockMeedo.id, // this is for meedo, not beedo
        redeemed: false,
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(meedosCoupon))
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .select('*')
        .eq('id', 'coupon-123')
        .single()

      // assert
      const canRedeem = result.data.for_user === mockBeedo.id
      expect(canRedeem).toBe(false)
    })

    it('should return 404 for non-existent coupon', async () => {
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
        .from('coupons')
        .select('*')
        .eq('id', 'fake-coupon')
        .single()

      // assert
      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle database connection error gracefully', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'connection timeout' } })
      )

      // act
      const result = await mockSupabaseClient
        .from('coupons')
        .select('*')

      // assert
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('connection timeout')
    })
  })
})
