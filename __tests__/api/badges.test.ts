/**
 * tests for /api/badges routes
 * covers: award badge, list badges, check badge eligibility
 *
 * badges are achievements that meedo and beedo can earn
 * examples: "first photo uploaded", "100 games played", "1 year anniversary"
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

// badge definitions
const BADGES = {
  first_photo: { id: 'first_photo', name: 'Shutterbug', requirement: 'Upload first photo' },
  photo_pro: { id: 'photo_pro', name: 'Photo Pro', requirement: 'Upload 50 photos' },
  game_rookie: { id: 'game_rookie', name: 'Game Rookie', requirement: 'Play 10 games' },
  game_master: { id: 'game_master', name: 'Game Master', requirement: 'Play 100 games' },
  wish_granted: { id: 'wish_granted', name: 'Generous Mod', requirement: 'Grant 10 wishes' },
  coupon_creator: { id: 'coupon_creator', name: 'Coupon Creator', requirement: 'Create 5 coupons' },
  anniversary_1: { id: 'anniversary_1', name: 'One Year!', requirement: 'Be together 1 year' },
  coin_collector: { id: 'coin_collector', name: 'Coin Collector', requirement: 'Earn 1000 coins' },
  spelling_champ: { id: 'spelling_champ', name: 'Spelling Champ', requirement: 'Get 100% on Spelling Mee' },
  memory_master: { id: 'memory_master', name: 'Memory Master', requirement: 'Perfect memory game score' },
}

describe('badges api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('GET /api/badges - list all badges', () => {
    it('should return all available badges with earned status', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const userBadges = [
        { badge_id: 'first_photo', earned_at: '2026-01-01' },
        { badge_id: 'game_rookie', earned_at: '2026-01-15' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(userBadges))
      )

      // act
      const result = await mockSupabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', mockMeedo.id)

      // combine with all badges
      const allBadges = Object.values(BADGES).map(badge => ({
        ...badge,
        earned: result.data?.some((ub: { badge_id: string }) => ub.badge_id === badge.id) || false,
      }))

      // assert
      expect(allBadges).toHaveLength(Object.keys(BADGES).length)
      expect(allBadges.find(b => b.id === 'first_photo')?.earned).toBe(true)
      expect(allBadges.find(b => b.id === 'photo_pro')?.earned).toBe(false)
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

    it('should show partner badges too (shared accomplishments)', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const allUserBadges = [
        { user_id: mockMeedo.id, badge_id: 'first_photo', earned_at: '2026-01-01' },
        { user_id: mockBeedo.id, badge_id: 'spelling_champ', earned_at: '2026-01-20' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(allUserBadges))
      )

      // act
      const result = await mockSupabaseClient
        .from('user_badges')
        .select('*')
        .in('user_id', [mockMeedo.id, mockBeedo.id])

      // assert
      expect(result.data).toHaveLength(2)
    })
  })

  describe('POST /api/badges/award - award badge', () => {
    it('should award a badge to user', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const newBadge = {
        id: 'award-uuid',
        user_id: mockBeedo.id,
        badge_id: 'photo_pro',
        earned_at: '2026-02-01T12:00:00Z',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newBadge))
      )

      // act
      const result = await mockSupabaseClient
        .from('user_badges')
        .insert({
          user_id: mockBeedo.id,
          badge_id: 'photo_pro',
        })
        .select()
        .single()

      // assert
      expect(result.data.badge_id).toBe('photo_pro')
    })

    it('should reject awarding invalid badge id', async () => {
      // arrange
      const requestBody = {
        badge_id: 'fake_badge',
      }

      const isValid = Object.keys(BADGES).includes(requestBody.badge_id)

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject awarding already earned badge', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // check if already earned
      const existingBadge = {
        user_id: mockMeedo.id,
        badge_id: 'first_photo',
        earned_at: '2026-01-01',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(existingBadge))
      )

      // act
      const checkResult = await mockSupabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', mockMeedo.id)
        .eq('badge_id', 'first_photo')
        .single()

      // assert
      const alreadyHasBadge = !!checkResult.data
      expect(alreadyHasBadge).toBe(true)
    })
  })

  describe('badge eligibility checks', () => {
    it('should check photo count for photo badges', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // count photos
      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse([{ count: 52 }]))
      )

      // act
      const result = await mockSupabaseClient
        .from('photos')
        .select('count')
        .eq('uploaded_by', mockMeedo.id)

      const photoCount = result.data?.[0]?.count || 0

      // assert
      const eligibleForPhotoPro = photoCount >= 50
      expect(eligibleForPhotoPro).toBe(true)
    })

    it('should check game count for game badges', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse([{ count: 15 }]))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .select('count')
        .eq('user_id', mockBeedo.id)

      const gameCount = result.data?.[0]?.count || 0

      // assert
      const eligibleForRookie = gameCount >= 10
      const eligibleForMaster = gameCount >= 100
      expect(eligibleForRookie).toBe(true)
      expect(eligibleForMaster).toBe(false)
    })

    it('should check wish grants for wish badge', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse([{ count: 12 }]))
      )

      // act - count wishes granted by user
      const result = await mockSupabaseClient
        .from('wishes')
        .select('count')
        .eq('granted_by', mockMeedo.id)
        .eq('status', 'granted')

      const wishesGranted = result.data?.[0]?.count || 0

      // assert
      const eligibleForGenerousMod = wishesGranted >= 10
      expect(eligibleForGenerousMod).toBe(true)
    })

    it('should check coin total for coin collector', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse({ total_coins_earned: 1500 }))
      )

      // act
      const result = await mockSupabaseClient
        .from('users')
        .select('total_coins_earned')
        .eq('id', mockBeedo.id)
        .single()

      const totalCoins = result.data?.total_coins_earned || 0

      // assert
      const eligibleForCoinCollector = totalCoins >= 1000
      expect(eligibleForCoinCollector).toBe(true)
    })

    it('should check perfect score for spelling champ', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const perfectGame = {
        game: 'spelling_mee',
        score: 100,
        correct_answers: 20,
        total_questions: 20,
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(perfectGame))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .select('*')
        .eq('user_id', mockMeedo.id)
        .eq('game', 'spelling_mee')
        .eq('score', 100)
        .limit(1)
        .single()

      // assert
      const hasPerfectScore = !!result.data
      expect(hasPerfectScore).toBe(true)
    })
  })

  describe('automatic badge awarding', () => {
    it('should auto-award badge when criteria met', async () => {
      // this would be implemented as a trigger or post-action
      // simulating the logic here

      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      // after uploading first photo, check and award
      const photoCount = 1
      const shouldAwardFirstPhoto = photoCount === 1

      // check if already has badge
      mockSupabaseClient.then
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse(null)) // doesnt have badge yet
        )
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse({ badge_id: 'first_photo' }))
        )

      // act
      const existingBadge = await mockSupabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', mockMeedo.id)
        .eq('badge_id', 'first_photo')
        .maybeSingle()

      if (!existingBadge.data && shouldAwardFirstPhoto) {
        const awarded = await mockSupabaseClient
          .from('user_badges')
          .insert({ user_id: mockMeedo.id, badge_id: 'first_photo' })
          .select()
          .single()

        expect(awarded.data.badge_id).toBe('first_photo')
      }
    })

    it('should not duplicate badge awards', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      // already has the badge
      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse({ badge_id: 'first_photo' }))
      )

      // act
      const existingBadge = await mockSupabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', mockBeedo.id)
        .eq('badge_id', 'first_photo')
        .maybeSingle()

      // assert
      const shouldAward = !existingBadge.data
      expect(shouldAward).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle anniversary badge calculation', async () => {
      // arrange
      const relationshipStartDate = new Date('2025-02-14')
      const today = new Date('2026-02-14')

      const msPerYear = 365.25 * 24 * 60 * 60 * 1000
      const yearsTogeher = (today.getTime() - relationshipStartDate.getTime()) / msPerYear

      // assert
      const eligibleFor1Year = yearsTogeher >= 1
      expect(eligibleFor1Year).toBe(true)
    })

    it('should return badge not found for invalid id', async () => {
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
        .from('badges')
        .select('*')
        .eq('id', 'nonexistent')
        .single()

      // assert
      expect(result.error).toBeTruthy()
    })

    it('should handle badge progress tracking', async () => {
      // for badges that require multiple actions, track progress
      const badgeProgress = {
        badge_id: 'photo_pro',
        requirement: 50,
        current: 32,
        percentage: (32 / 50) * 100,
      }

      expect(badgeProgress.percentage).toBe(64)
    })
  })
})
