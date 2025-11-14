# Deployment Documentation

This directory contains comprehensive documentation for deploying the Tech Support Client Portal to production.

## Quick Start

If you're deploying for the first time, follow these guides in order:

1. **[Deployment Checklist](../../DEPLOYMENT_CHECKLIST.md)** - Complete checklist for production deployment
2. **[Cloudflare Setup](../../CLOUDFLARE_SETUP.md)** - Configure Cloudflare Pages, D1, and R2
3. **[Environment Setup](../../ENVIRONMENT_SETUP.md)** - Configure all environment variables
4. **[Database & Storage Setup](../../DATABASE_STORAGE_SETUP.md)** - Initialize database and storage
5. **[Webhook Setup](../../WEBHOOK_SETUP.md)** - Configure webhooks in external services
6. **[Monitoring Setup](../../MONITORING_SETUP.md)** - Set up monitoring and alerts

## Documentation Overview

### Main Guides

#### [DEPLOYMENT.md](../../DEPLOYMENT.md)
Comprehensive deployment guide covering:
- Prerequisites and setup
- Cloudflare Pages configuration
- Database and storage initialization
- Environment variables
- Webhook configuration
- Custom domain setup
- Monitoring and alerts
- Troubleshooting

#### [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md)
Complete checklist for production deployment:
- Pre-deployment tasks
- Cloudflare setup
- External services configuration
- Environment variables
- Testing procedures
- Monitoring setup
- Post-deployment tasks

### Setup Guides

#### [CLOUDFLARE_SETUP.md](../../CLOUDFLARE_SETUP.md)
Step-by-step Cloudflare configuration:
- Connect GitHub repository
- Configure build settings
- Set up D1 database
- Set up R2 storage
- Configure environment variables
- Deploy application
- Custom domain setup

#### [ENVIRONMENT_SETUP.md](../../ENVIRONMENT_SETUP.md)
Detailed environment variables guide:
- Clerk authentication setup
- PayPal integration setup
- GitHub integration setup
- SendGrid email setup
- Application configuration
- Setting variables in Cloudflare
- Verification procedures

#### [DATABASE_STORAGE_SETUP.md](../../DATABASE_STORAGE_SETUP.md)
Database and storage configuration:
- D1 database creation
- Schema initialization
- Data seeding
- R2 bucket creation
- CORS configuration
- Lifecycle rules
- Admin user creation
- Maintenance procedures

#### [WEBHOOK_SETUP.md](../../WEBHOOK_SETUP.md)
Webhook configuration guide:
- Clerk webhook setup
- PayPal webhook setup
- GitHub webhook setup
- Testing webhooks
- Troubleshooting
- Security best practices

#### [MONITORING_SETUP.md](../../MONITORING_SETUP.md)
Monitoring and alerting guide:
- Cloudflare Analytics
- Application logging
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Performance monitoring
- Alerts configuration
- Custom dashboard

## Scripts

### Deployment Scripts

Located in `scripts/` directory:

#### `deploy-production.sh`
Automated production deployment script:
```bash
./scripts/deploy-production.sh
```

Features:
- Prerequisites check
- Test execution
- Application build
- Cloudflare Pages deployment
- Post-deployment verification

#### `init-production.sh`
Initialize production database and storage:
```bash
./scripts/init-production.sh
```

Features:
- D1 database creation
- Schema initialization
- Data seeding
- R2 bucket creation
- CORS and lifecycle configuration

#### `create-admin-user.sh`
Create admin user in production:
```bash
./scripts/create-admin-user.sh
```

Features:
- Interactive user creation
- Client record creation
- Admin role assignment
- Verification

#### `validate-env.sh`
Validate environment variables:
```bash
./scripts/validate-env.sh
```

Features:
- Check all required variables
- Identify missing variables
- Verify configuration

#### `test-webhooks.sh`
Test webhook endpoints:
```bash
./scripts/test-webhooks.sh https://portal.yourdomain.com
```

Features:
- Test all webhook endpoints
- Verify accessibility
- Report status

#### `check-health.sh`
System health check:
```bash
./scripts/check-health.sh https://portal.yourdomain.com
```

Features:
- Application health check
- Database connectivity
- Storage accessibility
- SSL certificate verification
- DNS resolution

## Deployment Workflows

### GitHub Actions

Located in `.github/workflows/`:

#### `deploy-production.yml`
Automatic deployment on push to `main`:
- Runs tests
- Builds application
- Deploys to Cloudflare Pages
- Notifies on success/failure

#### `deploy-preview.yml`
Preview deployment for pull requests:
- Builds application
- Deploys preview
- Comments PR with preview URL

## Quick Reference

### Common Commands

```bash
# Build application
npm run pages:build

# Deploy to production
npm run deploy:production

# Initialize production database
npm run db:init:production

# Seed production data
npm run db:seed:production

# Query production database
npm run db:query:production "SELECT COUNT(*) FROM clients"

# Stream production logs
wrangler pages deployment tail --project-name=tech-support-client-portal

# Check system health
./scripts/check-health.sh https://portal.yourdomain.com
```

### Environment Variables

All required environment variables are documented in:
- [.env.example](../../.env.example) - Template with all variables
- [ENVIRONMENT_SETUP.md](../../ENVIRONMENT_SETUP.md) - Detailed setup guide

### Troubleshooting

Common issues and solutions:

**Build Failures**
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Review build logs in Cloudflare dashboard

**Database Connection Issues**
- Verify database binding in Cloudflare
- Check database ID in wrangler.toml
- Ensure schema is initialized

**Webhook Failures**
- Verify webhook secrets are set
- Check webhook URLs are correct
- Review webhook delivery in service dashboards

**Environment Variable Issues**
- Run validation script: `./scripts/validate-env.sh`
- Check for typos in variable names
- Ensure variables are set for Production environment

## Support

### Documentation
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)
- [Next.js Docs](https://nextjs.org/docs)

### Community
- [Cloudflare Community](https://community.cloudflare.com)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

### Services
- [Clerk Support](https://clerk.com/support)
- [PayPal Developer Support](https://developer.paypal.com/support)
- [SendGrid Support](https://support.sendgrid.com)

## Best Practices

### Before Deployment
1. Test thoroughly in development
2. Review all code changes
3. Update documentation
4. Run validation scripts
5. Backup current production data

### During Deployment
1. Deploy during low-traffic periods
2. Monitor deployment progress
3. Watch for errors in logs
4. Test critical functionality immediately
5. Keep rollback plan ready

### After Deployment
1. Monitor for 24 hours
2. Check all integrations
3. Verify webhook delivery
4. Review performance metrics
5. Address issues promptly

### Security
1. Never commit secrets to Git
2. Rotate credentials regularly
3. Use minimal permissions
4. Enable 2FA on all accounts
5. Monitor for suspicious activity

### Performance
1. Monitor response times
2. Optimize slow queries
3. Review cache hit rates
4. Check database size
5. Plan for growth

## Maintenance

### Daily
- Check error rates
- Monitor uptime
- Review critical alerts

### Weekly
- Review analytics
- Check database size
- Update dependencies (if needed)

### Monthly
- Optimize database
- Review all metrics
- Update documentation
- Plan improvements

### Quarterly
- Test backup restoration
- Rotate credentials
- Security audit
- Performance review

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial production deployment |

## Contributors

- Development Team
- DevOps Team
- QA Team

## License

Proprietary - Tech Support Computer Services

---

**Last Updated:** [Date]  
**Maintained By:** [Team/Person]  
**Contact:** [Email/Slack]
