# Developer Reference Card

Quick reference for developers working on AMR Hub's authentication system.

## File Locations

### Auth Pages
- Signup: `src/app/signup/page.tsx`
- Login: `src/app/login/page.tsx`
- Invite: `src/app/invite/[token]/page.tsx`

### API Routes
- Verify: `src/app/api/invitations/verify/route.ts`
- Accept: `src/app/api/invitations/accept/route.ts`
- Send: `src/app/api/invitations/send/route.ts`

### Components
- ThroughputChart: `src/app/components/ThroughputChart.tsx`
- MetricCard: `src/app/components/MetricCard.tsx`
- PriorityRing: `src/app/components/PriorityRing.tsx`
- ActivityFeed: `src/app/components/ActivityFeed.tsx`

### Database
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Client: `prisma/client.ts`

### Utilities
- Utils: `src/lib/utils.ts`
- Auth Client: `src/lib/auth-client.ts`
- Auth Server: `src/lib/auth.ts`

---

## Common Commands

### Development
```bash
npm run dev              # Start dev server
npx prisma studio      # Open Prisma Studio
npm run build           # Build for production
npm run lint            # Run linter
```

### Database
```bash
npx prisma migrate dev           # Create migration
npx prisma migrate deploy        # Deploy migration
npx prisma migrate reset         # Reset database
npx prisma db seed              # Run seed script
npx prisma db push              # Sync schema
```

### Testing
```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Password123"}'

# Test invite verification
curl -X POST http://localhost:3000/api/invitations/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token"}'
```

---

## Component Usage

### ThroughputChart
```tsx
import { ThroughputChart } from '@/app/components/ThroughputChart';

<ThroughputChart 
  data={[
    { day: 'Mon', opened: 5, closed: 3 },
    { day: 'Tue', opened: 8, closed: 6 }
  ]} 
/>
```

### MetricCard
```tsx
import { MetricCard } from '@/app/components/MetricCard';

<MetricCard
  icon={<Icon size={18} />}
  label="Active Issues"
  value={42}
  note="5 added this week"
  variant="blue"
/>
```

### PriorityRing
```tsx
import { PriorityRing } from '@/app/components/PriorityRing';

<PriorityRing 
  data={[
    { label: 'High', value: 12, color: '#ef4444' },
    { label: 'Medium', value: 8, color: '#f59e0b' }
  ]} 
/>
```

### ActivityFeed
```tsx
import { ActivityFeed } from '@/app/components/ActivityFeed';

<ActivityFeed 
  issues={issues} 
  maxItems={5} 
/>
```

---

## Database Queries

### Find User by Email
```typescript
const user = await prisma.user.findUnique({
  where: { email }
});
```

### Get Pending Invitations
```typescript
const pending = await prisma.invitation.findMany({
  where: {
    status: 'PENDING',
    expiresAt: { gt: new Date() }
  },
  include: { inviter: true }
});
```

### Create Invitation
```typescript
const invite = await prisma.invitation.create({
  data: {
    email: 'user@example.com',
    token: generateToken(),
    role: 'MEMBER',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    invitedBy: userId
  }
});
```

### Update Invitation Status
```typescript
await prisma.invitation.update({
  where: { id: inviteId },
  data: { status: 'ACCEPTED' }
});
```

### Count User Invitations
```typescript
const count = await prisma.invitation.count({
  where: { 
    invitedBy: userId,
    status: 'PENDING'
  }
});
```

---

## API Endpoints

### POST /api/invitations/verify
```javascript
const response = await fetch('/api/invitations/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'abc123...' })
});
const data = await response.json();
// { email, role, invitedBy } or error
```

### POST /api/invitations/accept
```javascript
const response = await fetch('/api/invitations/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'abc123...',
    name: 'John Doe',
    password: 'SecurePassword123'
  })
});
```

### POST /api/invitations/send
```javascript
const response = await fetch('/api/invitations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'team@example.com',
    role: 'MEMBER'
  })
});
```

---

## Environment Variables

```bash
# Required
BETTER_AUTH_SECRET=your_secret_here
AUTH_BOOTSTRAP_TOKEN=your_token_here
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Optional (for email)
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG...
MAILGUN_KEY=key-...
```

---

## CSS Classes

### Auth Pages
```css
.auth-layout              /* Main layout wrapper */
.auth-form-pane          /* Form container */
.auth-form-wrap          /* Form wrapper */
.auth-heading            /* Page heading */
.auth-back               /* Back button */
.auth-error              /* Error message */
.auth-footer             /* Footer section */
.auth-link               /* Links */
```

### Forms
```css
.form-field              /* Form field wrapper */
.form-checkbox           /* Checkbox input */
.password-input-wrapper  /* Password field wrapper */
.password-toggle         /* Show/hide button */
.password-strength       /* Strength meter */
.strength-bars           /* Strength visualization */
```

### Components
```css
.invite-details          /* Invitation info */
.role-badge              /* Role display */
.success-icon            /* Success state */
.error-icon              /* Error state */
```

---

## Common Errors & Fixes

### "Invalid server environment - BETTER_AUTH_SECRET: Required"
```bash
# Add to .env.local
BETTER_AUTH_SECRET=your_secret
# Restart dev server: npm run dev
```

### "User not found for email"
```bash
# Check database has user
npx prisma studio
# Navigate to User table and verify record exists
```

### "Invitation token not found"
```typescript
// Debug: verify token in database
const invite = await prisma.invitation.findUnique({
  where: { token }
});
console.log('Found invite:', invite);
```

### "Password too weak"
```javascript
// Password must:
// - Be at least 12 characters
// - Have uppercase, lowercase, numbers, special chars
// Example: "MyPass123!@#"
```

---

## Code Patterns

### Protected Route Component
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function ProtectedRoute({ children }) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  
  if (!session) {
    router.push('/login');
    return null;
  }
  return children;
}
```

### Form Submission
```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* data */ })
    });
    
    if (!response.ok) {
      const error = await response.json();
      setError(error.message);
      return;
    }
    
    // Success
    router.push('/next-page');
  } catch (err) {
    setError('An error occurred');
  } finally {
    setLoading(false);
  }
};
```

### Server Action for Auth
```typescript
'use server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return session;
}
```

---

## Git Workflow

### Feature Branch
```bash
git checkout -b feature/add-new-endpoint
# Make changes
git add .
git commit -m "feat: add new API endpoint"
git push origin feature/add-new-endpoint
```

### Merge to Main
```bash
git checkout main
git pull origin main
git merge feature/add-new-endpoint
git push origin main
```

### Quick Push
```bash
git add .
git commit -m "message"
git push
```

---

## Debugging

### Enable Debug Logs
```typescript
// In API route
console.log('[DEBUG] Endpoint called:', { email, role });
console.log('[DEBUG] Data:', data);
```

### Check Database State
```bash
npx prisma studio
# Navigate to tables and inspect data
```

### Browser DevTools
```javascript
// Console
console.log('Current session:', session);
console.log('Form values:', { email, password });

// Network tab
// Check requests to /api/invitations/*
// Verify response status and body
```

### Server Logs
```bash
npm run dev
# Watch for errors and logs in terminal
# Look for [SERVER] [error] entries
```

---

## Performance Tips

### Database Queries
```typescript
// ✅ GOOD: Include relations
await prisma.invitation.findMany({
  include: { inviter: { select: { name: true } } }
});

// ❌ BAD: N+1 queries
const invites = await prisma.invitation.findMany();
invites.map(i => prisma.user.findUnique(...)); // Multiple queries
```

### Component Rendering
```tsx
// ✅ GOOD: Memoized component
const MetricCard = memo(({ value, label }) => (
  <div>{value} - {label}</div>
));

// ❌ BAD: Renders on every parent update
const Metric = ({ value, label }) => (
  <div>{value} - {label}</div>
);
```

### Animations
```css
/* ✅ GOOD: GPU-accelerated */
transform: translateY(-2px);
transition: all 200ms ease;

/* ❌ BAD: Repaints on every frame */
top: -2px;
transition: top 200ms ease;
```

---

## Testing Checklist

- [ ] Signup form validates inputs
- [ ] Password strength updates in real-time
- [ ] Login works with valid credentials
- [ ] Invitation link works
- [ ] Expired invitation shows error
- [ ] Invalid token shows error
- [ ] Password matching validation
- [ ] Form disabled during submission
- [ ] Success messages display
- [ ] Redirects after success
- [ ] Database state updated correctly
- [ ] Sessions created properly
- [ ] Error messages are helpful

---

## Resources

- **Prisma Docs**: https://www.prisma.io/docs/
- **Better Auth**: https://www.betterauth.dev/
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind**: https://tailwindcss.com

---

**Last Updated:** July 28, 2026
**Version:** 1.0
**Maintainer:** v0 AI Assistant
