# Authentication System - Quick Start Guide

## New Pages Available

### 1. Sign Up Page
**URL:** `/signup`

Features:
- Email-based self-registration
- Real-time password strength indicator
- Modern, intuitive form
- Link to login page for existing users
- Automatic redirect to dashboard after signup

### 2. Invite Acceptance Page
**URL:** `/invite/[token]`

Features:
- Accept team invitations
- Create account with invited email pre-filled
- Shows who invited you and your role
- Automatic login after acceptance
- Handles expired/invalid invitations gracefully

### 3. Enhanced Login Page
**URL:** `/login`

Features:
- New prominent "Create account now" link
- Optional workspace setup for admins
- Remember me functionality
- Existing Better Auth integration

## API Usage Examples

### Sending an Invitation

```javascript
// From your team management page
const sendInvitation = async (email, role = 'MEMBER') => {
  const response = await fetch('/api/invitations/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('Invitation sent:', data);
    // Send the invitation link via email to: /invite/[token]
  }
};
```

### Verifying an Invitation Token

```javascript
// Called when user visits /invite/[token]
const verifyInvitation = async (token) => {
  const response = await fetch('/api/invitations/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  return response.json();
};
```

### Accepting an Invitation

```javascript
// After form submission on /invite/[token]
const acceptInvitation = async (token, name, password) => {
  const response = await fetch('/api/invitations/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name, password })
  });
  
  return response.json();
};
```

## Database Queries

### Find Pending Invitations

```typescript
const pendingInvites = await prisma.invitation.findMany({
  where: {
    status: 'PENDING',
    expiresAt: { gt: new Date() }
  },
  include: { inviter: { select: { name: true, email: true } } }
});
```

### Get User's Invitation History

```typescript
const userInvitations = await prisma.invitation.findMany({
  where: { invitedBy: userId },
  orderBy: { createdAt: 'desc' }
});
```

### Cancel a Pending Invitation

```typescript
await prisma.invitation.update({
  where: { id: invitationId },
  data: { status: 'CANCELLED' }
});
```

## Password Requirements

- **Minimum Length:** 12 characters
- **Strength Levels:**
  - 0-1: Very Weak / Weak (🔴)
  - 2: Fair (🟠)
  - 3: Good (🟢)
  - 4: Very Good (🟢)
  - 5: Excellent (🟢🟢)

**Strength is based on:**
- Length (12+ chars = +1, 16+ chars = +1)
- Uppercase letters (+1)
- Numbers (+1)
- Special characters (+1)

## Security Features

✅ Secure token generation (crypto.randomBytes)
✅ 7-day invitation expiration
✅ Email uniqueness validation
✅ Password strength requirements
✅ Rate limiting on failed attempts
✅ Status tracking to prevent token reuse
✅ User role assignment per invitation
✅ Automatic session creation on signup

## Common Tasks

### Create a Signup Button

```tsx
import Link from 'next/link';

export function SignupCTA() {
  return (
    <Link href="/signup" className="primary-button">
      Get Started Free
    </Link>
  );
}
```

### Add Team Member Management Page

```tsx
'use client';

import { useState } from 'react';

export function InviteTeamMember() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');

  const handleInvite = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });

    if (response.ok) {
      alert('Invitation sent!');
      setEmail('');
    } else {
      alert('Failed to send invitation');
    }
  };

  return (
    <form onSubmit={handleInvite}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="team@example.com"
        required
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button type="submit">Invite Team Member</button>
    </form>
  );
}
```

### Redirect Based on User Status

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function ProtectedRoute({ children }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending) return <div>Loading...</div>;
  if (!session) return null;

  return children;
}
```

## Styling Customization

### Change Primary Color

Edit `/src/app/globals.css`:
```css
:root {
  --green-600: #your-color-hex;
  --green-500: #lighter-shade;
  --green-700: #darker-shade;
}
```

### Customize Form Fields

Modify `.form-field` class in globals.css:
```css
.form-field {
  /* Your custom styles */
}
```

### Change Animation Speed

Find transitions in globals.css and modify:
```css
/* Before */
transition: all 200ms ease;

/* After */
transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Troubleshooting

### Invitation token not working
1. Check if token matches database record
2. Verify invitation status is "PENDING"
3. Check if expiration date has passed
4. Ensure token wasn't already accepted

### Password strength not updating
1. Clear browser cache
2. Check if JavaScript is enabled
3. Verify password input value is updating
4. Check console for errors

### Email not being sent
1. Email service integration not implemented yet
2. See "Email Integration" section in AUTH_IMPLEMENTATION.md
3. Add Resend, SendGrid, or similar service

### Database migration failed
1. Ensure PostgreSQL connection is valid
2. Check if tables already exist (migration idempotent)
3. Review migration logs: `npx prisma migrate dev`
4. Run `npx prisma db push` to sync schema

## Next Steps

1. ✅ Setup environment variables
2. ✅ Run database migration
3. ✅ Test signup and login flow
4. ⏭️ Integrate email service for invitations
5. ⏭️ Build team management dashboard
6. ⏭️ Add user role permissions system
7. ⏭️ Implement OAuth for social login
8. ⏭️ Add two-factor authentication

