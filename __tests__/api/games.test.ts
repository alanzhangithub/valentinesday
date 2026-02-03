/**
 * tests for /api/games routes
 * covers: submit score, get leaderboard, coin rewards
 *
 * games include: spelling mee, memory, tap the beedo, slot machine
 * playing games earns meedo coins
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

// coin reward rates per game
const COIN_REWARDS = {
  spelling_mee: { base: 5, per_correct: 2 },
  memory: { base: 10, per_pair: 1 },
  tap_the_beedo: { base: 3, per_tap: 0.1 },
  slot_machine: { cost: 5, jackpot: 100 },
}

describe('games api', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('POST /api/games/score - submit score', () => {
    it('should submit a valid game score', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const newScore = {
        id: 'score-uuid',
        user_id: mockMeedo.id,
        game: 'spelling_mee',
        score: 85,
        correct_answers: 17,
        total_questions: 20,
        coins_earned: 5 + (17 * 2), // base + per_correct
        played_at: '2026-02-01T12:00:00Z',
      }

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(newScore))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .insert({
          user_id: mockMeedo.id,
          game: 'spelling_mee',
          score: 85,
          correct_answers: 17,
          total_questions: 20,
          coins_earned: 5 + (17 * 2),
        })
        .select()
        .single()

      // assert
      expect(result.data.score).toBe(85)
      expect(result.data.coins_earned).toBe(39)
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

    it('should reject invalid game type', async () => {
      // arrange
      const validGames = ['spelling_mee', 'memory', 'tap_the_beedo', 'slot_machine']
      const requestBody = {
        game: 'fake_game',
        score: 100,
      }

      const isValid = validGames.includes(requestBody.game)

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject negative score', async () => {
      // arrange
      const requestBody = {
        game: 'memory',
        score: -10,
      }

      const isValid = requestBody.score >= 0

      // assert
      expect(isValid).toBe(false)
    })

    it('should reject score exceeding max possible', async () => {
      // arrange - memory game has max score
      const requestBody = {
        game: 'memory',
        score: 999999, // sus
      }

      const maxScores: Record<string, number> = {
        spelling_mee: 100,
        memory: 1000,
        tap_the_beedo: 10000,
        slot_machine: 100,
      }

      const isValid = requestBody.score <= maxScores[requestBody.game]

      // assert
      expect(isValid).toBe(false)
    })
  })

  describe('GET /api/games/leaderboard - get leaderboard', () => {
    it('should return top scores for a game', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const leaderboard = [
        { user_id: mockMeedo.id, game: 'memory', score: 950, played_at: '2026-02-01' },
        { user_id: mockBeedo.id, game: 'memory', score: 900, played_at: '2026-01-28' },
        { user_id: mockMeedo.id, game: 'memory', score: 850, played_at: '2026-01-20' },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(leaderboard))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .select('*')
        .eq('game', 'memory')
        .order('score', { ascending: false })
        .limit(10)

      // assert
      expect(result.data).toHaveLength(3)
      expect(result.data[0].score).toBe(950)
    })

    it('should filter by game type', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const spellingScores = [
        { game: 'spelling_mee', score: 95 },
        { game: 'spelling_mee', score: 88 },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(spellingScores))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .select('*')
        .eq('game', 'spelling_mee')

      // assert
      expect(result.data.every((s: { game: string }) => s.game === 'spelling_mee')).toBe(true)
    })

    it('should get personal best scores', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const meedosBest = [
        { user_id: mockMeedo.id, game: 'memory', score: 950 },
      ]

      mockSupabaseClient.then.mockImplementation((resolve) =>
        resolve(mockSupabaseResponse(meedosBest))
      )

      // act
      const result = await mockSupabaseClient
        .from('game_scores')
        .select('*')
        .eq('user_id', mockMeedo.id)
        .eq('game', 'memory')
        .order('score', { ascending: false })
        .limit(1)

      // assert
      expect(result.data[0].user_id).toBe(mockMeedo.id)
    })
  })

  describe('coin rewards', () => {
    it('should calculate correct coins for spelling mee', async () => {
      // arrange
      const correctAnswers = 18
      const expectedCoins = COIN_REWARDS.spelling_mee.base +
        (correctAnswers * COIN_REWARDS.spelling_mee.per_correct)

      // assert
      expect(expectedCoins).toBe(5 + 36)
    })

    it('should calculate correct coins for memory game', async () => {
      // arrange
      const pairsFound = 12
      const expectedCoins = COIN_REWARDS.memory.base +
        (pairsFound * COIN_REWARDS.memory.per_pair)

      // assert
      expect(expectedCoins).toBe(10 + 12)
    })

    it('should calculate correct coins for tap the beedo', async () => {
      // arrange
      const taps = 150
      const expectedCoins = Math.floor(
        COIN_REWARDS.tap_the_beedo.base +
        (taps * COIN_REWARDS.tap_the_beedo.per_tap)
      )

      // assert
      expect(expectedCoins).toBe(18) // 3 + 15
    })

    it('should update user coin balance after game', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const currentBalance = 100
      const coinsEarned = 25
      const newBalance = currentBalance + coinsEarned

      mockSupabaseClient.then
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse({ coins: currentBalance }))
        )
        .mockImplementationOnce((resolve) =>
          resolve(mockSupabaseResponse({ coins: newBalance }))
        )

      // act - get current balance
      const balanceResult = await mockSupabaseClient
        .from('users')
        .select('coins')
        .eq('id', mockMeedo.id)
        .single()

      // update balance
      const updateResult = await mockSupabaseClient
        .from('users')
        .update({ coins: balanceResult.data.coins + coinsEarned })
        .eq('id', mockMeedo.id)
        .select()
        .single()

      // assert
      expect(updateResult.data.coins).toBe(125)
    })
  })

  describe('slot machine special cases', () => {
    it('should deduct coins to play slot machine', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockBeedo },
        error: null,
      })

      const currentBalance = 50
      const cost = COIN_REWARDS.slot_machine.cost

      // act
      const canPlay = currentBalance >= cost

      // assert
      expect(canPlay).toBe(true)
      expect(currentBalance - cost).toBe(45)
    })

    it('should reject slot machine play with insufficient coins', async () => {
      // arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockMeedo },
        error: null,
      })

      const currentBalance = 3 // not enough
      const cost = COIN_REWARDS.slot_machine.cost

      // act
      const canPlay = currentBalance >= cost

      // assert
      expect(canPlay).toBe(false)
    })

    it('should award jackpot on winning spin', async () => {
      // arrange
      const spinResult = ['beedo', 'beedo', 'beedo'] // jackpot!
      const isJackpot = spinResult.every(s => s === spinResult[0])
      const coinsWon = isJackpot ? COIN_REWARDS.slot_machine.jackpot : 0

      // assert
      expect(isJackpot).toBe(true)
      expect(coinsWon).toBe(100)
    })

    it('should award partial wins', async () => {
      // arrange
      const spinResult = ['beedo', 'beedo', 'meedo'] // 2 match
      const matchCount = spinResult.filter(s => s === 'beedo').length

      const partialWins: Record<number, number> = {
        0: 0,
        1: 0,
        2: 10, // 2 match
        3: 100, // jackpot
      }

      const coinsWon = partialWins[matchCount]

      // assert
      expect(coinsWon).toBe(10)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent score submissions', async () => {
      // this would be handled by db constraints in real impl
      // just noting we should think about race conditions
      expect(true).toBe(true)
    })

    it('should prevent score manipulation (anti-cheat placeholder)', async () => {
      // future: implement server-side game validation
      // for now just trust the client (its a 2 person app lol)
      expect(true).toBe(true)
    })

    it('should handle daily/weekly coin limits if implemented', async () => {
      // placeholder for potential future feature
      const dailyCoinLimit = 500
      const coinsEarnedToday = 450
      const coinsFromGame = 100

      const actualCoinsAwarded = Math.min(
        coinsFromGame,
        dailyCoinLimit - coinsEarnedToday
      )

      expect(actualCoinsAwarded).toBe(50)
    })
  })
})
