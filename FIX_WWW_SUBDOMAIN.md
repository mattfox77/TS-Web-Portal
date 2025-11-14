# Fix WWW Subdomain - Quick Guide

## Problem
- ✅ `https://techsupportcomputerservices.com` works
- ❌ `https://www.techsupportcomputerservices.com` doesn't work

## Solution
Add the www subdomain to your DNS in Cloudflare.

---

## Step-by-Step Instructions

### Option 1: Add A Record (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Select your domain: `techsupportcomputerservices.com`

2. **Navigate to DNS Settings**
   - Click on "DNS" in the left sidebar
   - Click "Records" tab

3. **Add New A Record**
   - Click "Add record" button
   - Fill in the following:
     - **Type**: `A`
     - **Name**: `www`
     - **IPv4 address**: `76.76.21.21`
     - **Proxy status**: Click the cloud icon to make it **gray** (DNS only, not proxied)
     - **TTL**: `Auto`
   - Click "Save"

### Option 2: Add CNAME Record (Alternative)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Select your domain: `techsupportcomputerservices.com`

2. **Navigate to DNS Settings**
   - Click on "DNS" in the left sidebar
   - Click "Records" tab

3. **Add New CNAME Record**
   - Click "Add record" button
   - Fill in the following:
     - **Type**: `CNAME`
     - **Name**: `www`
     - **Target**: `cname.vercel-dns.com`
     - **Proxy status**: Click the cloud icon to make it **gray** (DNS only, not proxied)
     - **TTL**: `Auto`
   - Click "Save"

---

## Important Notes

⚠️ **Proxy Status Must Be Gray (DNS Only)**
- The cloud icon next to your DNS record MUST be gray, not orange
- Orange = Cloudflare proxy (will not work with Vercel)
- Gray = DNS only (will work with Vercel)

⏱️ **DNS Propagation Time**
- Changes typically take 5-15 minutes
- Can take up to 24 hours in rare cases
- You'll receive an email from Vercel when verification is complete

---

## Verification

After adding the DNS record, wait a few minutes and then test:

1. **Check DNS Resolution**
   ```bash
   dig www.techsupportcomputerservices.com +short
   ```
   Should return: `76.76.21.21`

2. **Test in Browser**
   - Visit: `https://www.techsupportcomputerservices.com`
   - Should load your site

3. **Check Vercel Status**
   ```bash
   npx vercel domains inspect www.techsupportcomputerservices.com
   ```
   Should show the domain is configured properly

---

## Current Status

✅ **Completed:**
- Root domain (`techsupportcomputerservices.com`) is working
- www subdomain added to Vercel project
- Vercel is ready to serve www traffic

⏳ **Waiting For:**
- DNS record to be added in Cloudflare
- DNS propagation (5-15 minutes after adding)

---

## Troubleshooting

### Still not working after 15 minutes?

1. **Clear your browser cache**
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Or try in incognito/private window

2. **Verify DNS record is correct**
   - Check that the record type is `A` with IP `76.76.21.21`
   - OR `CNAME` with target `cname.vercel-dns.com`
   - Verify proxy status is **gray** (not orange)

3. **Flush your local DNS cache**
   - Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - Windows: `ipconfig /flushdns`

4. **Check from different location**
   - Use https://dnschecker.org to see if DNS has propagated globally
   - Enter: `www.techsupportcomputerservices.com`

### Need Help?

Contact your domain registrar or Cloudflare support if:
- You can't access Cloudflare dashboard
- DNS changes aren't saving
- Still not working after 24 hours
