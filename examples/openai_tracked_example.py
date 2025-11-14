"""
OpenAI Integration with Automatic Usage Tracking
=================================================

This example shows how to integrate OpenAI API calls with automatic
usage tracking in the Tech Support Client Portal.

Installation:
    pip install openai requests

Usage:
    export PORTAL_URL="https://portal.example.com"
    export PORTAL_AUTH_TOKEN="your-clerk-token"
    export PORTAL_PROJECT_ID="your-project-id"
    export OPENAI_API_KEY="your-openai-key"
    
    python openai_tracked_example.py
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from openai import OpenAI
from usage_tracker import UsageTracker, UsageTrackerError


class TrackedOpenAI:
    """
    OpenAI client wrapper with automatic usage tracking
    
    This class wraps the OpenAI client and automatically tracks
    all API usage in the Tech Support Client Portal.
    """
    
    def __init__(
        self,
        api_key: str,
        tracker: UsageTracker,
        track_failures: bool = True
    ):
        """
        Initialize tracked OpenAI client
        
        Args:
            api_key: OpenAI API key
            tracker: UsageTracker instance for recording usage
            track_failures: Whether to track usage even if tracking fails (default: True)
        """
        self.client = OpenAI(api_key=api_key)
        self.tracker = tracker
        self.track_failures = track_failures
    
    def _track_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ) -> Optional[Dict[str, Any]]:
        """
        Track usage in the portal
        
        Args:
            model: OpenAI model name
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
        
        Returns:
            dict: Tracking result or None if tracking failed
        """
        try:
            result = self.tracker.track_usage(
                provider="openai",
                model=model,
                input_tokens=prompt_tokens,
                output_tokens=completion_tokens,
                request_timestamp=datetime.utcnow().isoformat() + "Z"
            )
            print(f"[Usage Tracked] {result['total_tokens']} tokens, ${result['cost_usd']:.4f}")
            return result
        except UsageTrackerError as e:
            if self.track_failures:
                print(f"[Warning] Failed to track usage: {e}")
                return None
            else:
                raise
    
    def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Any:
        """
        Create a chat completion with automatic usage tracking
        
        Args:
            model: OpenAI model name (e.g., "gpt-4", "gpt-3.5-turbo")
            messages: List of message dictionaries
            **kwargs: Additional arguments for OpenAI API
        
        Returns:
            OpenAI ChatCompletion response
        """
        # Make the API call
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        # Track usage
        if response.usage:
            self._track_usage(
                model=model,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens
            )
        
        return response
    
    def completion(
        self,
        model: str,
        prompt: str,
        **kwargs
    ) -> Any:
        """
        Create a completion with automatic usage tracking
        
        Args:
            model: OpenAI model name
            prompt: Prompt text
            **kwargs: Additional arguments for OpenAI API
        
        Returns:
            OpenAI Completion response
        """
        # Make the API call
        response = self.client.completions.create(
            model=model,
            prompt=prompt,
            **kwargs
        )
        
        # Track usage
        if response.usage:
            self._track_usage(
                model=model,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens
            )
        
        return response


def example_chat_completion():
    """Example: Chat completion with tracking"""
    print("=" * 60)
    print("Example 1: Chat Completion with Tracking")
    print("=" * 60)
    
    # Initialize tracker
    tracker = UsageTracker(
        portal_url=os.getenv("PORTAL_URL", "https://portal.example.com"),
        auth_token=os.getenv("PORTAL_AUTH_TOKEN"),
        project_id=os.getenv("PORTAL_PROJECT_ID")
    )
    
    # Initialize tracked OpenAI client
    client = TrackedOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        tracker=tracker
    )
    
    # Make a chat completion request
    response = client.chat_completion(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"}
        ],
        max_tokens=100
    )
    
    print(f"\nResponse: {response.choices[0].message.content}")
    print(f"Tokens used: {response.usage.total_tokens}")


def example_multiple_requests():
    """Example: Multiple requests with cumulative tracking"""
    print("\n" + "=" * 60)
    print("Example 2: Multiple Requests with Cumulative Tracking")
    print("=" * 60)
    
    # Initialize tracker
    tracker = UsageTracker(
        portal_url=os.getenv("PORTAL_URL", "https://portal.example.com"),
        auth_token=os.getenv("PORTAL_AUTH_TOKEN"),
        project_id=os.getenv("PORTAL_PROJECT_ID")
    )
    
    # Initialize tracked OpenAI client
    client = TrackedOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        tracker=tracker
    )
    
    # Make multiple requests
    questions = [
        "What is 2+2?",
        "What is the capital of Japan?",
        "Explain quantum computing in one sentence."
    ]
    
    total_tokens = 0
    for i, question in enumerate(questions, 1):
        print(f"\nRequest {i}: {question}")
        response = client.chat_completion(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": question}
            ],
            max_tokens=50
        )
        print(f"Answer: {response.choices[0].message.content}")
        total_tokens += response.usage.total_tokens
    
    print(f"\nTotal tokens across all requests: {total_tokens}")


def example_with_streaming():
    """Example: Streaming response with tracking"""
    print("\n" + "=" * 60)
    print("Example 3: Streaming Response with Tracking")
    print("=" * 60)
    
    # Initialize tracker
    tracker = UsageTracker(
        portal_url=os.getenv("PORTAL_URL", "https://portal.example.com"),
        auth_token=os.getenv("PORTAL_AUTH_TOKEN"),
        project_id=os.getenv("PORTAL_PROJECT_ID")
    )
    
    # For streaming, we need to handle tracking differently
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    print("\nStreaming response:")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Write a haiku about programming."}
        ],
        stream=True
    )
    
    # Collect the streamed response
    full_response = ""
    for chunk in response:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            print(content, end="", flush=True)
            full_response += content
    
    print("\n")
    
    # For streaming, we need to estimate tokens or make a non-streaming call
    # to get accurate usage. Here's a simple estimation:
    estimated_input_tokens = len("Write a haiku about programming.") // 4
    estimated_output_tokens = len(full_response) // 4
    
    try:
        result = tracker.track_usage(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=estimated_input_tokens,
            output_tokens=estimated_output_tokens
        )
        print(f"[Usage Tracked] Estimated cost: ${result['cost_usd']:.4f}")
    except UsageTrackerError as e:
        print(f"[Warning] Failed to track usage: {e}")


def example_error_handling():
    """Example: Error handling in usage tracking"""
    print("\n" + "=" * 60)
    print("Example 4: Error Handling")
    print("=" * 60)
    
    # Initialize tracker with invalid credentials (for demonstration)
    tracker = UsageTracker(
        portal_url=os.getenv("PORTAL_URL", "https://portal.example.com"),
        auth_token="invalid-token",
        project_id=os.getenv("PORTAL_PROJECT_ID")
    )
    
    # Initialize tracked OpenAI client with track_failures=True
    # This will continue even if tracking fails
    client = TrackedOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        tracker=tracker,
        track_failures=True  # Continue even if tracking fails
    )
    
    print("\nMaking request with invalid tracking credentials...")
    print("(The OpenAI call will succeed, but tracking will fail gracefully)")
    
    try:
        response = client.chat_completion(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=20
        )
        print(f"\nOpenAI Response: {response.choices[0].message.content}")
        print("✓ Request succeeded despite tracking failure")
    except Exception as e:
        print(f"✗ Request failed: {e}")


def main():
    """Run all examples"""
    # Check required environment variables
    required_vars = [
        "PORTAL_URL",
        "PORTAL_AUTH_TOKEN",
        "PORTAL_PROJECT_ID",
        "OPENAI_API_KEY"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print("Error: Missing required environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nSet these variables and try again.")
        return
    
    try:
        # Run examples
        example_chat_completion()
        example_multiple_requests()
        example_with_streaming()
        example_error_handling()
        
        print("\n" + "=" * 60)
        print("All examples completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error running examples: {e}")


if __name__ == "__main__":
    main()
