# Quick Authentication Reference

## For Developers: How to Use Authentication

### Protecting a Page (Server Component)

```typescript
// app/my-page/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function MyPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return <div>Protected content for user: {userId}</div>;
}
```

### Protecting an API Route

```typescript
// app/api/my-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/errors";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { env } = getRequestContext();
    
    // Your logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

### Admin-Only API Route

```typescript
// app/api/admin/my-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/errors";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const userId = await requireAdmin(env);
    
    // Admin-only logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

### Get User's Client ID

```typescript
import { requireAuth, getUserClientId } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { env } = getRequestContext();
    const clientId = await getUserClientId(env, userId);
    
    // Use clientId to filter data
    const data = await env.DB
      .prepare("SELECT * FROM tickets WHERE client_id = ?")
      .bind(clientId)
      .all();
    
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
```

### Check Client Access

```typescript
import { requireAuth, hasClientAccess } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { ForbiddenError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const userId = await requireAuth();
    const { env } = getRequestContext();
    
    // Check if user has access to this client
    const hasAccess = await hasClientAccess(env, userId, params.clientId);
    
    if (!hasAccess) {
      throw new ForbiddenError("Access denied to this client");
    }
    
    // Proceed with logic
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

### Display User Info in Component

```typescript
// app/components/UserProfile.tsx
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function UserProfile() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    return null;
  }
  
  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### Client-Side User Button

```typescript
// app/components/Header.tsx
"use client";

import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  );
}
```

## Common Patterns

### Pattern 1: User-Scoped Data Query

```typescript
// Always filter by client_id for regular users
const userId = await requireAuth();
const { env } = getRequestContext();
const clientId = await getUserClientId(env, userId);

const tickets = await env.DB
  .prepare("SELECT * FROM tickets WHERE client_id = ?")
  .bind(clientId)
  .all();
```

### Pattern 2: Admin or Owner Access

```typescript
// Allow access if user is admin OR owns the resource
const userId = await requireAuth();
const { env } = getRequestContext();

const user = await env.DB
  .prepare("SELECT role, client_id FROM users WHERE id = ?")
  .bind(userId)
  .first();

const isAdmin = user.role === "admin";
const isOwner = user.client_id === resourceClientId;

if (!isAdmin && !isOwner) {
  throw new ForbiddenError("Access denied");
}
```

### Pattern 3: Conditional Admin Features

```typescript
// Show admin features only to admins
const { userId } = await auth();
const { env } = getRequestContext();

const user = await env.DB
  .prepare("SELECT role FROM users WHERE id = ?")
  .bind(userId)
  .first();

const isAdmin = user?.role === "admin";

return (
  <div>
    {isAdmin && <AdminPanel />}
    <RegularContent />
  </div>
);
```

## Error Handling

All authentication helpers throw specific errors:

- `UnauthorizedError` (401) - User not authenticated
- `ForbiddenError` (403) - User lacks permissions
- `NotFoundError` (404) - User/resource not found

Always wrap in try-catch and use `handleError()`:

```typescript
try {
  const userId = await requireAuth();
  // Your logic
} catch (error) {
  return handleError(error);
}
```

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

## Middleware Configuration

Routes are automatically protected by `middleware.ts`:

- **Public:** `/`, `/sign-in`, `/sign-up`, `/services`, `/about`, `/contact`
- **Protected:** Everything else (requires authentication)
- **Ignored:** `/api/webhooks/*` (for webhook handlers)

To add more public routes, edit `middleware.ts`:

```typescript
export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/your-new-public-route",
  ],
});
```

## Database Queries

### Get User with Client

```sql
SELECT u.*, c.name as client_name, c.email as client_email
FROM users u
JOIN clients c ON u.client_id = c.id
WHERE u.id = ?
```

### Check if User is Admin

```sql
SELECT role FROM users WHERE id = ? AND role = 'admin'
```

### Get All Users for a Client

```sql
SELECT * FROM users WHERE client_id = ?
```

## Tips

1. **Always use `requireAuth()`** in API routes - don't rely on middleware alone
2. **Filter by `client_id`** for all user-scoped queries
3. **Use `requireAdmin()`** for admin-only routes
4. **Handle errors consistently** with `handleError()`
5. **Test with both user and admin roles** to ensure proper access control
6. **Log security events** to `activity_log` table for audit trail

## Need Help?

- See `AUTH_SETUP.md` for setup instructions
- See `TESTING_AUTH.md` for testing procedures
- See `IMPLEMENTATION_SUMMARY.md` for architecture overview
