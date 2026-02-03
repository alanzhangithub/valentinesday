// mock supabase client for testing
// this lets us control what the db returns in each test

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  // chain methods return promises
  then: jest.fn((resolve) => resolve({ data: null, error: null })),
}

// helper to reset all mocks between tests
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach((mock) => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach((m) => {
        if (jest.isMockFunction(m)) m.mockReset()
      })
    }
    if (jest.isMockFunction(mock)) mock.mockReset()
  })
  // reset chain to return self
  mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.neq.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.gt.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.lt.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.in.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.is.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.order.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.limit.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.single.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.maybeSingle.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.range.mockReturnValue(mockSupabaseClient)
}

// helper to mock a successful response
export const mockSupabaseResponse = (data: unknown, error: unknown = null) => {
  return Promise.resolve({ data, error })
}

// helper to mock an error response
export const mockSupabaseError = (message: string, code?: string) => {
  return Promise.resolve({
    data: null,
    error: { message, code },
  })
}

// mock users for testing
export const mockMeedo = {
  id: 'meedo-uuid-123',
  email: 'meedo@test.com',
  user_metadata: { name: 'Meedo' },
}

export const mockBeedo = {
  id: 'beedo-uuid-456',
  email: 'beedo@test.com',
  user_metadata: { name: 'Beedo' },
}

// mock storage client
export const mockStorageClient = {
  from: jest.fn(() => mockStorageClient),
  upload: jest.fn(),
  download: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
  list: jest.fn(),
}

// jest mock for the actual supabase module
jest.mock('@/src/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
}))
