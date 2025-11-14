# Usage Tracking Integration Examples

This directory contains example code for integrating API usage tracking with the Tech Support Client Portal.

## Files

- **`usage_tracker.py`** - Core Python client for tracking API usage
- **`openai_tracked_example.py`** - Examples of OpenAI integration with automatic tracking
- **`README.md`** - This file

## Quick Start

### 1. Install Dependencies

```bash
pip install requests openai
```

### 2. Set Environment Variables

```bash
export PORTAL_URL="https://your-portal-domain.com"
export PORTAL_AUTH_TOKEN="your-clerk-authentication-token"
export PORTAL_PROJECT_ID="your-project-uuid"
export OPENAI_API_KEY="your-openai-api-key"
```

### 3. Run Examples

#### Basic Usage Tracking

```bash
python usage_tracker.py
```

This will:
- Track a sample API usage record
- Retrieve usage data for your project
- Display costs and token counts

#### OpenAI Integration Examples

```bash
python openai_tracked_example.py
```

This will run multiple examples showing:
- Simple chat completion with tracking
- Multiple requests with cumulative tracking
- Streaming responses with tracking
- Error handling when tracking fails

## Using the Usage Tracker in Your Code

### Basic Usage

```python
from usage_tracker import UsageTracker

# Initialize the tracker
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="your-project-id"
)

# Track API usage
result = tracker.track_usage(
    provider="openai",
    model="gpt-4",
    input_tokens=1500,
    output_tokens=500
)

print(f"Cost: ${result['cost_usd']:.4f}")
```

### OpenAI Integration

```python
from usage_tracker import UsageTracker
from openai_tracked_example import TrackedOpenAI

# Initialize tracker
tracker = UsageTracker(
    portal_url="https://portal.example.com",
    auth_token="your-clerk-token",
    project_id="your-project-id"
)

# Create tracked OpenAI client
client = TrackedOpenAI(
    api_key="your-openai-key",
    tracker=tracker
)

# Use it like normal OpenAI client
response = client.chat_completion(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

# Usage is automatically tracked!
```

## Supported Providers

The usage tracker supports the following AI providers:

### OpenAI
- gpt-4
- gpt-4-turbo
- gpt-3.5-turbo
- gpt-4o
- gpt-4o-mini

### Anthropic
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku
- claude-3-5-sonnet

### Google
- gemini-pro
- gemini-pro-vision

## Error Handling

The usage tracker includes comprehensive error handling:

```python
from usage_tracker import (
    UsageTracker,
    UsageTrackerError,
    AuthenticationError,
    ValidationError
)

try:
    result = tracker.track_usage(
        provider="openai",
        model="gpt-4",
        input_tokens=1000,
        output_tokens=500
    )
except AuthenticationError:
    print("Authentication failed - check your token")
except ValidationError as e:
    print(f"Invalid data: {e}")
except UsageTrackerError as e:
    print(f"Tracking failed: {e}")
```

## Getting Authentication Token

To get your Clerk authentication token:

1. Log in to the client portal
2. Open browser developer tools (F12)
3. Go to Application/Storage → Cookies
4. Find the `__session` cookie value
5. Use this as your `auth_token`

**Note**: For production use, implement proper token management and refresh logic.

## Getting Project ID

To find your project ID:

1. Log in to the client portal
2. Navigate to your project
3. The project ID is in the URL: `/dashboard/projects/{project-id}`
4. Or use the API: `GET /api/projects`

## Advanced Usage

### Batch Tracking

For high-volume applications, consider batching requests:

```python
# Track multiple requests
results = []
for usage in usage_records:
    result = tracker.track_usage(**usage)
    results.append(result)

total_cost = sum(r['cost_usd'] for r in results)
```

### Async Tracking

For async applications, use `aiohttp`:

```python
import aiohttp
import asyncio

async def track_usage_async(tracker, **kwargs):
    # Implement async version using aiohttp
    pass
```

### Custom Providers

To track usage for providers not in the default pricing list:

```python
# The tracker will accept any provider/model
# Cost will be 0 if not in pricing data
result = tracker.track_usage(
    provider="custom-provider",
    model="custom-model",
    input_tokens=1000,
    output_tokens=500
)
```

## Retrieving Usage Data

Get usage data for analysis:

```python
# Get all usage for project
usage_data = tracker.get_usage()

# Get usage for date range
from datetime import datetime, timedelta

date_from = (datetime.now() - timedelta(days=7)).isoformat() + "Z"
usage_data = tracker.get_usage(date_from=date_from)

# Analyze costs
total_cost = sum(r['cost_usd'] for r in usage_data['usage'])
print(f"Total cost: ${total_cost:.4f}")
```

## Testing

Test your integration before deploying:

```python
# Test with minimal data
try:
    result = tracker.track_usage(
        provider="openai",
        model="gpt-4",
        input_tokens=10,
        output_tokens=5
    )
    print("✓ Tracking works!")
except Exception as e:
    print(f"✗ Tracking failed: {e}")
```

## Troubleshooting

### Authentication Errors

- Verify your auth token is valid and not expired
- Check that you're using the correct portal URL
- Ensure your user has access to the project

### Validation Errors

- Verify all required fields are provided
- Check that token counts are positive integers
- Ensure project_id is a valid UUID

### Connection Errors

- Check your internet connection
- Verify the portal URL is correct and accessible
- Check for firewall or proxy issues

## Support

For help with usage tracking integration:

1. Review the [Integration Guide](../USAGE_TRACKING_INTEGRATION.md)
2. Check the [API documentation](../README.md)
3. Contact support through the client portal

## License

These examples are provided as-is for integration with the Tech Support Client Portal.
