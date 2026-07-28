# Authentication Flow Diagrams

## 1. Public Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  USER VISITS: /signup                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Page Loads                                              │
│     └─> Signup form displayed                               │
│     └─> Password strength indicator active                  │
│                                                             │
│  2. User Fills Form                                         │
│     └─> Name input                                          │
│     └─> Email input                                         │
│     └─> Password input (shows strength)                     │
│     └─> Confirm password (shows match icon)                 │
│     └─> Terms checkbox                                      │
│                                                             │
│  3. User Submits Form                                       │
│     └─> Client-side validation                              │
│         • Name required                                      │
│         • Password >= 12 chars                               │
│         • Passwords match                                    │
│         • Terms accepted                                     │
│     └─> Show loading state                                  │
│                                                             │
│  4. POST /api/auth/sign-up/email                            │
│     ├─> Server receives request                             │
│     ├─> Validate inputs                                     │
│     ├─> Hash password with bcrypt                           │
│     ├─> Create user in database                             │
│     ├─> Create session                                      │
│     └─> Return success                                      │
│                                                             │
│  5. Success State                                           │
│     ├─> Show success message                                │
│     ├─> 1.5 second delay                                    │
│     └─> Redirect to /                                       │
│     └─> User logged in automatically                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Error Cases:
├─> Email format invalid → "Invalid email address"
├─> Email already exists → "Email already in use"
├─> Password too weak → "Password must be at least 12 characters"
├─> Passwords don't match → "Password confirmation does not match"
├─> Terms not accepted → "You must agree to terms"
└─> Server error → "Signup failed. Please try again."
```

## 2. Invitation Acceptance Flow

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ADMIN SENDS INVITATION                                    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Admin navigates to Team Management                     │
│  2. Fills: Email + Role (MEMBER/ADMIN)                    │
│  3. Click "Send Invitation"                                │
│                                                            │
│  4. POST /api/invitations/send                             │
│     ├─> Check admin is authenticated                       │
│     ├─> Validate email format                              │
│     ├─> Check user doesn't already exist                   │
│     ├─> Check no pending invitation exists                 │
│     ├─> Generate secure token                              │
│     ├─> Set expiration to +7 days                          │
│     ├─> Save invitation to database                        │
│     ├─> TODO: Send email with link:                        │
│     │   https://amrhub.com/invite/[TOKEN]                 │
│     └─> Return success                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                                                            │
│  USER RECEIVES INVITATION (via email)                      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. User clicks link: /invite/[TOKEN]                      │
│                                                            │
│  2. Page Loads - Verification Phase                        │
│     └─> POST /api/invitations/verify                       │
│         ├─> Find invitation by token                       │
│         ├─> Check status = PENDING                         │
│         ├─> Check not expired                              │
│         ├─> Return invitation details                      │
│         └─> Include inviter name & role                    │
│                                                            │
│  3. Verification Results:                                  │
│     ├─> VALID: Show acceptance form                        │
│     │   ├─> Display inviter & role                         │
│     │   ├─> Pre-filled: email                              │
│     │   ├─> Form: name, password fields                    │
│     │   └─> Password strength indicator                    │
│     │                                                       │
│     └─> INVALID: Show error                                │
│         ├─> "Invitation not found"                         │
│         ├─> "Invitation expired"                           │
│         ├─> "Already accepted"                             │
│         └─> Link back to login                             │
│                                                            │
│  4. User Fills Form                                        │
│     └─> Name input                                         │
│     └─> Password input with strength meter                 │
│     └─> Confirm password                                   │
│                                                            │
│  5. User Submits                                           │
│     └─> Client-side validation (same as signup)            │
│                                                            │
│  6. POST /api/invitations/accept                           │
│     ├─> Verify token & invitation valid                    │
│     ├─> Call signup endpoint internally                    │
│     │   ├─> Hash password                                  │
│     │   ├─> Create user                                    │
│     │   └─> Create session                                 │
│     ├─> Update invitation status → ACCEPTED                │
│     ├─> Return success message                             │
│     └─> User automatically logged in                       │
│                                                            │
│  7. Success State                                          │
│     ├─> Show "Welcome to the team!"                        │
│     ├─> 1.5 second delay                                   │
│     ├─> Redirect to dashboard /                            │
│     └─> User is authenticated team member                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

Invitation Status Lifecycle:
PENDING (awaiting user) → ACCEPTED (used) → END
     ↓
  EXPIRED (7 days)
```

## 3. Login Flow (Enhanced)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  USER VISITS: /login                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Page displays:                                            │
│  ├─> Email field                                           │
│  ├─> Password field with toggle                            │
│  ├─> Remember me checkbox                                  │
│  ├─> "Sign in" button                                      │
│  ├─> NEW: "Create account now" link → /signup             │
│  └─> Optional: "Set up workspace" → /setup                │
│                                                            │
│  User Flow:                                                │
│  1. Enter email & password                                 │
│  2. Click "Continue"                                       │
│  3. POST via authClient.signIn.email()                     │
│     ├─> Verify credentials                                │
│     ├─> Rate limit check                                  │
│     ├─> Create session                                    │
│     └─> Return session                                    │
│  4. Success: Redirect to /                                │
│  5. Error: Show message                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 4. Database Schema Relationships

```
User
├─ id (PRIMARY KEY)
├─ name
├─ email (UNIQUE)
├─ emailVerified
├─ image
├─ role
├─ createdAt
├─ updatedAt
├─ relationships:
│  ├─ sessions: Session[]
│  ├─ accounts: Account[]
│  ├─ comments: Comment[]
│  ├─ activity: Activity[]
│  ├─ savedViews: SavedView[]
│  └─ invitations: Invitation[] ← NEW
│
└─ Connection to:
   └─ Invitation.invitedBy → User.id


Invitation (NEW MODEL)
├─ id (PRIMARY KEY)
├─ email (UNIQUE per status/inviter combo)
├─ token (UNIQUE)
├─ role (MEMBER/ADMIN)
├─ status (PENDING/ACCEPTED/CANCELLED)
├─ expiresAt
├─ createdAt
├─ updatedAt
├─ invitedBy (FOREIGN KEY) → User.id
├─ inviter: User (relation)
│
└─ Indexes:
   ├─ email (for searching)
   ├─ token (for quick lookup)
   └─ status (for filtering)
```

## 5. API Endpoint Request/Response Examples

### POST /api/invitations/verify

**Request:**
```json
{
  "token": "a7f3c9e2b1d4f6g8h0j2k4m6n8p0q2r4s6t8u0v2"
}
```

**Response (Success - 200):**
```json
{
  "email": "newteam@example.com",
  "role": "MEMBER",
  "invitedBy": "John Doe"
}
```

**Response (Invalid - 404):**
```json
{
  "message": "Invitation not found."
}
```

**Response (Expired - 400):**
```json
{
  "message": "This invitation has expired."
}
```

---

### POST /api/invitations/accept

**Request:**
```json
{
  "token": "a7f3c9e2b1d4f6g8h0j2k4m6n8p0q2r4s6t8u0v2",
  "name": "Jane Smith",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200):**
```json
{
  "message": "Account created successfully. You are now signed in."
}
```

**Response (Invalid - 400):**
```json
{
  "message": "This invitation has already been used."
}
```

---

### POST /api/invitations/send

**Request (Authenticated):**
```json
{
  "email": "newmember@example.com",
  "role": "MEMBER"
}
```

**Response (Success - 200):**
```json
{
  "message": "Invitation sent successfully.",
  "invitation": {
    "id": "cuid123",
    "email": "newmember@example.com",
    "token": "a7f3c9e2b1d4f6g8h0j2k4m6n8p0q2r4s6t8u0v2",
    "role": "MEMBER",
    "status": "PENDING",
    "expiresAt": "2026-08-04T14:55:07.895Z"
  }
}
```

**Response (User already exists - 400):**
```json
{
  "message": "This user already has an account."
}
```

## 6. State Transitions

```
SIGNUP FLOW:
User inputs form → Validation → API call → Create user + session → Redirect

INVITE FLOW:
Link clicked → Verify token → Get invitation details → Show form → 
User inputs → Validation → Create account → Update invitation status → 
Auto login → Redirect

LOGIN FLOW:
Credentials entered → Validation → API call → Verify → Create session → Redirect
```

## 7. Security Flow

```
Password Creation:
User Input
    ↓
Client-side validation (12+ chars)
    ↓
Strength evaluation (5 levels)
    ↓
Server receives request
    ↓
Server-side validation
    ↓
Rate limiting check
    ↓
Bcrypt hashing (rounds: 10-12)
    ↓
Stored in database (never plain text)

Token Generation:
Admin action → Generate token
    ↓
crypto.randomBytes(32).toString('hex')
    ↓
Store in database with:
    ├─ Email
    ├─ Role
    ├─ Status: PENDING
    ├─ ExpiresAt: now + 7 days
    └─ Inviter ID

Token Verification:
User has token → Look up in database
    ↓
Check status = PENDING
    ↓
Check expiration date
    ↓
Return invitation details or error
```

---

**Note:** All flows support error handling with user-friendly messages and maintain security best practices throughout.
