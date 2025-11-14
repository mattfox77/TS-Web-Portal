import { describe, it, expect } from 'vitest';
import {
  createTicketSchema,
  updateTicketSchema,
  createInvoiceSchema,
  createProjectSchema,
  createClientSchema,
  validateInput,
  safeValidateInput,
  sanitizeString,
  sanitizeObject,
} from '../validation';
import { ValidationError } from '../errors';

describe('validation utilities', () => {
  describe('createTicketSchema', () => {
    it('should validate valid ticket data', () => {
      const validData = {
        title: 'Test ticket title',
        description: 'This is a test ticket description with enough characters',
        priority: 'medium' as const,
      };

      const result = createTicketSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject title that is too short', () => {
      const invalidData = {
        title: 'Test',
        description: 'This is a test ticket description',
        priority: 'medium' as const,
      };

      expect(() => createTicketSchema.parse(invalidData)).toThrow();
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        description: 'This is a test ticket description',
        priority: 'medium' as const,
      };

      expect(() => createTicketSchema.parse(invalidData)).toThrow();
    });

    it('should reject description that is too short', () => {
      const invalidData = {
        title: 'Test ticket',
        description: 'Short',
        priority: 'medium' as const,
      };

      expect(() => createTicketSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        title: 'Test ticket',
        description: 'This is a test ticket description',
        priority: 'invalid' as any,
      };

      expect(() => createTicketSchema.parse(invalidData)).toThrow();
    });

    it('should accept optional project_id', () => {
      const validData = {
        title: 'Test ticket',
        description: 'This is a test ticket description',
        priority: 'high' as const,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createTicketSchema.parse(validData);
      expect(result.project_id).toBe(validData.project_id);
    });

    it('should accept null project_id', () => {
      const validData = {
        title: 'Test ticket',
        description: 'This is a test ticket description',
        priority: 'urgent' as const,
        project_id: null,
      };

      const result = createTicketSchema.parse(validData);
      expect(result.project_id).toBeNull();
    });
  });

  describe('updateTicketSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        status: 'in_progress' as const,
      };

      const result = updateTicketSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept multiple fields', () => {
      const validData = {
        status: 'resolved' as const,
        priority: 'low' as const,
      };

      const result = updateTicketSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status' as any,
      };

      expect(() => updateTicketSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createInvoiceSchema', () => {
    it('should validate valid invoice data', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        line_items: [
          {
            description: 'Service 1',
            quantity: 2,
            unit_price: 50.00,
          },
          {
            description: 'Service 2',
            quantity: 1,
            unit_price: 100.00,
          },
        ],
        due_date: '2024-12-31',
        tax_rate: 0.08,
      };

      const result = createInvoiceSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should require at least one line item', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        line_items: [],
        due_date: '2024-12-31',
      };

      expect(() => createInvoiceSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        line_items: [
          {
            description: 'Service 1',
            quantity: -1,
            unit_price: 50.00,
          },
        ],
        due_date: '2024-12-31',
      };

      expect(() => createInvoiceSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative unit price', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        line_items: [
          {
            description: 'Service 1',
            quantity: 1,
            unit_price: -50.00,
          },
        ],
        due_date: '2024-12-31',
      };

      expect(() => createInvoiceSchema.parse(invalidData)).toThrow();
    });

    it('should default tax_rate to 0 if not provided', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        line_items: [
          {
            description: 'Service 1',
            quantity: 1,
            unit_price: 50.00,
          },
        ],
        due_date: '2024-12-31',
      };

      const result = createInvoiceSchema.parse(validData);
      expect(result.tax_rate).toBe(0);
    });
  });

  describe('createProjectSchema', () => {
    it('should validate valid project data', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        description: 'This is a test project',
        status: 'active' as const,
      };

      const result = createProjectSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should default status to planning', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
      };

      const result = createProjectSchema.parse(validData);
      expect(result.status).toBe('planning');
    });

    it('should accept valid github_repo URL', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        github_repo: 'https://github.com/user/repo',
      };

      const result = createProjectSchema.parse(validData);
      expect(result.github_repo).toBe(validData.github_repo);
    });

    it('should reject invalid github_repo URL', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        github_repo: 'not-a-url',
      };

      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createClientSchema', () => {
    it('should validate valid client data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Acme Corp',
        phone: '555-1234',
      };

      const result = createClientSchema.parse(validData);
      expect(result).toEqual({ ...validData, status: 'active' });
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
      };

      expect(() => createClientSchema.parse(invalidData)).toThrow();
    });

    it('should default status to active', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = createClientSchema.parse(validData);
      expect(result.status).toBe('active');
    });
  });

  describe('validateInput', () => {
    it('should return validated data for valid input', () => {
      const schema = createTicketSchema;
      const validData = {
        title: 'Test ticket',
        description: 'This is a test ticket description',
        priority: 'medium' as const,
      };

      const result = validateInput(schema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid input', () => {
      const schema = createTicketSchema;
      const invalidData = {
        title: 'Test',
        description: 'Short',
        priority: 'medium' as const,
      };

      expect(() => validateInput(schema, invalidData)).toThrow(ValidationError);
    });

    it('should include field-specific errors in ValidationError', () => {
      const schema = createTicketSchema;
      const invalidData = {
        title: 'Test',
        description: 'Short',
        priority: 'medium' as const,
      };

      try {
        validateInput(schema, invalidData);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.details).toBeDefined();
          expect(error.details).toHaveProperty('title');
          expect(error.details).toHaveProperty('description');
        }
      }
    });
  });

  describe('safeValidateInput', () => {
    it('should return success result for valid input', () => {
      const schema = createTicketSchema;
      const validData = {
        title: 'Test ticket',
        description: 'This is a test ticket description',
        priority: 'medium' as const,
      };

      const result = safeValidateInput(schema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return error result for invalid input', () => {
      const schema = createTicketSchema;
      const invalidData = {
        title: 'Test',
        description: 'Short',
        priority: 'medium' as const,
      };

      const result = safeValidateInput(schema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors).toHaveProperty('title');
        expect(result.errors).toHaveProperty('description');
      }
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '  John  ',
        email: 'john@example.com\0',
        age: 30,
      };

      const result = sanitizeObject(input);
      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '  Jane  ',
          email: 'jane@example.com',
        },
        count: 5,
      };

      const result = sanitizeObject(input);
      expect(result).toEqual({
        user: {
          name: 'Jane',
          email: 'jane@example.com',
        },
        count: 5,
      });
    });

    it('should handle empty object', () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });
  });
});
