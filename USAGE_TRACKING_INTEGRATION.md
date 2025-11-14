# API Usage Tracking Integration Guide

This guide explains how to integrate API usage tracking into your external applications to monitor costs and usage in the Tech Support Client Portal.

## Overview

The usage tracking system allows you to record API calls made to external services (OpenAI, Anthropic, Google, etc.) and track their costs. This data is then available in the admin dashboard for monitoring and billing purposes.

## Authentication

All usage tracking requests require authentication using Clerk. You'll need to obtain a session token from your authenticated user.

## API Endpoint

```
POST https://your-portal-domain.com/api/usage
```

## Request Format

```json
{
  "project_id": "uuid-of-project",
  "provider": "openai",
  "model": "gpt-4",
  "input_tokens": 1500,
  "output_tokens": 500,
  "request_timestamp": "2024-01-15T10:30:00Z"
}
```

### Required Fields

- `project_id` (string, UUID): The project this usage belongs to
- `provider` (string): API provider name (e.g., "openai", "anthropic", "google")
- `model` (string): Model name (e.g., "gpt-4", "claude-3-opus")
- `input_tokens` (integer): Number of input tokens used
- `output_tokens` (integer): Number of output tokens used

### Optional Fields

- `request_timestamp` (string, ISO 8601): When the API call was made (defaults to current time)

## Response Format

```json
{
  "id": "uuid-of-usage-record",
  "project_id": "uuid-of-project",
  "provider": "openai",
  "model": "gpt-4",
  "input_tokens": 1500,
  "output_tokens": 500,
  "total_tokens": 2000,
  "cost_usd": 0.09,
  "request_timestamp": "2024-01-15T10:30:00Z"
}
```

## Supported Providers and Models

### OpenAI

- `gpt-4` - $30/$60 per 1M tokens (input/output)
- `gpt-4-turbo` - $10/$30 per 1M tokens
- `gpt-3.5-turbo` - $0.50/$1.50 per 1M tokens
- `gpt-4o` - $5/$15 per 1M tokens
- `gpt-4o-mini` - $0.15/$0.60 per 1M tokens

### Anthropic

- `claude-3-opus` - $15/$75 per 1M tokens
- `claude-3-sonnet` - $3/$15 per 1M tokens
- `claude-3-haiku` - $0.25/$1.25 per 1M tokens
- `claude-3-5-sonnet` - $3/$15 per 1M tokens

### Google

- `gemini-pro` - $0.50/$1.50 per 1M tokens
- `gemini-pro-vision` - $0.50/$1.50 per 1M tokens

**Note**: Pricing is automatically calculated based on the provider and model. The pricing data is maintained in `lib/pricing.ts`.

## Python Integration Examples

### Example 1: Basic Usage Tracking

```python
import requests
from typing import Optional

class UsageTracker:
    """Track API usage for the Tech Support Client Portal"""
    
    def __init__(self, portal_url: str, auth_token: str, project_id: str):
        """
        Initialize the usage tracker
        
        Args:
            portal_url: Base URL of the client portal (e.g., "https://portal.example.com")
            auth_token: Clerk authentication token
            project_id: UUID of the project to track usage for
        """
        self.portal_url = portal_url.rstrip('/')
        self.auth_token = auth_token
        self.project_id = project_id
    
    def track_usage(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        request_timestamp: Optional[str] = None
    ) -> dict:
        """
        Track API usage for a single request
        
        Args:
            provider: API provider name (e.g., "openai", "anthropic")
            model: Model name (e.g., "gpt-4", "claude-3-opus")
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens used
            request_timestamp: ISO 8601 timestamp (optional, defaults to now)
        
        Returns:
            dict: Response from the API including calculated cost
        
        Raises:
            requests.HTTPError: If the API request fails
        """
        url = f"{self.portal_url}/api/usage"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "project_id": self.project_id,
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }
        
        if request_timestamp:
            payload["request_timestamp"] = request_timestamp
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()


# Usage example
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="550e8400-e29b-41d4-a716-446655440000"
)

result = tracker.track_usage(
    provider="openai",
    model="gpt-4",
    input_tokens=1500,
    output_tokens=500
)

print(f"Usage tracked: {result['total_tokens']} tokens, ${result['cost_usd']:.4f}")
```

### Example 2: OpenAI Integration with Automatic Tracking

```python
import openai
from datetime import datetime
from usage_tracker import UsageTracker

class TrackedOpenAI:
    """OpenAI client with automatic usage tracking"""
    
    def __init__(self, api_key: str, tracker: UsageTracker):
        """
        Initialize tracked OpenAI client
        
        Args:
            api_key: OpenAI API key
            tracker: UsageTracker instance
        """
        self.client = openai.OpenAI(api_key=api_key)
        self.tracker = tracker
    
    def chat_completion(self, model: str, messages: list, **kwargs) -> dict:
        """
        Create a chat completion and track usage
        
        Args:
            model: OpenAI model name
            messages: List of message dictionaries
            **kwargs: Additional arguments for OpenAI API
        
        Returns:
            dict: OpenAI response with usage tracking
        """
        # Make the API call
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        # Extract usage information
        usage = response.usage
        
        # Track usage in portal
        try:
            tracking_result = self.tracker.track_usage(
                provider="openai",
                model=model,
                input_tokens=usage.prompt_tokens,
                output_tokens=usage.completion_tokens,
                request_timestamp=datetime.utcnow().isoformat() + "Z"
            )
            print(f"Usage tracked: ${tracking_result['cost_usd']:.4f}")
        except Exception as e:
            print(f"Warning: Failed to track usage: {e}")
        
        return response


# Usage example
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="550e8400-e29b-41d4-a716-446655440000"
)

client = TrackedOpenAI(
    api_key="your-openai-key",
    tracker=tracker
)

response = client.chat_completion(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ]
)

print(response.choices[0].message.content)
```

### Example 3: Anthropic Integration with Automatic Tracking

```python
import anthropic
from datetime import datetime
from usage_tracker import UsageTracker

class TrackedAnthropic:
    """Anthropic client with automatic usage tracking"""
    
    def __init__(self, api_key: str, tracker: UsageTracker):
        """
        Initialize tracked Anthropic client
        
        Args:
            api_key: Anthropic API key
            tracker: UsageTracker instance
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.tracker = tracker
    
    def create_message(self, model: str, messages: list, max_tokens: int, **kwargs) -> dict:
        """
        Create a message and track usage
        
        Args:
            model: Anthropic model name
            messages: List of message dictionaries
            max_tokens: Maximum tokens to generate
            **kwargs: Additional arguments for Anthropic API
        
        Returns:
            dict: Anthropic response with usage tracking
        """
        # Make the API call
        response = self.client.messages.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            **kwargs
        )
        
        # Extract usage information
        usage = response.usage
        
        # Track usage in portal
        try:
            tracking_result = self.tracker.track_usage(
                provider="anthropic",
                model=model,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                request_timestamp=datetime.utcnow().isoformat() + "Z"
            )
            print(f"Usage tracked: ${tracking_result['cost_usd']:.4f}")
        except Exception as e:
            print(f"Warning: Failed to track usage: {e}")
        
        return response


# Usage example
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="550e8400-e29b-41d4-a716-446655440000"
)

client = TrackedAnthropic(
    api_key="your-anthropic-key",
    tracker=tracker
)

response = client.create_message(
    model="claude-3-opus-20240229",
    messages=[
        {"role": "user", "content": "What is the capital of France?"}
    ],
    max_tokens=1024
)

print(response.content[0].text)
```

### Example 4: Batch Usage Tracking

```python
import requests
from typing import List, Dict
from datetime import datetime

class BatchUsageTracker:
    """Track multiple API usage records in batch"""
    
    def __init__(self, portal_url: str, auth_token: str, project_id: str):
        self.portal_url = portal_url.rstrip('/')
        self.auth_token = auth_token
        self.project_id = project_id
        self.batch = []
    
    def add_usage(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        request_timestamp: str = None
    ):
        """Add a usage record to the batch"""
        self.batch.append({
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "request_timestamp": request_timestamp or datetime.utcnow().isoformat() + "Z"
        })
    
    def flush(self) -> List[Dict]:
        """Send all batched usage records"""
        if not self.batch:
            return []
        
        results = []
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        for usage in self.batch:
            try:
                payload = {
                    "project_id": self.project_id,
                    **usage
                }
                response = requests.post(
                    f"{self.portal_url}/api/usage",
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                results.append(response.json())
            except Exception as e:
                print(f"Failed to track usage: {e}")
                results.append({"error": str(e)})
        
        self.batch = []
        return results


# Usage example
tracker = BatchUsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="550e8400-e29b-41d4-a716-446655440000"
)

# Add multiple usage records
tracker.add_usage("openai", "gpt-4", 1000, 500)
tracker.add_usage("openai", "gpt-4", 1500, 750)
tracker.add_usage("anthropic", "claude-3-opus", 2000, 1000)

# Send all at once
results = tracker.flush()
total_cost = sum(r.get('cost_usd', 0) for r in results)
print(f"Total cost tracked: ${total_cost:.4f}")
```

### Example 5: Async Usage Tracking (Python asyncio)

```python
import aiohttp
import asyncio
from typing import Optional

class AsyncUsageTracker:
    """Async API usage tracker"""
    
    def __init__(self, portal_url: str, auth_token: str, project_id: str):
        self.portal_url = portal_url.rstrip('/')
        self.auth_token = auth_token
        self.project_id = project_id
    
    async def track_usage(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        request_timestamp: Optional[str] = None
    ) -> dict:
        """Track API usage asynchronously"""
        url = f"{self.portal_url}/api/usage"
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "project_id": self.project_id,
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }
        
        if request_timestamp:
            payload["request_timestamp"] = request_timestamp
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                response.raise_for_status()
                return await response.json()


# Usage example
async def main():
    tracker = AsyncUsageTracker(
        portal_url="https://portal.example.com",
        auth_token="your-clerk-token",
        project_id="550e8400-e29b-41d4-a716-446655440000"
    )
    
    # Track multiple requests concurrently
    tasks = [
        tracker.track_usage("openai", "gpt-4", 1000, 500),
        tracker.track_usage("openai", "gpt-4", 1500, 750),
        tracker.track_usage("anthropic", "claude-3-opus", 2000, 1000)
    ]
    
    results = await asyncio.gather(*tasks)
    total_cost = sum(r['cost_usd'] for r in results)
    print(f"Total cost tracked: ${total_cost:.4f}")

asyncio.run(main())
```

## Error Handling

The API returns standard HTTP status codes:

- `201 Created`: Usage successfully tracked
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Project not found or access denied
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

Example error response:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["input_tokens"],
      "message": "Expected number, received string"
    }
  ]
}
```

## Best Practices

1. **Track Immediately**: Record usage right after each API call
2. **Handle Failures Gracefully**: Don't let tracking failures break your application
3. **Use Batch Tracking**: For high-volume applications, batch requests to reduce overhead
4. **Include Timestamps**: Provide accurate timestamps for better analytics
5. **Monitor Costs**: Regularly check the usage dashboard to avoid surprises
6. **Set Budgets**: Configure budget thresholds for automatic alerts
7. **Validate Data**: Ensure token counts are accurate before tracking

## Testing

Test your integration with the usage tracking API:

```python
# Test with minimal data
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="your-project-id"
)

try:
    result = tracker.track_usage(
        provider="openai",
        model="gpt-4",
        input_tokens=100,
        output_tokens=50
    )
    print("✓ Usage tracking working!")
    print(f"  Cost: ${result['cost_usd']:.4f}")
except Exception as e:
    print(f"✗ Usage tracking failed: {e}")
```

## Retrieving Usage Data

You can also retrieve usage data programmatically:

```python
def get_usage_data(
    portal_url: str,
    auth_token: str,
    project_id: str = None,
    date_from: str = None,
    date_to: str = None
) -> dict:
    """Retrieve usage data from the portal"""
    url = f"{portal_url}/api/usage"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    params = {}
    if project_id:
        params["project_id"] = project_id
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    return response.json()


# Example: Get last 7 days of usage
from datetime import datetime, timedelta

date_from = (datetime.now() - timedelta(days=7)).isoformat() + "Z"
usage_data = get_usage_data(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="your-project-id",
    date_from=date_from
)

print(f"Total requests: {usage_data['count']}")
for record in usage_data['usage']:
    print(f"  {record['provider']}/{record['model']}: ${record['cost_usd']:.4f}")
```

## Support

For questions or issues with usage tracking integration:

1. Check the API documentation at `/api/usage`
2. Review the admin usage dashboard for tracked data
3. Contact Tech Support Computer Services support team
4. Submit a ticket through the client portal

## Additional Resources

- [API Usage Analytics Dashboard](https://portal.example.com/admin/usage)
- [Budget Alerts Setup Guide](./USAGE_ALERTS_SETUP.md)
- [Pricing Information](./lib/pricing.ts)
