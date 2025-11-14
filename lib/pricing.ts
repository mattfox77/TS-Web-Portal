// lib/pricing.ts
// Cost calculation functions for API usage tracking

/**
 * Pricing data for various AI/API providers
 * Prices are in USD per 1M tokens (or per request for non-token-based APIs)
 */
export const PRICING_DATA = {
  openai: {
    'gpt-4': {
      input: 30.0,  // $30 per 1M input tokens
      output: 60.0, // $60 per 1M output tokens
    },
    'gpt-4-turbo': {
      input: 10.0,
      output: 30.0,
    },
    'gpt-3.5-turbo': {
      input: 0.5,
      output: 1.5,
    },
    'gpt-4o': {
      input: 5.0,
      output: 15.0,
    },
    'gpt-4o-mini': {
      input: 0.15,
      output: 0.6,
    },
  },
  anthropic: {
    'claude-3-opus': {
      input: 15.0,
      output: 75.0,
    },
    'claude-3-sonnet': {
      input: 3.0,
      output: 15.0,
    },
    'claude-3-haiku': {
      input: 0.25,
      output: 1.25,
    },
    'claude-3-5-sonnet': {
      input: 3.0,
      output: 15.0,
    },
  },
  google: {
    'gemini-pro': {
      input: 0.5,
      output: 1.5,
    },
    'gemini-pro-vision': {
      input: 0.5,
      output: 1.5,
    },
  },
} as const;

export type Provider = keyof typeof PRICING_DATA;
export type Model<P extends Provider> = keyof typeof PRICING_DATA[P];

/**
 * Calculate the cost of an API call based on token usage
 */
export function calculateTokenCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerData = PRICING_DATA[provider as Provider];
  if (!providerData) {
    console.warn(`Unknown provider: ${provider}, returning 0 cost`);
    return 0;
  }

  const modelData = providerData[model as keyof typeof providerData];
  if (!modelData) {
    console.warn(`Unknown model: ${model} for provider: ${provider}, returning 0 cost`);
    return 0;
  }

  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const inputCost = (inputTokens / 1_000_000) * modelData.input;
  const outputCost = (outputTokens / 1_000_000) * modelData.output;

  return inputCost + outputCost;
}

/**
 * Calculate total tokens from input and output
 */
export function calculateTotalTokens(inputTokens: number, outputTokens: number): number {
  return inputTokens + outputTokens;
}

/**
 * Format cost as USD currency string
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(cost);
}

/**
 * Aggregate usage data by provider
 */
export interface UsageByProvider {
  provider: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

export function aggregateUsageByProvider(
  usageRecords: Array<{
    provider: string;
    total_tokens: number;
    cost_usd: number;
  }>
): UsageByProvider[] {
  const aggregated = new Map<string, UsageByProvider>();

  for (const record of usageRecords) {
    const existing = aggregated.get(record.provider);
    if (existing) {
      existing.total_tokens += record.total_tokens;
      existing.total_cost += record.cost_usd;
      existing.request_count += 1;
    } else {
      aggregated.set(record.provider, {
        provider: record.provider,
        total_tokens: record.total_tokens,
        total_cost: record.cost_usd,
        request_count: 1,
      });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Aggregate usage data by model
 */
export interface UsageByModel {
  provider: string;
  model: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

export function aggregateUsageByModel(
  usageRecords: Array<{
    provider: string;
    model: string;
    total_tokens: number;
    cost_usd: number;
  }>
): UsageByModel[] {
  const aggregated = new Map<string, UsageByModel>();

  for (const record of usageRecords) {
    const key = `${record.provider}:${record.model}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.total_tokens += record.total_tokens;
      existing.total_cost += record.cost_usd;
      existing.request_count += 1;
    } else {
      aggregated.set(key, {
        provider: record.provider,
        model: record.model,
        total_tokens: record.total_tokens,
        total_cost: record.cost_usd,
        request_count: 1,
      });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Calculate daily usage totals
 */
export interface DailyUsage {
  date: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

export function aggregateDailyUsage(
  usageRecords: Array<{
    request_timestamp: string;
    total_tokens: number;
    cost_usd: number;
  }>
): DailyUsage[] {
  const aggregated = new Map<string, DailyUsage>();

  for (const record of usageRecords) {
    const date = record.request_timestamp.split('T')[0]; // Extract YYYY-MM-DD
    const existing = aggregated.get(date);
    if (existing) {
      existing.total_tokens += record.total_tokens;
      existing.total_cost += record.cost_usd;
      existing.request_count += 1;
    } else {
      aggregated.set(date, {
        date,
        total_tokens: record.total_tokens,
        total_cost: record.cost_usd,
        request_count: 1,
      });
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => a.date.localeCompare(b.date));
}
