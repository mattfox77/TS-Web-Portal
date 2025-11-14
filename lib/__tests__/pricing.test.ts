import { describe, it, expect } from 'vitest';
import {
  calculateTokenCost,
  calculateTotalTokens,
  formatCost,
  aggregateUsageByProvider,
  aggregateUsageByModel,
  aggregateDailyUsage,
  PRICING_DATA,
} from '../pricing';

describe('pricing utilities', () => {
  describe('calculateTokenCost', () => {
    it('should calculate cost correctly for OpenAI GPT-4', () => {
      const cost = calculateTokenCost('openai', 'gpt-4', 1000, 500);
      // (1000 / 1M * $30) + (500 / 1M * $60) = $0.03 + $0.03 = $0.06
      expect(cost).toBe(0.06);
    });

    it('should calculate cost correctly for Anthropic Claude-3-Opus', () => {
      const cost = calculateTokenCost('anthropic', 'claude-3-opus', 2000, 1000);
      // (2000 / 1M * $15) + (1000 / 1M * $75) = $0.03 + $0.075 = $0.105
      expect(cost).toBe(0.105);
    });

    it('should calculate cost correctly for GPT-4o-mini', () => {
      const cost = calculateTokenCost('openai', 'gpt-4o-mini', 10000, 5000);
      // (10000 / 1M * $0.15) + (5000 / 1M * $0.6) = $0.0015 + $0.003 = $0.0045
      expect(cost).toBeCloseTo(0.0045, 6);
    });

    it('should return 0 for unknown provider', () => {
      const cost = calculateTokenCost('unknown-provider', 'some-model', 1000, 500);
      expect(cost).toBe(0);
    });

    it('should return 0 for unknown model', () => {
      const cost = calculateTokenCost('openai', 'unknown-model', 1000, 500);
      expect(cost).toBe(0);
    });

    it('should handle zero tokens', () => {
      const cost = calculateTokenCost('openai', 'gpt-4', 0, 0);
      expect(cost).toBe(0);
    });

    it('should handle large token counts', () => {
      const cost = calculateTokenCost('openai', 'gpt-3.5-turbo', 1000000, 500000);
      // (1M / 1M * $0.5) + (500K / 1M * $1.5) = $0.5 + $0.75 = $1.25
      expect(cost).toBe(1.25);
    });
  });

  describe('calculateTotalTokens', () => {
    it('should sum input and output tokens', () => {
      expect(calculateTotalTokens(1000, 500)).toBe(1500);
    });

    it('should handle zero tokens', () => {
      expect(calculateTotalTokens(0, 0)).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(calculateTotalTokens(1000000, 500000)).toBe(1500000);
    });
  });

  describe('formatCost', () => {
    it('should format small costs with proper precision', () => {
      expect(formatCost(0.0045)).toBe('$0.0045');
    });

    it('should format larger costs', () => {
      expect(formatCost(1.25)).toMatch(/\$1\.25/);
    });

    it('should format zero cost', () => {
      expect(formatCost(0)).toMatch(/\$0\.00/);
    });

    it('should format very small costs', () => {
      const formatted = formatCost(0.000001);
      expect(formatted).toMatch(/\$0\.00000/);
    });

    it('should format costs over $100', () => {
      expect(formatCost(123.456789)).toBe('$123.456789');
    });
  });

  describe('aggregateUsageByProvider', () => {
    it('should aggregate usage by provider', () => {
      const records = [
        { provider: 'openai', total_tokens: 1000, cost_usd: 0.05 },
        { provider: 'openai', total_tokens: 2000, cost_usd: 0.10 },
        { provider: 'anthropic', total_tokens: 1500, cost_usd: 0.15 },
      ];

      const result = aggregateUsageByProvider(records);

      expect(result).toHaveLength(2);
      
      const openai = result.find(r => r.provider === 'openai');
      expect(openai).toBeDefined();
      expect(openai?.provider).toBe('openai');
      expect(openai?.total_tokens).toBe(3000);
      expect(openai?.total_cost).toBeCloseTo(0.15, 6);
      expect(openai?.request_count).toBe(2);

      const anthropic = result.find(r => r.provider === 'anthropic');
      expect(anthropic).toEqual({
        provider: 'anthropic',
        total_tokens: 1500,
        total_cost: 0.15,
        request_count: 1,
      });
    });

    it('should handle empty array', () => {
      const result = aggregateUsageByProvider([]);
      expect(result).toEqual([]);
    });

    it('should handle single record', () => {
      const records = [
        { provider: 'openai', total_tokens: 1000, cost_usd: 0.05 },
      ];

      const result = aggregateUsageByProvider(records);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        provider: 'openai',
        total_tokens: 1000,
        total_cost: 0.05,
        request_count: 1,
      });
    });
  });

  describe('aggregateUsageByModel', () => {
    it('should aggregate usage by provider and model', () => {
      const records = [
        { provider: 'openai', model: 'gpt-4', total_tokens: 1000, cost_usd: 0.05 },
        { provider: 'openai', model: 'gpt-4', total_tokens: 2000, cost_usd: 0.10 },
        { provider: 'openai', model: 'gpt-3.5-turbo', total_tokens: 5000, cost_usd: 0.01 },
        { provider: 'anthropic', model: 'claude-3-opus', total_tokens: 1500, cost_usd: 0.15 },
      ];

      const result = aggregateUsageByModel(records);

      expect(result).toHaveLength(3);
      
      const gpt4 = result.find(r => r.model === 'gpt-4');
      expect(gpt4).toBeDefined();
      expect(gpt4?.provider).toBe('openai');
      expect(gpt4?.model).toBe('gpt-4');
      expect(gpt4?.total_tokens).toBe(3000);
      expect(gpt4?.total_cost).toBeCloseTo(0.15, 6);
      expect(gpt4?.request_count).toBe(2);

      const gpt35 = result.find(r => r.model === 'gpt-3.5-turbo');
      expect(gpt35).toEqual({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        total_tokens: 5000,
        total_cost: 0.01,
        request_count: 1,
      });
    });

    it('should handle empty array', () => {
      const result = aggregateUsageByModel([]);
      expect(result).toEqual([]);
    });
  });

  describe('aggregateDailyUsage', () => {
    it('should aggregate usage by date', () => {
      const records = [
        { request_timestamp: '2024-01-15T10:00:00Z', total_tokens: 1000, cost_usd: 0.05 },
        { request_timestamp: '2024-01-15T14:00:00Z', total_tokens: 2000, cost_usd: 0.10 },
        { request_timestamp: '2024-01-16T10:00:00Z', total_tokens: 1500, cost_usd: 0.08 },
      ];

      const result = aggregateDailyUsage(records);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].total_tokens).toBe(3000);
      expect(result[0].total_cost).toBeCloseTo(0.15, 6);
      expect(result[0].request_count).toBe(2);
      expect(result[1]).toEqual({
        date: '2024-01-16',
        total_tokens: 1500,
        total_cost: 0.08,
        request_count: 1,
      });
    });

    it('should sort results by date', () => {
      const records = [
        { request_timestamp: '2024-01-16T10:00:00Z', total_tokens: 1500, cost_usd: 0.08 },
        { request_timestamp: '2024-01-15T10:00:00Z', total_tokens: 1000, cost_usd: 0.05 },
        { request_timestamp: '2024-01-17T10:00:00Z', total_tokens: 2000, cost_usd: 0.10 },
      ];

      const result = aggregateDailyUsage(records);

      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
      expect(result[2].date).toBe('2024-01-17');
    });

    it('should handle empty array', () => {
      const result = aggregateDailyUsage([]);
      expect(result).toEqual([]);
    });
  });

  describe('PRICING_DATA', () => {
    it('should have pricing for all major providers', () => {
      expect(PRICING_DATA).toHaveProperty('openai');
      expect(PRICING_DATA).toHaveProperty('anthropic');
      expect(PRICING_DATA).toHaveProperty('google');
    });

    it('should have input and output prices for each model', () => {
      const gpt4 = PRICING_DATA.openai['gpt-4'];
      expect(gpt4).toHaveProperty('input');
      expect(gpt4).toHaveProperty('output');
      expect(typeof gpt4.input).toBe('number');
      expect(typeof gpt4.output).toBe('number');
    });
  });
});
