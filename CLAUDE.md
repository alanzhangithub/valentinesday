# Auth Worktree

**Branch:** `feature/auth`
**Parent doc:** See `/home/alanzhang/valentinesday/CLAUDE.md` for project overview

## Your Mission

Implement the authentication system with triple protection:
1. Google OAuth
2. Email whitelist (only 2 emails allowed)
3. Secondary password gate

## Auth Flow

```
1. User visits any page
2. Not authenticated? → Redirect to Google OAuth
3. Google OAuth success → Check email against whitelist
4. Email NOT on whitelist → Rejection page ("This nation is closed to outsiders")
5. Email on whitelist → Password gate page
6. Wrong password → "Nice try" message, stay on page
7. Correct password → Create full session, enter site
```

## Key Files to Create/Modify

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts    # NextAuth config
│   ├── rejected/
│   │   └── page.tsx            # Funny rejection page
│   ├── password-gate/
│   │   └── page.tsx            # Password entry page
│   └── layout.tsx              # Auth wrapper
├── middleware.ts               # Route protection
├── lib/
│   └── auth.ts                 # Auth helpers
```

## Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_EMAIL_1=       # Meedo's email
ALLOWED_EMAIL_2=       # Beedo's email
SITE_PASSWORD_HASH=    # bcrypt hash of shared password
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## Copy Guidelines

**Rejection page** (for non-whitelisted users):
- "This nation is closed to outsiders"
- "You are not authorized to enter Meedobeedo"
- Include a sad Meedo/Beedo illustration
- Maybe a fake "apply for citizenship" button that does nothing

**Password gate** (for whitelisted users):
- "One more step to enter the nation..."
- "Enter the secret code"
- Wrong password: "Nice try, but that's not it"

## Remember

- Use NextAuth.js with Google provider
- Session should persist (30 days recommended)
- Password comparison should use bcrypt
- All routes must be protected except the auth/rejected pages
