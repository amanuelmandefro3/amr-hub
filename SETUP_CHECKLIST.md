# Setup & Deployment Checklist

Complete this checklist to fully deploy the enhanced AMR Hub with authentication.

## Pre-Deployment Setup

### Environment Configuration
- [ ] Generate `BETTER_AUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```
  Copy the output and save it

- [ ] Add to `.env.local`:
  ```
  BETTER_AUTH_SECRET=<your-generated-secret>
  AUTH_BOOTSTRAP_TOKEN=<your-bootstrap-token>
  DATABASE_URL=postgresql://user:password@host:port/dbname
  DIRECT_URL=postgresql://user:password@host:port/dbname
  ```

- [ ] Verify all env vars are set:
  ```bash
  echo $BETTER_AUTH_SECRET
  echo $DATABASE_URL
  ```

### Database Setup
- [ ] Ensure PostgreSQL connection is working:
  ```bash
  psql $DATABASE_URL -c "SELECT 1;"
  ```

- [ ] Run Prisma migrations:
  ```bash
  cd /vercel/share/v0-project
  npx prisma migrate dev --name add-invitations
  ```

- [ ] Verify tables created:
  ```bash
  npx prisma db execute --stdin < - <<EOF
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  EOF
  ```

### Local Testing
- [ ] Start development server:
  ```bash
  npm run dev
  ```

- [ ] Test signup page (`/signup`):
  - [ ] Load page successfully
  - [ ] Test password strength indicator
  - [ ] Create test account
  - [ ] Verify redirect to dashboard
  - [ ] Login with created account

- [ ] Test login page (`/login`):
  - [ ] See "Create account now" link
  - [ ] Link goes to `/signup`
  - [ ] Login with test account works
  - [ ] Session persists on refresh

- [ ] Test auth API endpoints:
  ```bash
  # Test signup
  curl -X POST http://localhost:3000/api/auth/sign-up/email \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123"}'
  ```

- [ ] Check database:
  ```bash
  npx prisma studio
  ```
  - [ ] New user appears in `User` table
  - [ ] Session created in `Session` table
  - [ ] No migration errors

## Email Integration (Optional but Recommended)

### Choose Email Service
- [ ] Resend (recommended)
  ```bash
  npm install resend
  ```
  Add to `.env.local`: `RESEND_API_KEY=re_xxx...`

- [ ] OR SendGrid
  ```bash
  npm install @sendgrid/mail
  ```
  Add to `.env.local`: `SENDGRID_API_KEY=SG.xxx...`

- [ ] OR Mailgun
  ```bash
  npm install mailgun.js
  ```
  Add to `.env.local`: `MAILGUN_KEY=key-xxx...`

### Implement Email Sending
- [ ] Update `/api/invitations/send/route.ts`:
  - [ ] Uncomment email service code
  - [ ] Add email template
  - [ ] Test invitation email

- [ ] Create email template with:
  - [ ] Inviter name
  - [ ] Invitation link
  - [ ] Expiration date
  - [ ] Brand logo
  - [ ] Company branding

## Production Deployment

### Pre-Deployment
- [ ] Run tests:
  ```bash
  npm run build
  npm run lint
  ```

- [ ] Review code:
  - [ ] No console.log statements
  - [ ] No hardcoded secrets
  - [ ] Error handling complete

### Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel:
  - [ ] `BETTER_AUTH_SECRET`
  - [ ] `AUTH_BOOTSTRAP_TOKEN`
  - [ ] `DATABASE_URL`
  - [ ] `DIRECT_URL`
  - [ ] Email service keys (if using)

- [ ] Deploy:
  ```bash
  git push origin main
  ```

- [ ] Verify deployment:
  - [ ] Check build logs (no errors)
  - [ ] Visit https://yourdomain.com/login
  - [ ] Test signup flow
  - [ ] Verify database connectivity

### Production Testing
- [ ] Test complete signup flow:
  - [ ] Fill form with test data
  - [ ] Verify email (if implemented)
  - [ ] Login with new account
  - [ ] Check user in Prisma Studio

- [ ] Test error cases:
  - [ ] Duplicate email
  - [ ] Weak password
  - [ ] Missing fields
  - [ ] Network errors

- [ ] Test invitation flow:
  - [ ] Send invitation via API
  - [ ] Click invitation link
  - [ ] Accept invitation
  - [ ] Login as invited user

- [ ] Performance check:
  - [ ] Page load time < 3 seconds
  - [ ] Form submission < 2 seconds
  - [ ] No console errors

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry):
  ```bash
  npm install @sentry/nextjs
  ```
  Configure in `next.config.js`

- [ ] Monitor database queries:
  - [ ] Check for slow queries
  - [ ] Verify indexes working
  - [ ] Monitor connection pool

- [ ] Set up alerts:
  - [ ] Failed signup attempts
  - [ ] Database errors
  - [ ] API errors

### User Communication
- [ ] Update website homepage with signup link
- [ ] Create onboarding documentation
- [ ] Set up support email (help@amrhub.com)
- [ ] Create FAQ section

### Ongoing Maintenance
- [ ] Monitor invitation statistics
- [ ] Track user signups
- [ ] Watch for bot signups
- [ ] Implement CAPTCHA if needed:
  ```bash
  npm install next-recaptcha
  ```

## Security Checklist

- [ ] HTTPS enabled on all pages
- [ ] CORS properly configured
- [ ] Rate limiting active:
  - [ ] Signup attempts: 5 per hour per IP
  - [ ] Login attempts: 10 per hour per IP
  - [ ] API endpoints: throttled appropriately

- [ ] Passwords:
  - [ ] Minimum 12 characters enforced
  - [ ] Bcrypt hashing (12 rounds)
  - [ ] Never logged or stored in plain text

- [ ] Tokens:
  - [ ] 7-day expiration
  - [ ] Secure random generation
  - [ ] Used once only
  - [ ] Tied to email

- [ ] Sessions:
  - [ ] HTTP-only cookies
  - [ ] Secure flag set
  - [ ] SameSite=Strict
  - [ ] Expiration set

- [ ] Database:
  - [ ] Connection encrypted (SSL)
  - [ ] Backups enabled
  - [ ] Row-level security configured
  - [ ] Sensitive data indexed

- [ ] API:
  - [ ] Authentication required
  - [ ] Rate limiting active
  - [ ] Input validation
  - [ ] Error messages don't leak info

## Testing Scenarios

### Scenario 1: New User Self-Signup
```
1. Visit /signup
2. Fill form (name, email, password, confirm password)
3. Accept terms
4. Click Create Account
5. Verify success message
6. Auto-redirect to /
7. Verify logged in
8. Can access dashboard
```

### Scenario 2: Team Invitation
```
1. Admin goes to team management (future)
2. Enters new team member email
3. Selects role (MEMBER)
4. Clicks "Send Invitation"
5. Invitation saved to database
6. Email sent with /invite/[token] link
7. Team member clicks link
8. Sees invitation acceptance form
9. Fills name and password
10. Clicks "Accept Invitation"
11. Account created
12. Auto-login
13. Redirect to dashboard
14. User is team member
```

### Scenario 3: Invalid/Expired Invitation
```
1. Try to visit /invite/[invalid-token]
2. See error: "Invalid or expired invitation"
3. Link back to login page
4. Can still login with existing account
```

### Scenario 4: Existing Account Signup Attempt
```
1. User tries to signup with existing email
2. See error: "Email already in use"
3. Offer link to login page
4. User can reset password if needed
```

## Rollback Plan

If deployment issues occur:

### Database Issues
```bash
# Rollback migration
npx prisma migrate resolve --rolled-back "add-invitations"

# Or manually reset
psql $DATABASE_URL -c "DROP TABLE invitation CASCADE;"
```

### Code Issues
```bash
# Revert to previous version
git revert HEAD
git push origin main
```

### Vercel Rollback
```bash
# In Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "Redeploy"
```

## Success Criteria

✅ All items checked = Ready for production

- [ ] Signup page works end-to-end
- [ ] Login page accepts credentials
- [ ] Invitation system functional
- [ ] Database migrations successful
- [ ] Environment variables configured
- [ ] Error handling working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Monitoring in place

## Quick Reference Commands

```bash
# Local development
npm run dev
npx prisma studio

# Database operations
npx prisma migrate dev
npx prisma db seed
npx prisma db push

# Build & test
npm run build
npm run lint
npm run type-check

# Deployment
git add .
git commit -m "Deploy: Enhanced auth system"
git push origin main

# Environment check
echo "BETTER_AUTH_SECRET: $BETTER_AUTH_SECRET"
echo "DATABASE_URL: $DATABASE_URL"

# Test endpoints
curl http://localhost:3000/signup
curl http://localhost:3000/login
curl http://localhost:3000/invite/test-token
```

## Support & Troubleshooting

### Common Issues

**Issue:** "Invalid server environment - BETTER_AUTH_SECRET: Required"
```
Solution: Make sure BETTER_AUTH_SECRET is in .env.local
```

**Issue:** Database migration fails
```
Solution: 
1. Check DATABASE_URL connection
2. Verify table doesn't already exist
3. Run: npx prisma migrate reset
```

**Issue:** Signup page doesn't load
```
Solution:
1. Check browser console for errors
2. Check server logs: npm run dev
3. Verify all env vars set
```

**Issue:** Email not sending
```
Solution:
1. Verify email service configured
2. Check API keys in .env.local
3. Review email service dashboard for errors
```

---

**Last Updated:** July 28, 2026
**Status:** Ready for Deployment
**Estimated Setup Time:** 30-45 minutes
