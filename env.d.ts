/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Clerk
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      CLERK_WEBHOOK_SECRET: string;
      
      // Clerk URLs
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: string;
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: string;
      
      // PayPal
      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      PAYPAL_MODE: 'sandbox' | 'live';
      PAYPAL_WEBHOOK_ID: string;
      
      // GitHub
      GITHUB_TOKEN: string;
      
      // Email
      SENDGRID_API_KEY: string;
      SENDGRID_FROM_EMAIL: string;
      
      // Application
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {};
