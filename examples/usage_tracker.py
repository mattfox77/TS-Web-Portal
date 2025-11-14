"""
Tech Support Client Portal - Usage Tracker
===========================================

A Python client for tracking API usage in the Tech Support Client Portal.

Installation:
    pip install requests

Usage:
    from usage_tracker import UsageTracker
    
    tracker = UsageTracker(
        portal_url="https://portal.example.com",
        auth_token="your-clerk-token",
        project_id="your-project-id"
    )
    
    result = tracker.track_usage(
        provider="openai",
        model="gpt-4",
        input_tokens=1500,
        output_tokens=500
    )
    
    print(f"Cost: ${result['cost_usd']:.4f}")
"""

import requests
from typing import Optional, Dict, Any
from datetime import datetime


class UsageTrackerError(Exception):
    """Base exception for usage tracker errors"""
    pass


class AuthenticationError(UsageTrackerError):
    """Raised when authentication fails"""
    pass


class ValidationError(UsageTrackerError):
    """Raised when request validation fails"""
    pass


class UsageTracker:
    """
    Track API usage for the Tech Support Client Portal
    
    This class provides methods to record API usage data including
    token counts and automatically calculated costs.
    """
    
    def __init__(
        self,
        portal_url: str,
        auth_token: str,
        project_id: str,
        timeout: int = 30
    ):
        """
        Initialize the usage tracker
        
        Args:
            portal_url: Base URL of the client portal (e.g., "https://portal.example.com")
            auth_token: Clerk authentication token
            project_id: UUID of the project to track usage for
            timeout: Request timeout in seconds (default: 30)
        """
        self.portal_url = portal_url.rstrip('/')
        self.auth_token = auth_token
        self.project_id = project_id
        self.timeout = timeout
        
        # Validate inputs
        if not self.portal_url:
            raise ValueError("portal_url is required")
        if not self.auth_token:
            raise ValueError("auth_token is required")
        if not self.project_id:
            raise ValueError("project_id is required")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "User-Agent": "TechSupportPortal-UsageTracker/1.0"
        }
    
    def track_usage(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        request_timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Track API usage for a single request
        
        Args:
            provider: API provider name (e.g., "openai", "anthropic", "google")
            model: Model name (e.g., "gpt-4", "claude-3-opus")
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens used
            request_timestamp: ISO 8601 timestamp (optional, defaults to now)
        
        Returns:
            dict: Response from the API including:
                - id: UUID of the usage record
                - project_id: Project UUID
                - provider: Provider name
                - model: Model name
                - input_tokens: Input token count
                - output_tokens: Output token count
                - total_tokens: Total token count
                - cost_usd: Calculated cost in USD
                - request_timestamp: Timestamp of the request
        
        Raises:
            AuthenticationError: If authentication fails
            ValidationError: If request validation fails
            UsageTrackerError: For other API errors
        """
        url = f"{self.portal_url}/api/usage"
        
        payload = {
            "project_id": self.project_id,
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }
        
        if request_timestamp:
            payload["request_timestamp"] = request_timestamp
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            # Handle different error cases
            if response.status_code == 401:
                raise AuthenticationError("Authentication failed. Check your auth token.")
            elif response.status_code == 422:
                error_data = response.json()
                raise ValidationError(f"Validation failed: {error_data.get('error', 'Unknown error')}")
            elif response.status_code == 404:
                raise UsageTrackerError("Project not found or access denied")
            elif not response.ok:
                raise UsageTrackerError(f"API request failed with status {response.status_code}")
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise UsageTrackerError(f"Request timed out after {self.timeout} seconds")
        except requests.exceptions.ConnectionError:
            raise UsageTrackerError(f"Failed to connect to {self.portal_url}")
        except requests.exceptions.RequestException as e:
            raise UsageTrackerError(f"Request failed: {str(e)}")
    
    def get_usage(
        self,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve usage data for the project
        
        Args:
            date_from: Start date for filtering (ISO 8601 format, optional)
            date_to: End date for filtering (ISO 8601 format, optional)
        
        Returns:
            dict: Response containing:
                - usage: List of usage records
                - count: Number of records returned
        
        Raises:
            AuthenticationError: If authentication fails
            UsageTrackerError: For other API errors
        """
        url = f"{self.portal_url}/api/usage"
        
        params = {"project_id": self.project_id}
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to
        
        try:
            response = requests.get(
                url,
                params=params,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Authentication failed. Check your auth token.")
            elif not response.ok:
                raise UsageTrackerError(f"API request failed with status {response.status_code}")
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise UsageTrackerError(f"Request failed: {str(e)}")


def main():
    """Example usage of the UsageTracker"""
    import os
    
    # Get configuration from environment variables
    portal_url = os.getenv("PORTAL_URL", "https://portal.example.com")
    auth_token = os.getenv("PORTAL_AUTH_TOKEN")
    project_id = os.getenv("PORTAL_PROJECT_ID")
    
    if not auth_token or not project_id:
        print("Error: Set PORTAL_AUTH_TOKEN and PORTAL_PROJECT_ID environment variables")
        return
    
    # Initialize tracker
    tracker = UsageTracker(
        portal_url=portal_url,
        auth_token=auth_token,
        project_id=project_id
    )
    
    # Track some example usage
    try:
        print("Tracking API usage...")
        result = tracker.track_usage(
            provider="openai",
            model="gpt-4",
            input_tokens=1500,
            output_tokens=500
        )
        
        print(f"✓ Usage tracked successfully!")
        print(f"  ID: {result['id']}")
        print(f"  Total tokens: {result['total_tokens']}")
        print(f"  Cost: ${result['cost_usd']:.4f}")
        
        # Retrieve usage data
        print("\nRetrieving usage data...")
        usage_data = tracker.get_usage()
        print(f"✓ Found {usage_data['count']} usage records")
        
        if usage_data['usage']:
            total_cost = sum(r['cost_usd'] for r in usage_data['usage'])
            print(f"  Total cost: ${total_cost:.4f}")
        
    except UsageTrackerError as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    main()
