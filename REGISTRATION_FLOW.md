# Updated Registration Flow

## New Multi-Step Registration Process

### Step 1: Account Information Form
- User enters: Full name, Email, Company name, Password
- Frontend validates form
- User agrees to Terms & Privacy
- On submit: Frontend calls `POST /api/auth/send-verification`
- Backend sends verification code via Resend email

### Step 2: Email Verification
- User receives 6-digit code via email
- User enters code in verification input component
- Frontend calls `POST /api/auth/verify-email` with email + code
- Backend verifies code and returns verification token
- User can resend code if needed

### Step 3: Payment/Subscription (Optional - Can Skip)
- Display payment options (can be skipped for now)
- User can start free trial without payment
- On continue: Frontend calls `POST /api/tenants` with verification token
- Backend creates tenant + owner user
- Backend triggers events (logs, welcome emails, etc.)

### Step 4: Complete & Auto-Login
- Frontend automatically logs in with credentials
- Redirects to `/app/dashboard`

## Backend Endpoints Needed

### 1. Send Verification Code
```
POST /api/auth/send-verification
Body: {
  email: string
  fullName: string
  companyName: string
}
Response: {
  message: string
  expiresIn?: number
}
```

**Implementation:**
- Generate 6-digit code
- Store code in Redis with email as key (expires in 10 minutes)
- Send email via Resend with verification code
- Return success message

### 2. Verify Email Code
```
POST /api/auth/verify-email
Body: {
  email: string
  code: string
}
Response: {
  verified: boolean
  token: string  // Temporary token for completing registration
}
```

**Implementation:**
- Check code in Redis
- If valid, generate temporary JWT token (expires in 30 minutes)
- Store token in Redis with email
- Return verification token
- Delete verification code from Redis

### 3. Complete Registration (Create Tenant)
```
POST /api/tenants
Headers: {
  Authorization: Bearer <verification_token>
}
Body: {
  name: string
  slug: string
  ownerEmail: string
  ownerPassword: string
}
```

**Implementation:**
- Verify verification token from header
- Create tenant (existing logic)
- Create owner user (existing logic)
- Trigger events:
  - Tenant created event
  - User created event
  - Send welcome email
  - Log registration
- Return tenant info

## Frontend Components

### 1. Multi-Step Form (`app/get-started/page.tsx`)
- Step indicator showing progress
- Form validation
- Step navigation
- Error handling

### 2. Verification Code Input (`components/auth/verification-code-input.tsx`)
- 6-digit code input with auto-focus
- Paste support
- Backspace navigation
- Error display

## Email Template (Resend)

### Verification Email
```
Subject: Verify your abLedger account

Hi {fullName},

Welcome to abLedger! Please verify your email address by entering this code:

{code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
The abLedger Team
```

## Security Considerations

1. **Code Expiration**: Verification codes expire after 10 minutes
2. **Rate Limiting**: Limit code requests per email (e.g., 3 per hour)
3. **Token Expiration**: Verification tokens expire after 30 minutes
4. **One-time Use**: Verification codes are deleted after successful verification
5. **Email Validation**: Verify email format before sending code

## Implementation Checklist

### Backend Tasks
- [ ] Install Resend SDK in auth-service
- [ ] Create email service module
- [ ] Implement `/auth/send-verification` endpoint
- [ ] Implement `/auth/verify-email` endpoint
- [ ] Update tenant creation to accept verification token
- [ ] Add Redis storage for verification codes
- [ ] Add rate limiting for code requests
- [ ] Create email templates
- [ ] Add event triggers (welcome email, logs)

### Frontend Tasks
- [x] Create multi-step registration form
- [x] Create verification code input component
- [x] Update API client with new endpoints
- [x] Add step navigation logic
- [x] Add error handling
- [ ] Add toast notifications (replace alerts)
- [ ] Add loading states
- [ ] Add payment step (optional, can skip for now)

## Environment Variables Needed

### Backend (auth-service)
```env
RESEND_API_KEY=re_xxxxx
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
VERIFICATION_CODE_EXPIRY=600  # 10 minutes in seconds
VERIFICATION_TOKEN_EXPIRY=1800  # 30 minutes in seconds
```

## Testing Flow

1. Fill registration form
2. Submit → Should receive email with code
3. Enter code → Should verify and get token
4. Skip payment → Should create tenant and login
5. Should redirect to dashboard

