# RabbitAI Backend Quick Start Guide

This guide will help you set up the backend infrastructure for RabbitAI.

## Prerequisites

- Node.js 18+
- Access to Supabase instance: `http://supabase-supabase-9830e4-72-61-112-117.traefik.me`
- API keys for AI providers (OpenAI, Anthropic, etc.)
- Stripe account for payments (optional for development)

## Step 1: Install Dependencies

```bash
# Install Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Install validation library
npm install zod

# Install AI SDKs
npm install openai @anthropic-ai/sdk @google/generative-ai

# Install Stripe (for payments)
npm install stripe @stripe/stripe-js
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your credentials in `.env.local`:
   - Supabase URL and keys
   - AI provider API keys
   - OAuth credentials (Google, GitHub)
   - Stripe keys (optional)

## Step 3: Run Database Migration

### Option A: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the SQL

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 4: Create API Routes

Create the following directory structure:

```
src/app/api/
├── auth/
│   ├── signup/route.ts
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── callback/route.ts
│   └── me/route.ts
├── chat/
│   ├── route.ts
│   └── [chatId]/
│       ├── route.ts
│       └── messages/route.ts
├── ai/
│   ├── models/route.ts
│   └── stream/route.ts
└── user/
    ├── profile/route.ts
    └── settings/route.ts
```

## Step 5: Set Up Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - cookies can only be modified in Server Actions or Route Handlers
          }
        },
      },
    }
  )
}
```

## Step 6: Verify Setup

1. Start the development server:
```bash
npm run dev
```

2. Test database connection by visiting:
   - `/api/ai/models` - Should return list of AI models
   - `/api/billing/plans` - Should return pricing plans

3. Test authentication:
   - Try signing up at `/auth/signup`
   - Check Supabase dashboard for new user

## Common Issues

### CORS Errors
Add your frontend URL to Supabase allowed origins in the dashboard.

### Authentication Not Working
- Verify your Supabase anon key is correct
- Check that RLS policies are enabled
- Ensure the auth callback URL is configured

### Database Queries Returning Empty
- Check that seed data was inserted
- Verify RLS policies allow the query
- Check user authentication status

## Next Steps

1. Implement all API routes following the architecture document
2. Update the Zustand stores to use API calls instead of localStorage
3. Add error handling and loading states
4. Set up Stripe webhooks for payment processing
5. Configure OAuth providers in Supabase dashboard

## Resources

- [Architecture Document](./ARCHITECTURE.md) - Full system design
- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Stripe Integration](https://stripe.com/docs)
