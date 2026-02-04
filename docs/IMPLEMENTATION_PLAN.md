# 🐰 RabbitAI - Implementation Plan (Revised)

## Version: 2.0.0
## Date: 2026-02-04
## Status: Ready for Implementation

---

## 📋 Plan Overview

### Key Decisions
| Item | Decision | Reason |
|------|----------|--------|
| **Payments** | Mockup Only | ทำ UI ไว้ก่อน ไม่ต้อง Stripe จริง |
| **AI Provider** | OpenRouter | API เดียวเข้าถึงทุก model (OpenAI, Claude, Gemini, Llama) |
| **Auth** | Supabase Auth | Built-in, รองรับ OAuth, ทำงานกับ RLS |
| **Database** | Supabase PostgreSQL | Self-hosted ที่ deploy ไว้แล้ว |
| **Real-time** | Supabase Broadcast | สำหรับ chat updates |

---

## 🎯 Core Features

### 1. Authentication System
- ✅ Email/Password login
- ✅ Email/Password signup
- ✅ OAuth (Google, GitHub)
- ✅ Session management (cookie-based)
- ✅ Protected routes
- ✅ Auto-create user profile on signup

### 2. User Management
- ✅ User profiles (name, avatar)
- ✅ User settings (theme, language, model preference)
- ✅ Subscription tier (free/pro/enterprise) - **Mockup**
- ✅ Usage tracking (message count per day)

### 3. Chat System (Per-User Isolation)
- ✅ Each user has their own chats (RLS enforced)
- ✅ Create/rename/delete chats
- ✅ Chat history with messages
- ✅ Model selection per chat
- ✅ Real-time message updates
- ✅ Message streaming from AI

### 4. AI Integration (OpenRouter)
- ✅ Single API key for all models
- ✅ Streaming responses (SSE)
- ✅ Model selection (GPT-4, Claude, Gemini, Llama, Mistral)
- ✅ Error handling & retry
- ✅ Token counting (optional)

### 5. Pricing/Payment (Mockup)
- ✅ Pricing page UI (existing)
- ✅ Plan comparison table (existing)
- ✅ Checkout flow UI (existing)
- ⏸️ Real payment processing (LATER)
- ⏸️ Stripe webhooks (LATER)

---

## 🗄️ Database Schema

### Tables

```sql
-- 1. user_profiles (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  message_count_today INTEGER DEFAULT 0,
  message_reset_date DATE DEFAULT CURRENT_DATE,
  preferred_model TEXT DEFAULT 'openai/gpt-3.5-turbo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'th',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'แชทใหม่',
  model_id TEXT NOT NULL DEFAULT 'openai/gpt-3.5-turbo',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chats_user_id ON public.chats(user_id, updated_at DESC);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id, created_at ASC);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
```

### Row Level Security (RLS) - Critical for User Isolation

```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- chats policies (CRITICAL: User isolation)
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- messages policies (CRITICAL: Access only through owned chats)
CREATE POLICY "Users can view messages from own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

### Auto-create Profile on Signup

```sql
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Daily Message Count Reset

```sql
-- Function to reset daily message count
CREATE OR REPLACE FUNCTION public.reset_daily_message_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    message_count_today = 0,
    message_reset_date = CURRENT_DATE
  WHERE message_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Reset if new day
  UPDATE public.user_profiles
  SET
    message_count_today = 0,
    message_reset_date = CURRENT_DATE
  WHERE id = user_uuid AND message_reset_date < CURRENT_DATE;

  -- Increment and return new count
  UPDATE public.user_profiles
  SET
    message_count_today = message_count_today + 1,
    updated_at = NOW()
  WHERE id = user_uuid
  RETURNING message_count_today INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🤖 OpenRouter Integration

### Why OpenRouter?
- **Single API Key** - เข้าถึงทุก model ด้วย key เดียว
- **Unified API** - OpenAI-compatible format
- **Cost Tracking** - Dashboard แสดงค่าใช้จ่าย
- **Fallback** - Auto-fallback ถ้า model ไม่ว่าง
- **All Models** - GPT-4, Claude, Gemini, Llama, Mistral, etc.

### Environment Variable
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### Available Models (OpenRouter IDs)
```typescript
export const OPENROUTER_MODELS = {
  // OpenAI
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',

  // Anthropic
  'claude-3-opus': 'anthropic/claude-3-opus',
  'claude-3-sonnet': 'anthropic/claude-3-sonnet',
  'claude-3-haiku': 'anthropic/claude-3-haiku',

  // Google
  'gemini-pro': 'google/gemini-pro',
  'gemini-pro-1.5': 'google/gemini-pro-1.5',

  // Meta
  'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
  'llama-3-8b': 'meta-llama/llama-3-8b-instruct',

  // Mistral
  'mistral-large': 'mistralai/mistral-large',
  'mistral-medium': 'mistralai/mistral-medium',

  // Free models (for free tier)
  'llama-3-8b-free': 'meta-llama/llama-3-8b-instruct:free',
  'gemma-7b-free': 'google/gemma-7b-it:free',
} as const;
```

### API Integration Code

```typescript
// lib/openrouter.ts
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function streamChat(
  messages: { role: string; content: string }[],
  model: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'RabbitAI',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error as Error);
  }
}
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Landing)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── (protected)/
│   │   ├── layout.tsx (Auth check)
│   │   ├── chat/page.tsx
│   │   ├── settings/page.tsx
│   │   └── pricing/page.tsx
│   └── api/
│       ├── auth/
│       │   └── callback/route.ts
│       ├── chat/
│       │   ├── route.ts (List/Create chats)
│       │   └── [chatId]/
│       │       ├── route.ts (Get/Update/Delete chat)
│       │       └── messages/route.ts (Get messages)
│       └── ai/
│           └── generate/route.ts (Streaming AI)
│
├── components/
│   ├── providers/
│   │   ├── SupabaseProvider.tsx
│   │   └── AuthProvider.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx (Modified)
│   │   ├── ChatInput.tsx (Modified)
│   │   ├── ChatHistory.tsx (Modified)
│   │   └── MessageBubble.tsx
│   └── auth/
│       └── ProtectedRoute.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── useChats.ts
│   ├── useChat.ts
│   └── useAI.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── openrouter.ts
│   └── constants.ts (Modified - add OpenRouter models)
│
├── store/
│   ├── chatStore.ts (Modified - UI state only)
│   └── authStore.ts (New)
│
├── types/
│   ├── database.ts
│   └── index.ts
│
└── middleware.ts
```

---

## 🔄 Implementation Phases

### Phase 1: Database Setup (2-3 hours) ⭐ START HERE
- [ ] Run SQL migration on Supabase
- [ ] Test RLS policies work correctly
- [ ] Verify auto-create profile trigger
- [ ] Test message count functions

### Phase 2: Supabase Client Setup (2-3 hours)
- [ ] Install `@supabase/ssr` `@supabase/supabase-js`
- [ ] Create `lib/supabase/client.ts`
- [ ] Create `lib/supabase/server.ts`
- [ ] Create `lib/supabase/admin.ts`
- [ ] Create `middleware.ts`
- [ ] Add environment variables

### Phase 3: Authentication (4-6 hours)
- [ ] Create `hooks/useAuth.ts`
- [ ] Create `hooks/useUser.ts`
- [ ] Modify `/auth/login/page.tsx` for real auth
- [ ] Modify `/auth/signup/page.tsx` for real signup
- [ ] Create `/api/auth/callback/route.ts`
- [ ] Test email/password auth
- [ ] Test OAuth (Google, GitHub)
- [ ] Test protected routes

### Phase 4: Chat Backend (6-8 hours)
- [ ] Create `hooks/useChats.ts` (list, create, delete)
- [ ] Create `hooks/useChat.ts` (messages)
- [ ] Create `/api/chat/route.ts`
- [ ] Create `/api/chat/[chatId]/route.ts`
- [ ] Create `/api/chat/[chatId]/messages/route.ts`
- [ ] Test CRUD operations
- [ ] Verify user isolation (RLS)

### Phase 5: AI Integration with OpenRouter (4-6 hours)
- [ ] Create `lib/openrouter.ts`
- [ ] Create `/api/ai/generate/route.ts` (streaming)
- [ ] Create `hooks/useAI.ts`
- [ ] Update model constants
- [ ] Test streaming with different models
- [ ] Implement usage limit check

### Phase 6: Connect UI to Real Data (4-6 hours)
- [ ] Modify `ChatWindow` to use `useChat` hook
- [ ] Modify `ChatHistory` to use `useChats` hook
- [ ] Modify `ChatInput` to use real AI API
- [ ] Update `chatStore.ts` to UI state only
- [ ] Handle loading/error states
- [ ] Test full flow

### Phase 7: Testing & Bug Fixes (4-6 hours)
- [ ] Test user signup flow
- [ ] Test chat creation (verify user owns it)
- [ ] Test message sending (verify stored correctly)
- [ ] Test AI response streaming
- [ ] Test switching between chats
- [ ] Test deleting chats
- [ ] Test logout/login (data persists)
- [ ] Test multiple users (isolation)

---

## ⏱️ Total Estimated Time

| Phase | Hours | Priority |
|-------|-------|----------|
| 1. Database Setup | 2-3 | P0 |
| 2. Supabase Client | 2-3 | P0 |
| 3. Authentication | 4-6 | P0 |
| 4. Chat Backend | 6-8 | P0 |
| 5. OpenRouter AI | 4-6 | P0 |
| 6. Connect UI | 4-6 | P0 |
| 7. Testing | 4-6 | P0 |
| **Total** | **26-38 hours** | - |

**Timeline: ~3-5 working days**

---

## 🔧 Environment Variables

```bash
# .env.local

# Supabase (Self-hosted)
NEXT_PUBLIC_SUPABASE_URL=http://supabase-supabase-9830e4-72-61-112-117.traefik.me
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzAyMTkwNTcsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.hQgDzJ9Yor8WrappVocSEZc0GtLEyZQZ7Q1weqzGz7k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzAyMTkwNTcsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.i3paiHrsTpfmoPz6r8ZUXLK7LDuRB_NiHmDZsTUi7gI

# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔒 Security Checklist

- [x] RLS policies on all tables
- [x] User can only access their own data
- [x] Messages only accessible through owned chats
- [x] Auto-create profile on signup (no orphan data)
- [x] Server-side session validation
- [x] Protected routes via middleware
- [ ] Rate limiting on AI endpoint
- [ ] Input validation/sanitization
- [ ] Error messages don't expose internals

---

## 📝 Notes

### Payment System (Mockup)
- Pricing page UI already exists ✅
- Payment page UI already exists ✅
- Just show "Plan upgraded!" toast on click
- Real Stripe integration can be added later

### Free Tier Limits
- 50 messages per day
- Access to free models only (Llama 3 8B, Gemma)
- 7-day chat history

### Pro Tier (Mockup)
- Unlimited messages
- Access to all models
- Unlimited chat history

---

## ✅ Ready to Start?

1. **First**: Run SQL migration on Supabase
2. **Then**: Install dependencies
3. **Follow**: Phase-by-phase implementation

ต้องการให้เริ่มทำ Phase ไหน?
