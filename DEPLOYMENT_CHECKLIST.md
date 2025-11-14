# Production Deployment Checklist

Use this checklist to ensure all steps are completed for a successful production deployment.

## Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No console.log statements in production code
- [ ] Environment-specific code properly configured
- [ ] Dependencies up to date (`npm audit` clean)
- [ ] Build succeeds locally (`npm run pages:build`)

### Documentation
- [ ] README.md updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide available

### Version Control
- [ ] All changes committed
- [ ] Working branch merged to `main`
- [ ] Git tags created for release
- [ ] Changelog updated

---

## Cloudflare Setup

### Pages Project
- [ ] GitHub repository connected
- [ ] Build command configured: `npm run pages:build`
- [ ] Build output directory set: `.vercel/output/static`
- [ ] Production branch set to `main`
- [ ] Build caching enabled

### D1 Database
- [ ] Production database created
- [ ] Database ID copied and saved
- [ ] `wrangler.toml` updated with database ID
- [ ] Schema initialized (`schema.sql` executed)
- [ ] Indexes created
- [ ] Initial data seeded
- [ ] Database bound to Pages project
- [ ] Database connection tested

### R2 Storage
- [ ] Production bucket created
- [ ] CORS configuration applied
- [ ] Lifecycle rules configured
- [ ] Bucket bound to Pages project
- [ ] Upload/download tested

---

## External Services

### Clerk Authentication
- [ ] Production application created
- [ ] API keys obtained (publishable and secret)
- [ ] Authentication methods configured
- [ ] Allowed domains added
- [ ] Webhook endpoint created
- [ ] Webhook secret obtained
- [ ] Test user created and verified

### PayPal Integration
- [ ] Business account verified
- [ ] Live app created in Developer Dashboard
- [ ] Client ID and Secret obtained
- [ ] Required features enabled (Payments, Subscriptions)
- [ ] Webhook endpoint created
- [ ] Webhook ID obtained
- [ ] Return URLs configured
- [ ] Test payment completed in sandbox

### GitHub Integration
- [ ] Personal access token created
- [ ] Token scopes verified (`repo` or `public_repo`)
- [ ] Token tested with API call
- [ ] Repository webhooks configured (if needed)
- [ ] Webhook secrets generated and stored

### SendGrid Email
- [ ] Account created and verified
- [ ] Sender identity verified (single sender or domain)
- [ ] API key created with Mail Send permission
- [ ] From email configured
- [ ] Test email sent successfully
- [ ] Email templates created (optional)

---

## Environment Variables

### Clerk Variables
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

### PayPal Variables
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_MODE` (set to `live`)
- [ ] `PAYPAL_WEBHOOK_ID`

### GitHub Variables
- [ ] `GITHUB_TOKEN`
- [ ] `GITHUB_WEBHOOK_SECRET` (if using)

### SendGrid Variables
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`

### Application Variables
- [ ] `NEXT_PUBLIC_APP_URL`

### Verification
- [ ] All variables added to Cloudflare Pages
- [ ] Variables set for Production environment
- [ ] No typos in variable names
- [ ] No extra spaces in values
- [ ] Validation script run: `./scripts/validate-env.sh`

---

## Deployment

### Initial Deployment
- [ ] Application built successfully
- [ ] Deployment triggered (manual or via GitHub)
- [ ] Build logs reviewed for errors
- [ ] Deployment completed successfully
- [ ] Deployment URL accessible

### Custom Domain
- [ ] Custom domain added in Cloudflare
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] Domain accessible via HTTPS
- [ ] `NEXT_PUBLIC_APP_URL` updated to custom domain
- [ ] Application redeployed with new URL

### Webhook URLs
- [ ] Clerk webhook URL updated to custom domain
- [ ] PayPal webhook URL updated to custom domain
- [ ] GitHub webhook URLs updated to custom domain
- [ ] All webhooks tested and verified

---

## Post-Deployment Testing

### Authentication
- [ ] User registration works
- [ ] Email/password login works
- [ ] Social login works (Google, Microsoft)
- [ ] Password reset works
- [ ] Session persists across page refreshes
- [ ] User can sign out

### Dashboard
- [ ] Dashboard loads correctly
- [ ] Stats cards display data
- [ ] Activity feed shows recent events
- [ ] Navigation works
- [ ] User profile accessible

### Tickets
- [ ] User can create ticket
- [ ] Ticket appears in list
- [ ] Ticket detail page loads
- [ ] Comments can be added
- [ ] Email notification received
- [ ] GitHub issue created (if linked to project)

### Projects
- [ ] Projects list displays
- [ ] Project detail page loads
- [ ] Linked tickets shown
- [ ] Documents accessible

### Invoices
- [ ] Invoices list displays
- [ ] Invoice detail page loads
- [ ] PDF generation works
- [ ] Invoice email received

### Payments
- [ ] PayPal button appears on unpaid invoice
- [ ] PayPal checkout flow works
- [ ] Payment webhook received
- [ ] Invoice status updates to "paid"
- [ ] Receipt email received

### Documents
- [ ] File upload works (up to 50MB)
- [ ] Uploaded file appears in list
- [ ] File download works
- [ ] Pre-signed URL expires after 1 hour
- [ ] File deletion works

### Subscriptions
- [ ] Service packages display
- [ ] Subscription creation works
- [ ] PayPal subscription flow completes
- [ ] Subscription appears in list
- [ ] Subscription cancellation works

### Admin Functions
- [ ] Admin dashboard accessible
- [ ] Client list displays
- [ ] Invoice creation works
- [ ] Usage reports display
- [ ] User impersonation works

---

## Monitoring Setup

### Cloudflare Analytics
- [ ] Analytics dashboard accessible
- [ ] Traffic metrics visible
- [ ] Error rates monitored
- [ ] Performance metrics tracked

### Uptime Monitoring
- [ ] UptimeRobot account created
- [ ] Homepage monitor added
- [ ] API endpoint monitors added
- [ ] Alert contacts configured
- [ ] Test alert received
- [ ] Status page created (optional)

### Error Tracking
- [ ] Application logging working
- [ ] Sentry configured (optional)
- [ ] Error alerts set up
- [ ] Test error logged and received

### Logs
- [ ] Log streaming tested
- [ ] Structured logging implemented
- [ ] Log aggregation working
- [ ] Critical errors alerting

### Alerts
- [ ] Cloudflare notifications configured
- [ ] Email alerts tested
- [ ] Slack integration set up (optional)
- [ ] Alert thresholds set appropriately

---

## Security

### SSL/TLS
- [ ] HTTPS enforced
- [ ] SSL certificate valid
- [ ] Certificate expiry monitored
- [ ] HTTP redirects to HTTPS

### Authentication
- [ ] Clerk authentication working
- [ ] Session management secure
- [ ] Password requirements enforced
- [ ] 2FA available (via Clerk)

### Authorization
- [ ] Role-based access control working
- [ ] Admin routes protected
- [ ] Client data isolation verified
- [ ] API routes require authentication

### Webhooks
- [ ] All webhook signatures verified
- [ ] Webhook secrets stored securely
- [ ] Invalid signatures rejected
- [ ] Webhook delivery logged

### Data Protection
- [ ] Database encrypted at rest
- [ ] R2 objects encrypted
- [ ] Sensitive data not logged
- [ ] API keys not exposed

---

## Performance

### Load Times
- [ ] Homepage loads < 2 seconds
- [ ] Dashboard loads < 3 seconds
- [ ] API responses < 500ms
- [ ] Lighthouse score > 90

### Optimization
- [ ] Static assets cached
- [ ] Images optimized
- [ ] Code splitting working
- [ ] Bundle size acceptable

### Database
- [ ] Queries optimized
- [ ] Indexes used effectively
- [ ] Pagination implemented
- [ ] Connection pooling working

### CDN
- [ ] Cloudflare CDN active
- [ ] Cache hit rate > 80%
- [ ] Edge caching working
- [ ] Geographic distribution optimal

---

## Data Management

### Initial Data
- [ ] Service packages seeded
- [ ] Admin user created
- [ ] Test data removed
- [ ] Sample data added (optional)

### Backups
- [ ] Backup script tested
- [ ] Automated backups scheduled
- [ ] Backup retention configured (30 days)
- [ ] Restoration procedure documented
- [ ] Test restoration completed

### Migrations
- [ ] Migration scripts ready
- [ ] Rollback procedures documented
- [ ] Schema changes tested
- [ ] Data integrity verified

---

## Documentation

### User Documentation
- [ ] User guide available
- [ ] Feature documentation complete
- [ ] FAQ created
- [ ] Video tutorials (optional)

### Admin Documentation
- [ ] Admin guide available
- [ ] Configuration documented
- [ ] Maintenance procedures documented
- [ ] Troubleshooting guide available

### Developer Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Architecture documented
- [ ] Deployment guide available

### Operations
- [ ] Runbooks created
- [ ] Incident response plan documented
- [ ] Escalation procedures defined
- [ ] Contact information updated

---

## Team Preparation

### Training
- [ ] Team trained on portal features
- [ ] Admin functions demonstrated
- [ ] Monitoring tools explained
- [ ] Support procedures reviewed

### Access
- [ ] Team members have Cloudflare access
- [ ] Admin users created in portal
- [ ] Monitoring dashboards shared
- [ ] Documentation accessible

### Communication
- [ ] Deployment announced to team
- [ ] Known issues communicated
- [ ] Support channels established
- [ ] Feedback mechanism in place

---

## Compliance

### Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy published (if applicable)
- [ ] GDPR compliance verified (if applicable)

### Business
- [ ] Service level agreements defined
- [ ] Support hours established
- [ ] Pricing confirmed
- [ ] Billing procedures documented

---

## Launch

### Pre-Launch
- [ ] All checklist items completed
- [ ] Final testing completed
- [ ] Stakeholders notified
- [ ] Support team ready

### Launch
- [ ] DNS cutover completed (if applicable)
- [ ] Application accessible
- [ ] All services operational
- [ ] Monitoring active

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Address any issues immediately
- [ ] Collect user feedback
- [ ] Document lessons learned

---

## Post-Deployment

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check webhook delivery
- [ ] Verify email delivery
- [ ] Review performance metrics
- [ ] Address critical issues

### First Week
- [ ] Review analytics daily
- [ ] Monitor user feedback
- [ ] Optimize based on usage
- [ ] Update documentation as needed

### First Month
- [ ] Review all metrics
- [ ] Analyze usage patterns
- [ ] Plan improvements
- [ ] Schedule maintenance

---

## Maintenance Schedule

### Daily
- [ ] Check error rates
- [ ] Monitor uptime
- [ ] Review critical alerts

### Weekly
- [ ] Review analytics
- [ ] Check database size
- [ ] Review logs
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Review all metrics
- [ ] Optimize database
- [ ] Update documentation
- [ ] Plan improvements
- [ ] Review security

### Quarterly
- [ ] Test backup restoration
- [ ] Rotate credentials
- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning

---

## Emergency Procedures

### Rollback
- [ ] Rollback procedure documented
- [ ] Previous deployment identified
- [ ] Rollback tested
- [ ] Team knows how to rollback

### Incident Response
- [ ] Incident response plan documented
- [ ] On-call schedule established
- [ ] Escalation path defined
- [ ] Communication plan ready

### Disaster Recovery
- [ ] Disaster recovery plan documented
- [ ] Backup restoration tested
- [ ] Alternative hosting identified (if needed)
- [ ] Recovery time objective defined

---

## Sign-Off

### Technical Lead
- [ ] All technical requirements met
- [ ] Code quality acceptable
- [ ] Performance acceptable
- [ ] Security verified

**Name:** ________________  
**Date:** ________________  
**Signature:** ________________

### Project Manager
- [ ] All project requirements met
- [ ] Timeline met
- [ ] Budget met
- [ ] Stakeholders satisfied

**Name:** ________________  
**Date:** ________________  
**Signature:** ________________

### Business Owner
- [ ] Business requirements met
- [ ] Ready for production use
- [ ] Support plan in place
- [ ] Approved for launch

**Name:** ________________  
**Date:** ________________  
**Signature:** ________________

---

## Notes

Use this section to document any deviations from the checklist, known issues, or special considerations:

```
[Add notes here]
```

---

## Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Cloudflare Setup](./CLOUDFLARE_SETUP.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Database Setup](./DATABASE_STORAGE_SETUP.md)
- [Webhook Setup](./WEBHOOK_SETUP.md)
- [Monitoring Setup](./MONITORING_SETUP.md)

---

**Deployment Date:** ________________  
**Deployment Version:** ________________  
**Deployed By:** ________________
