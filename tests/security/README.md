# Security Testing Guide

This document outlines security testing procedures for the Tech Support Client Portal.

## Overview

Security testing ensures the application is protected against common vulnerabilities and follows security best practices.

## Security Testing Checklist

### 1. Authentication and Authorization

#### Test Authentication
- [ ] Users cannot access protected routes without authentication
- [ ] Invalid credentials are rejected
- [ ] Session tokens expire appropriately
- [ ] Password requirements are enforced (min 8 chars, mixed case, numbers)
- [ ] Account lockout after failed login attempts
- [ ] Password reset flow is secure
- [ ] Social login (Google, Microsoft) works correctly

**Test Commands**:
```bash
# Test unauthenticated access
curl -X GET http://localhost:3000/api/tickets
# Expected: 401 Unauthorized

# Test with invalid token
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test with expired token
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer expired_token"
# Expected: 401 Unauthorized
```

#### Test Authorization
- [ ] Users can only access their own client's data
- [ ] Admin users can access all data
- [ ] Regular users cannot access admin endpoints
- [ ] Users cannot modify other clients' resources
- [ ] Role-based access control (RBAC) is enforced

**Test Commands**:
```bash
# Test accessing another client's data
curl -X GET http://localhost:3000/api/tickets?client_id=other_client \
  -H "Authorization: Bearer user_token"
# Expected: 403 Forbidden or filtered results

# Test admin endpoint as regular user
curl -X GET http://localhost:3000/api/admin/clients \
  -H "Authorization: Bearer user_token"
# Expected: 403 Forbidden

# Test admin endpoint as admin
curl -X GET http://localhost:3000/api/admin/clients \
  -H "Authorization: Bearer admin_token"
# Expected: 200 OK with client list
```

### 2. Client Data Isolation

#### Test Data Segregation
- [ ] Users can only view tickets for their client
- [ ] Users can only view invoices for their client
- [ ] Users can only view documents for their client
- [ ] Users can only view projects for their client
- [ ] Database queries filter by client_id

**Test Scenarios**:
```typescript
// Test file: tests/security/data-isolation.test.ts

describe('Client Data Isolation', () => {
  it('should not return tickets from other clients', async () => {
    // Login as client A user
    const clientAToken = await loginAs('clientA@example.com');
    
    // Try to access client B's ticket
    const response = await fetch('/api/tickets/client_b_ticket_id', {
      headers: { Authorization: `Bearer ${clientAToken}` }
    });
    
    expect(response.status).toBe(404); // Not found (not 403 to avoid info leak)
  });
  
  it('should not allow modifying other client data', async () => {
    const clientAToken = await loginAs('clientA@example.com');
    
    // Try to update client B's ticket
    const response = await fetch('/api/tickets/client_b_ticket_id', {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${clientAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'closed' })
    });
    
    expect(response.status).toBe(404);
  });
});
```

### 3. Webhook Signature Verification

#### Test Webhook Security
- [ ] PayPal webhooks verify signatures
- [ ] GitHub webhooks verify signatures
- [ ] Clerk webhooks verify signatures
- [ ] Invalid signatures are rejected
- [ ] Replay attacks are prevented

**Test Commands**:
```bash
# Test PayPal webhook without signature
curl -X POST http://localhost:3000/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"event_type":"PAYMENT.SALE.COMPLETED"}'
# Expected: 401 Unauthorized

# Test PayPal webhook with invalid signature
curl -X POST http://localhost:3000/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "paypal-transmission-sig: invalid_signature" \
  -d '{"event_type":"PAYMENT.SALE.COMPLETED"}'
# Expected: 401 Unauthorized

# Test GitHub webhook without signature
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"action":"closed"}'
# Expected: 401 Unauthorized
```

**Test Implementation**:
```typescript
// Test file: tests/security/webhooks.test.ts

describe('Webhook Security', () => {
  it('should reject PayPal webhook with invalid signature', async () => {
    const response = await fetch('/api/webhooks/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-sig': 'invalid_signature',
        'paypal-transmission-id': 'test-id',
        'paypal-transmission-time': new Date().toISOString(),
        'paypal-cert-url': 'https://api.paypal.com/cert',
        'paypal-auth-algo': 'SHA256withRSA'
      },
      body: JSON.stringify({
        event_type: 'PAYMENT.SALE.COMPLETED',
        resource: { id: 'test' }
      })
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should reject GitHub webhook with invalid signature', async () => {
    const payload = JSON.stringify({ action: 'closed' });
    
    const response = await fetch('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': 'sha256=invalid_signature'
      },
      body: payload
    });
    
    expect(response.status).toBe(401);
  });
});
```

### 4. SQL Injection Prevention

#### Test SQL Injection
- [ ] All database queries use parameterized statements
- [ ] User inputs are properly escaped
- [ ] No raw SQL concatenation with user input
- [ ] Special characters are handled correctly

**Test Scenarios**:
```bash
# Test SQL injection in search
curl -X GET "http://localhost:3000/api/tickets?search='; DROP TABLE tickets; --" \
  -H "Authorization: Bearer valid_token"
# Expected: 200 OK with empty results (not error)

# Test SQL injection in filter
curl -X GET "http://localhost:3000/api/invoices?status=' OR '1'='1" \
  -H "Authorization: Bearer valid_token"
# Expected: 200 OK with filtered results (not all invoices)

# Test SQL injection in POST
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"'; DROP TABLE tickets; --"}'
# Expected: 201 Created (description stored as-is, not executed)
```

**Code Review Checklist**:
```typescript
// ❌ BAD - SQL Injection vulnerable
const query = `SELECT * FROM tickets WHERE title = '${userInput}'`;
await db.prepare(query).all();

// ✅ GOOD - Parameterized query
const query = 'SELECT * FROM tickets WHERE title = ?';
await db.prepare(query).bind(userInput).all();

// ❌ BAD - String concatenation
const query = `INSERT INTO tickets (title) VALUES ('${title}')`;

// ✅ GOOD - Parameterized insert
const query = 'INSERT INTO tickets (title) VALUES (?)';
await db.prepare(query).bind(title).run();
```

### 5. XSS (Cross-Site Scripting) Prevention

#### Test XSS Vulnerabilities
- [ ] User inputs are sanitized before display
- [ ] HTML entities are escaped
- [ ] Script tags in user content don't execute
- [ ] React's built-in XSS protection is utilized
- [ ] dangerouslySetInnerHTML is not used (or used safely)

**Test Scenarios**:
```bash
# Test XSS in ticket title
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(\"XSS\")</script>","description":"Test"}'
# Expected: 201 Created, but script tag should be escaped when displayed

# Test XSS in comment
curl -X POST http://localhost:3000/api/tickets/ticket_id/comments \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{"content":"<img src=x onerror=alert(\"XSS\")>"}'
# Expected: 201 Created, but script should not execute when displayed

# Test XSS in document filename
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer valid_token" \
  -F "file=@test.pdf" \
  -F "filename=<script>alert('XSS')</script>.pdf"
# Expected: 201 Created, filename sanitized
```

**Manual Testing**:
1. Create ticket with title: `<script>alert('XSS')</script>`
2. View ticket in browser
3. Verify script does not execute
4. Verify title is displayed as text: `<script>alert('XSS')</script>`

### 6. CSRF (Cross-Site Request Forgery) Prevention

#### Test CSRF Protection
- [ ] State-changing operations require authentication
- [ ] SameSite cookie attribute is set
- [ ] Origin/Referer headers are validated
- [ ] CSRF tokens are used for sensitive operations

**Test Scenarios**:
```html
<!-- Create malicious page: csrf-test.html -->
<html>
<body>
  <form action="http://localhost:3000/api/tickets" method="POST">
    <input type="hidden" name="title" value="CSRF Attack">
    <input type="hidden" name="description" value="This is a CSRF test">
  </form>
  <script>
    document.forms[0].submit();
  </script>
</body>
</html>
```

Expected: Request should fail due to:
- Missing authentication token
- CORS policy
- SameSite cookie attribute

### 7. File Upload Security

#### Test File Upload Vulnerabilities
- [ ] File size limits are enforced (50MB max)
- [ ] File type validation works
- [ ] Malicious files are rejected
- [ ] Files are scanned for malware (optional)
- [ ] File names are sanitized
- [ ] Files are stored securely in R2

**Test Scenarios**:
```bash
# Test oversized file
dd if=/dev/zero of=large.pdf bs=1M count=51
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer valid_token" \
  -F "file=@large.pdf"
# Expected: 400 Bad Request (file too large)

# Test disallowed file type
echo "<?php system($_GET['cmd']); ?>" > malicious.php
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer valid_token" \
  -F "file=@malicious.php"
# Expected: 400 Bad Request (file type not allowed)

# Test executable file
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer valid_token" \
  -F "file=@malware.exe"
# Expected: 400 Bad Request (file type not allowed)

# Test path traversal in filename
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer valid_token" \
  -F "file=@test.pdf" \
  -F "filename=../../etc/passwd"
# Expected: 201 Created, but filename sanitized
```

### 8. API Rate Limiting

#### Test Rate Limiting
- [ ] API endpoints have rate limits
- [ ] Excessive requests are throttled
- [ ] Rate limit headers are returned
- [ ] Different limits for authenticated vs unauthenticated

**Test Scenarios**:
```bash
# Test rate limiting
for i in {1..150}; do
  curl -X GET http://localhost:3000/api/tickets \
    -H "Authorization: Bearer valid_token" \
    -w "\n%{http_code}\n"
done
# Expected: First 100 requests succeed, then 429 Too Many Requests

# Check rate limit headers
curl -I http://localhost:3000/api/tickets \
  -H "Authorization: Bearer valid_token"
# Expected headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1234567890
```

### 9. Sensitive Data Exposure

#### Test Data Exposure
- [ ] Passwords are never returned in API responses
- [ ] API keys are not exposed in client-side code
- [ ] Error messages don't leak sensitive information
- [ ] Stack traces are not shown in production
- [ ] Database connection strings are not exposed

**Test Scenarios**:
```bash
# Test user endpoint doesn't return password
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer valid_token"
# Expected: User data without password field

# Test error messages don't leak info
curl -X GET http://localhost:3000/api/tickets/invalid_id \
  -H "Authorization: Bearer valid_token"
# Expected: Generic error message, not database error

# Test 404 vs 403 to avoid info leakage
curl -X GET http://localhost:3000/api/tickets/other_client_ticket \
  -H "Authorization: Bearer valid_token"
# Expected: 404 Not Found (not 403 Forbidden)
```

### 10. HTTPS and TLS

#### Test HTTPS Configuration
- [ ] All connections use HTTPS in production
- [ ] HTTP redirects to HTTPS
- [ ] TLS 1.2+ is enforced
- [ ] Strong cipher suites are used
- [ ] HSTS header is set

**Test Commands**:
```bash
# Test HTTP to HTTPS redirect
curl -I http://portal.techsupportcs.com
# Expected: 301 Moved Permanently to https://

# Test HSTS header
curl -I https://portal.techsupportcs.com
# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains

# Test TLS version
openssl s_client -connect portal.techsupportcs.com:443 -tls1_1
# Expected: Connection refused (TLS 1.1 not supported)

openssl s_client -connect portal.techsupportcs.com:443 -tls1_2
# Expected: Connection successful
```

## Security Testing Tools

### Automated Security Scanning

#### OWASP ZAP
```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000

# Run full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:3000
```

#### npm audit
```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

#### Snyk
```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

### Manual Security Testing

#### Burp Suite
1. Configure browser to use Burp proxy
2. Navigate through application
3. Review HTTP history
4. Test for vulnerabilities:
   - SQL injection
   - XSS
   - CSRF
   - Authentication bypass
   - Authorization issues

#### Browser DevTools
1. Open DevTools (F12)
2. Check Network tab for:
   - Sensitive data in requests/responses
   - Unencrypted connections
   - Exposed API keys
3. Check Console for:
   - Error messages with sensitive info
   - Debug logs in production
4. Check Application tab for:
   - Insecure cookies
   - Sensitive data in localStorage

## Security Checklist Summary

### Authentication & Authorization
- [x] Clerk authentication integrated
- [x] Role-based access control implemented
- [x] Session management secure
- [x] Password requirements enforced

### Data Protection
- [x] Client data isolation enforced
- [x] Parameterized SQL queries used
- [x] XSS protection via React
- [x] HTTPS enforced in production

### API Security
- [x] Webhook signatures verified
- [x] Input validation with Zod
- [x] Error handling doesn't leak info
- [x] Rate limiting implemented (optional)

### File Security
- [x] File size limits enforced
- [x] File type validation
- [x] Secure storage in R2
- [x] Filename sanitization

### Infrastructure
- [x] Environment variables secured
- [x] Dependencies regularly updated
- [x] Security headers configured
- [x] Audit logging implemented

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public GitHub issue
2. Email security@techsupportcs.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow 90 days for fix before public disclosure
4. Responsible disclosure is appreciated

## Security Maintenance

### Regular Tasks
- [ ] Weekly: Review audit logs for suspicious activity
- [ ] Monthly: Run npm audit and update dependencies
- [ ] Quarterly: Conduct security testing
- [ ] Annually: Full security audit by third party

### Monitoring
- Set up alerts for:
  - Failed login attempts
  - Unauthorized access attempts
  - Unusual API usage patterns
  - Webhook signature failures
  - File upload anomalies

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Clerk Security](https://clerk.com/docs/security)
- [Cloudflare Security](https://www.cloudflare.com/security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
