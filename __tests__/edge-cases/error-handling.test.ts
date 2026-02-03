/**
 * Error Handling Edge Cases Tests
 *
 * Tests error handling scenarios including:
 * - Network failures
 * - Missing data
 * - Timeouts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

type UserId = 'meedo' | 'beedo';

// Error codes
const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Simulate network conditions
let networkEnabled = true;
let networkLatency = 0;
let errorRate = 0;
let rateLimitRemaining = 100;

// Helper functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const simulateNetworkCall = async <T>(
  operation: () => Promise<T>,
  timeout: number = 5000
): Promise<ApiResponse<T>> => {
  // Check if network is available
  if (!networkEnabled) {
    return {
      success: false,
      error: {
        code: ErrorCodes.NETWORK_ERROR,
        message: 'No network connection',
        retryable: true,
      },
    };
  }

  // Check rate limit
  if (rateLimitRemaining <= 0) {
    return {
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Rate limit exceeded',
        retryable: true,
      },
    };
  }
  rateLimitRemaining--;

  // Simulate random errors
  if (Math.random() < errorRate) {
    return {
      success: false,
      error: {
        code: ErrorCodes.SERVER_ERROR,
        message: 'Internal server error',
        retryable: true,
      },
    };
  }

  // Create timeout promise
  const timeoutPromise = new Promise<ApiResponse<T>>((_, reject) => {
    setTimeout(() => {
      reject({
        success: false,
        error: {
          code: ErrorCodes.TIMEOUT,
          message: `Request timed out after ${timeout}ms`,
          retryable: true,
        },
      });
    }, timeout);
  });

  // Add network latency
  const operationPromise = (async () => {
    await delay(networkLatency);
    const result = await operation();
    return { success: true, data: result } as ApiResponse<T>;
  })();

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } catch (error) {
    return error as ApiResponse<T>;
  }
};

// Retry with exponential backoff
const withRetry = async <T>(
  operation: () => Promise<ApiResponse<T>>,
  config: RetryConfig = { maxRetries: 3, baseDelay: 100, maxDelay: 5000 }
): Promise<ApiResponse<T>> => {
  let lastError: ApiResponse<T> | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const result = await operation();

    if (result.success) {
      return result;
    }

    lastError = result;

    // Don't retry non-retryable errors
    if (!result.error?.retryable) {
      return result;
    }

    // Don't retry after last attempt
    if (attempt === config.maxRetries) {
      break;
    }

    // Exponential backoff
    const delayMs = Math.min(
      config.baseDelay * Math.pow(2, attempt),
      config.maxDelay
    );
    await delay(delayMs);
  }

  return lastError || {
    success: false,
    error: {
      code: 'UNKNOWN',
      message: 'Unknown error',
      retryable: false,
    },
  };
};

// Mock API operations
const fetchUserBalance = async (userId: UserId): Promise<number> => {
  if (userId !== 'meedo' && userId !== 'beedo') {
    throw new Error('User not found');
  }
  return 100;
};

const fetchPhotos = async (): Promise<string[]> => {
  return ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
};

const fetchCoupon = async (couponId: string): Promise<{ id: string; title: string } | null> => {
  if (couponId === 'valid') {
    return { id: 'valid', title: 'Test Coupon' };
  }
  return null;
};

// Graceful degradation helpers
const getCachedData = <T>(key: string): T | null => {
  // Simulated cache lookup
  const cache: Record<string, unknown> = {
    'user:meedo:balance': 95,
    'photos:recent': ['cached1.jpg', 'cached2.jpg'],
  };
  return (cache[key] as T) || null;
};

const withFallback = async <T>(
  primary: () => Promise<ApiResponse<T>>,
  fallback: () => T | null
): Promise<ApiResponse<T>> => {
  const result = await primary();

  if (result.success) {
    return result;
  }

  const fallbackData = fallback();
  if (fallbackData !== null) {
    return {
      success: true,
      data: fallbackData,
    };
  }

  return result;
};

describe('Error Handling Edge Cases', () => {
  beforeEach(() => {
    networkEnabled = true;
    networkLatency = 0;
    errorRate = 0;
    rateLimitRemaining = 100;
  });

  describe('Network Failures', () => {
    it('should handle complete network failure', async () => {
      networkEnabled = false;

      const result = await simulateNetworkCall(() => fetchUserBalance('meedo'));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(result.error?.retryable).toBe(true);
    });

    it('should return error for offline state', async () => {
      networkEnabled = false;

      const result = await simulateNetworkCall(() => fetchPhotos());

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('network');
    });

    it('should recover when network comes back', async () => {
      networkEnabled = false;

      const failedResult = await simulateNetworkCall(() => fetchUserBalance('meedo'));
      expect(failedResult.success).toBe(false);

      // Network recovers
      networkEnabled = true;

      const successResult = await simulateNetworkCall(() => fetchUserBalance('meedo'));
      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe(100);
    });

    it('should handle intermittent connectivity', async () => {
      let attempts = 0;

      const result = await withRetry(async () => {
        attempts++;
        // Fail first 2 attempts, succeed on 3rd
        if (attempts < 3) {
          networkEnabled = false;
          return simulateNetworkCall(() => fetchUserBalance('meedo'));
        }
        networkEnabled = true;
        return simulateNetworkCall(() => fetchUserBalance('meedo'));
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('Missing Data', () => {
    it('should handle missing user gracefully', async () => {
      const result = await simulateNetworkCall(async () => {
        throw new Error('User not found');
      });

      // Should not crash, should return error response
      expect(result.success).toBe(false);
    });

    it('should handle null coupon lookup', async () => {
      const result = await simulateNetworkCall(() => fetchCoupon('nonexistent'));

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle empty photo gallery', async () => {
      const result = await simulateNetworkCall(async () => [] as string[]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should use cached data when primary fails', async () => {
      networkEnabled = false;

      const result = await withFallback(
        () => simulateNetworkCall(() => fetchUserBalance('meedo')),
        () => getCachedData<number>('user:meedo:balance')
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(95); // Cached value
    });

    it('should return error when no cache available', async () => {
      networkEnabled = false;

      const result = await withFallback(
        () => simulateNetworkCall(() => fetchUserBalance('beedo')),
        () => getCachedData<number>('user:beedo:balance') // Not in cache
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout on slow response', async () => {
      networkLatency = 200; // 200ms latency

      const result = await simulateNetworkCall(
        () => fetchUserBalance('meedo'),
        100 // 100ms timeout
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.TIMEOUT);
    });

    it('should succeed if response arrives before timeout', async () => {
      networkLatency = 50;

      const result = await simulateNetworkCall(
        () => fetchUserBalance('meedo'),
        100
      );

      expect(result.success).toBe(true);
    });

    it('should retry on timeout with backoff', async () => {
      let attempts = 0;

      const result = await withRetry(
        async () => {
          attempts++;
          // First attempt times out, subsequent ones succeed
          networkLatency = attempts === 1 ? 200 : 10;
          return simulateNetworkCall(() => fetchPhotos(), 100);
        },
        { maxRetries: 2, baseDelay: 10, maxDelay: 100 }
      );

      expect(result.success).toBe(true);
      expect(attempts).toBeGreaterThan(1);
    });

    it('should fail after max retries on persistent timeout', async () => {
      networkLatency = 500;

      const result = await withRetry(
        () => simulateNetworkCall(() => fetchUserBalance('meedo'), 100),
        { maxRetries: 2, baseDelay: 10, maxDelay: 50 }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.TIMEOUT);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit errors', async () => {
      rateLimitRemaining = 0;

      const result = await simulateNetworkCall(() => fetchUserBalance('meedo'));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.RATE_LIMITED);
    });

    it('should retry rate limited requests', async () => {
      rateLimitRemaining = 0;
      let attempts = 0;

      const result = await withRetry(
        async () => {
          attempts++;
          // Rate limit clears after first attempt
          if (attempts > 1) rateLimitRemaining = 100;
          return simulateNetworkCall(() => fetchUserBalance('meedo'));
        },
        { maxRetries: 2, baseDelay: 10, maxDelay: 50 }
      );

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Server Errors', () => {
    it('should handle 500 errors', async () => {
      errorRate = 1; // 100% error rate

      const result = await simulateNetworkCall(() => fetchPhotos());

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
    });

    it('should retry server errors with exponential backoff', async () => {
      let attempts = 0;

      const result = await withRetry(
        async () => {
          attempts++;
          // Fail first 2, succeed on 3rd
          errorRate = attempts < 3 ? 1 : 0;
          return simulateNetworkCall(() => fetchCoupon('valid'));
        },
        { maxRetries: 3, baseDelay: 10, maxDelay: 100 }
      );

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('Validation Errors', () => {
    it('should not retry validation errors', async () => {
      let attempts = 0;

      const result = await withRetry(async () => {
        attempts++;
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid input',
            retryable: false, // Not retryable
          },
        };
      });

      expect(result.success).toBe(false);
      expect(attempts).toBe(1); // Should not retry
    });

    it('should not retry unauthorized errors', async () => {
      let attempts = 0;

      const result = await withRetry(async () => {
        attempts++;
        return {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Invalid token',
            retryable: false,
          },
        };
      });

      expect(attempts).toBe(1);
    });
  });

  describe('Graceful Degradation', () => {
    it('should show cached content when API fails', async () => {
      networkEnabled = false;

      const photos = await withFallback(
        () => simulateNetworkCall(() => fetchPhotos()),
        () => getCachedData<string[]>('photos:recent')
      );

      expect(photos.success).toBe(true);
      expect(photos.data).toEqual(['cached1.jpg', 'cached2.jpg']);
    });

    it('should provide partial data when some requests fail', async () => {
      // Simulate fetching multiple resources
      const results = await Promise.all([
        simulateNetworkCall(() => Promise.resolve({ type: 'balance', value: 100 })),
        (async () => {
          networkEnabled = false;
          return simulateNetworkCall(() => Promise.resolve({ type: 'photos', value: [] }));
        })(),
      ]);

      // First succeeds, second fails
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);

      // App should still work with partial data
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBe(1);
    });

    it('should queue operations for retry when offline', async () => {
      const operationQueue: Array<() => Promise<ApiResponse<unknown>>> = [];

      networkEnabled = false;

      // Queue operation for later
      const operation = () => simulateNetworkCall(() => fetchUserBalance('meedo'));
      operationQueue.push(operation);

      expect(operationQueue.length).toBe(1);

      // When network comes back, process queue
      networkEnabled = true;
      const results = await Promise.all(operationQueue.map(op => op()));

      expect(results[0].success).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should reset rate limit counter after success', async () => {
      // Near rate limit
      rateLimitRemaining = 1;

      const result1 = await simulateNetworkCall(() => fetchUserBalance('meedo'));
      expect(result1.success).toBe(true);

      // Now at limit
      const result2 = await simulateNetworkCall(() => fetchUserBalance('meedo'));
      expect(result2.success).toBe(false);
      expect(result2.error?.code).toBe(ErrorCodes.RATE_LIMITED);

      // Simulate rate limit reset
      rateLimitRemaining = 100;

      const result3 = await simulateNetworkCall(() => fetchUserBalance('meedo'));
      expect(result3.success).toBe(true);
    });

    it('should clear error state after successful retry', async () => {
      let hasError = false;

      const result = await withRetry(async () => {
        if (!hasError) {
          hasError = true;
          return {
            success: false,
            error: {
              code: ErrorCodes.SERVER_ERROR,
              message: 'Temporary error',
              retryable: true,
            },
          };
        }
        return { success: true, data: 'recovered' };
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('recovered');
    });
  });
});
