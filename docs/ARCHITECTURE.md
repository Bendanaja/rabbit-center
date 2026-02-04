# RabbitAI Backend Architecture Document

## Version: 1.0.0
## Date: 2026-02-04
## Status: Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Database Schema Design](#3-database-schema-design)
4. [Authentication System](#4-authentication-system)
5. [API Architecture](#5-api-architecture)
6. [Real-time Features](#6-real-time-features)
7. [AI Integration](#7-ai-integration)
8. [Security Architecture](#8-security-architecture)
9. [Scalability & Performance](#9-scalability--performance)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Current State
RabbitAI is a Next.js 16 AI chat platform with:
- **Frontend**: Complete UI (React 19, Framer Motion, Tailwind CSS)
- **State Management**: Zustand with localStorage persistence (mock data)
- **Backend**: None - requires full implementation
- **Database**: Supabase self-hosted available at `http://supabase-supabase-9830e4-72-61-112-117.traefik.me`

### 1.2 Goals
- Implement production-ready authentication (email/password + OAuth)
- Design scalable database schema for chat, users, and billing
- Build secure API routes with proper validation
- Enable real-time chat with Supabase Realtime
- Integrate multiple AI providers (OpenAI, Anthropic, Google, etc.)
- Implement subscription management and usage tracking

### 1.3 Tech Stack
```
Frontend:        Next.js 16, React 19, TypeScript, Zustand
Backend:         Next.js API Routes (App Router)
Database:        Supabase PostgreSQL (self-hosted)
Auth:            Supabase Auth (GoTrue)
Real-time:       Supabase Realtime (WebSocket)
AI Providers:    OpenAI, Anthropic, Google AI, Mistral, Meta
Payments:        Stripe (cards), PromptPay (Thai QR)
Caching:         Supabase (built-in), optional Redis
```

---

## 2. System Architecture Overview

### 2.1 High-Level System Diagram

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
|  +------------------------------------------------------------+  |
|  |                    Next.js Frontend                         |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  |  |   Auth   |  |   Chat   |  | Settings |  | Payment  |    |  |
|  |  |   Pages  |  |   Pages  |  |   Pages  |  |   Pages  |    |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  |                      |                                      |  |
|  |              +---------------+                              |  |
|  |              | Zustand Store |                              |  |
|  |              | (Client State)|                              |  |
|  |              +---------------+                              |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              | HTTPS / WSS
                              v
+------------------------------------------------------------------+
|                          API LAYER                                |
|  +------------------------------------------------------------+  |
|  |                  Next.js API Routes                         |  |
|  |                                                             |  |
|  |  /api/auth/*        Authentication endpoints                |  |
|  |  /api/chat/*        Chat & message operations               |  |
|  |  /api/ai/*          AI model interactions                   |  |
|  |  /api/user/*        User profile & settings                 |  |
|  |  /api/billing/*     Subscription & payments                 |  |
|  |  /api/webhooks/*    External service webhooks               |  |
|  |                                                             |  |
|  |  +------------------+  +------------------+                 |  |
|  |  |   Middleware     |  |   Rate Limiter   |                 |  |
|  |  | (Auth, Validate) |  | (Token Bucket)   |                 |  |
|  |  +------------------+  +------------------+                 |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
           +------------------+------------------+
           |                  |                  |
           v                  v                  v
+------------------+  +------------------+  +------------------+
|    SUPABASE      |  |   AI PROVIDERS   |  |     STRIPE       |
|                  |  |                  |  |                  |
| +------------+   |  | +------------+   |  | +------------+   |
| | PostgreSQL |   |  | |  OpenAI    |   |  | |  Payments  |   |
| +------------+   |  | +------------+   |  | +------------+   |
| +------------+   |  | +------------+   |  | +------------+   |
| |  GoTrue    |   |  | | Anthropic  |   |  | |  Webhooks  |   |
| |   (Auth)   |   |  | +------------+   |  | +------------+   |
| +------------+   |  | +------------+   |  +------------------+
| +------------+   |  | | Google AI  |   |
| |  Realtime  |   |  | +------------+   |
| | (WebSocket)|   |  | +------------+   |
| +------------+   |  | |  Mistral   |   |
| +------------+   |  | +------------+   |
| |  Storage   |   |  +------------------+
| +------------+   |
+------------------+
```

### 2.2 Data Flow Diagram

```
User Action                API Route               Database/Service
-----------                ---------               ----------------

[Login Request] --------> /api/auth/login -------> Supabase Auth
                               |                        |
                               v                        v
                         [Validate] <------------- [Session Token]
                               |
                               v
                         [Set Cookie] ---------> Browser Storage


[Send Message] ---------> /api/chat/send -------> messages table
                               |                        |
                               v                        v
                         [Stream to AI] --------> OpenAI/Claude
                               |                        |
                               v                        v
                         [SSE Response] <-------- AI Response
                               |
                               v
                         [Save Message] --------> messages table
                               |
                               v
                         [Broadcast] -----------> Supabase Realtime
```

---

## 3. Database Schema Design

### 3.1 Entity Relationship Diagram (ERD)

```
+-------------------+       +-------------------+       +-------------------+
|      users        |       |   user_profiles   |       |   user_settings   |
+-------------------+       +-------------------+       +-------------------+
| id (PK, UUID)     |<----->| user_id (PK, FK)  |<----->| user_id (PK, FK)  |
| email             |       | display_name      |       | theme             |
| encrypted_password|       | avatar_url        |       | language          |
| email_confirmed_at|       | bio               |       | notifications     |
| phone             |       | created_at        |       | model_preference  |
| phone_confirmed_at|       | updated_at        |       | created_at        |
| created_at        |       +-------------------+       | updated_at        |
| updated_at        |                                   +-------------------+
| last_sign_in_at   |
| raw_app_meta_data |
| raw_user_meta_data|
+-------------------+
        |
        | 1:N
        v
+-------------------+       +-------------------+
|      chats        |       |     messages      |
+-------------------+       +-------------------+
| id (PK, UUID)     |<------| id (PK, UUID)     |
| user_id (FK)      |       | chat_id (FK)      |
| title             |       | role (enum)       |
| model_id          |       | content           |
| is_archived       |       | model_id          |
| is_pinned         |       | tokens_used       |
| created_at        |       | response_time_ms  |
| updated_at        |       | is_error          |
+-------------------+       | error_message     |
        ^                   | created_at        |
        |                   +-------------------+
        |
+-------------------+       +-------------------+
|   subscriptions   |       |   usage_records   |
+-------------------+       +-------------------+
| id (PK, UUID)     |       | id (PK, UUID)     |
| user_id (FK)      |------>| user_id (FK)      |
| plan_id           |       | subscription_id   |
| stripe_customer_id|       | model_id          |
| stripe_sub_id     |       | tokens_input      |
| status            |       | tokens_output     |
| current_period_end|       | cost_usd          |
| cancel_at_period  |       | date              |
| created_at        |       | created_at        |
| updated_at        |       +-------------------+
+-------------------+
        |
        v
+-------------------+       +-------------------+
|   payment_history |       |     api_keys      |
+-------------------+       +-------------------+
| id (PK, UUID)     |       | id (PK, UUID)     |
| user_id (FK)      |       | user_id (FK)      |
| subscription_id   |       | name              |
| amount            |       | key_hash          |
| currency          |       | key_prefix        |
| payment_method    |       | last_used_at      |
| status            |       | expires_at        |
| stripe_payment_id |       | is_active         |
| created_at        |       | created_at        |
+-------------------+       +-------------------+
```

### 3.2 Complete SQL Schema

```sql
-- =====================================================
-- RABBITAI DATABASE SCHEMA
-- Supabase PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('card', 'promptpay', 'bank_transfer');

-- =====================================================
-- USER PROFILES (extends auth.users)
-- =====================================================

CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER SETTINGS
-- =====================================================

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'th',
    notifications_email BOOLEAN DEFAULT true,
    notifications_product_updates BOOLEAN DEFAULT true,
    notifications_usage_alerts BOOLEAN DEFAULT true,
    notifications_promotions BOOLEAN DEFAULT false,
    model_preference VARCHAR(50) DEFAULT 'gpt-3.5',
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHATS
-- =====================================================

CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    model_id VARCHAR(50) NOT NULL DEFAULT 'gpt-3.5',
    system_prompt TEXT,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_user_updated ON public.chats(user_id, updated_at DESC);
CREATE INDEX idx_chats_user_archived ON public.chats(user_id, is_archived);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    model_id VARCHAR(50),
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    is_error BOOLEAN DEFAULT false,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_chat_created ON public.messages(chat_id, created_at ASC);

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- =====================================================
-- USAGE RECORDS (Daily aggregates)
-- =====================================================

CREATE TABLE public.usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    model_id VARCHAR(50) NOT NULL,
    message_count INTEGER DEFAULT 0,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, model_id)
);

CREATE INDEX idx_usage_user_date ON public.usage_records(user_id, date DESC);
CREATE INDEX idx_usage_user_model ON public.usage_records(user_id, model_id);

-- =====================================================
-- PAYMENT HISTORY
-- =====================================================

CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_method payment_method_type NOT NULL,
    status payment_status DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payments_status ON public.payment_history(status);
CREATE INDEX idx_payments_created ON public.payment_history(created_at DESC);

-- =====================================================
-- API KEYS (for Enterprise users)
-- =====================================================

CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash
    key_prefix VARCHAR(12) NOT NULL, -- First 12 chars for display
    scopes TEXT[] DEFAULT ARRAY['chat:read', 'chat:write'],
    rate_limit_per_minute INTEGER DEFAULT 60,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;

-- =====================================================
-- AI MODELS CONFIGURATION
-- =====================================================

CREATE TABLE public.ai_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    tier VARCHAR(20) DEFAULT 'pro' CHECK (tier IN ('free', 'pro', 'enterprise')),
    input_cost_per_1k DECIMAL(10, 6),  -- Cost per 1000 tokens
    output_cost_per_1k DECIMAL(10, 6),
    max_tokens INTEGER DEFAULT 4096,
    supports_streaming BOOLEAN DEFAULT true,
    supports_vision BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed AI models
INSERT INTO public.ai_models (id, name, provider, description, tier, input_cost_per_1k, output_cost_per_1k, max_tokens) VALUES
('gpt-4', 'GPT-4', 'OpenAI', 'Most powerful model for complex tasks', 'pro', 0.03, 0.06, 8192),
('gpt-3.5', 'GPT-3.5 Turbo', 'OpenAI', 'Fast and efficient for general tasks', 'free', 0.0005, 0.0015, 4096),
('claude-3-opus', 'Claude 3 Opus', 'Anthropic', 'Best for nuanced, thoughtful responses', 'pro', 0.015, 0.075, 4096),
('claude-2', 'Claude 2', 'Anthropic', 'Reliable AI assistant', 'pro', 0.008, 0.024, 100000),
('gemini-pro', 'Gemini Pro', 'Google', 'Advanced model from Google', 'pro', 0.00025, 0.0005, 32768),
('mistral-large', 'Mistral Large', 'Mistral', 'European AI with strong reasoning', 'pro', 0.008, 0.024, 32768),
('llama-3-70b', 'Llama 3 70B', 'Meta', 'Powerful open-source model', 'pro', 0.0007, 0.0009, 8192);

-- =====================================================
-- PRICING PLANS
-- =====================================================

CREATE TABLE public.pricing_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'THB',
    description TEXT,
    features JSONB DEFAULT '[]',
    limitations JSONB DEFAULT '{}',
    daily_message_limit INTEGER,  -- NULL = unlimited
    models_allowed TEXT[],
    chat_history_days INTEGER,    -- NULL = unlimited
    has_api_access BOOLEAN DEFAULT false,
    max_team_members INTEGER DEFAULT 1,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pricing plans
INSERT INTO public.pricing_plans (id, name, price_monthly, description, daily_message_limit, models_allowed, chat_history_days, display_order) VALUES
('free', 'Free', 0, 'Perfect for trying out', 50, ARRAY['gpt-3.5'], 7, 1),
('pro', 'Pro', 299, 'For serious users', NULL, ARRAY['gpt-4', 'gpt-3.5', 'claude-3-opus', 'claude-2', 'gemini-pro', 'mistral-large', 'llama-3-70b'], NULL, 2),
('enterprise', 'Enterprise', 1499, 'For teams and businesses', NULL, ARRAY['gpt-4', 'gpt-3.5', 'claude-3-opus', 'claude-2', 'gemini-pro', 'mistral-large', 'llama-3-70b'], NULL, 3);

UPDATE public.pricing_plans SET has_api_access = true, max_team_members = 10 WHERE id = 'enterprise';

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_records_updated_at BEFORE UPDATE ON public.usage_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile and settings on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update chat message count and last_message_at
CREATE OR REPLACE FUNCTION update_chat_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_message_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User Settings: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Chats: Users can only access their own chats
CREATE POLICY "Users can view own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
    FOR DELETE USING (auth.uid() = user_id);

-- Messages: Users can access messages in their chats
CREATE POLICY "Users can view messages in own chats" ON public.messages
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

-- Subscriptions: Users can only view their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage Records: Users can only view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_records
    FOR SELECT USING (auth.uid() = user_id);

-- Payment History: Users can only view their own payments
CREATE POLICY "Users can view own payments" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- API Keys: Users can manage their own API keys
CREATE POLICY "Users can view own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Public read access for models and plans
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active models" ON public.ai_models
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active plans" ON public.pricing_plans
    FOR SELECT USING (is_active = true);

-- =====================================================
-- VIEWS
-- =====================================================

-- User dashboard view
CREATE VIEW public.user_dashboard AS
SELECT
    u.id as user_id,
    up.display_name,
    up.avatar_url,
    s.plan_id,
    s.status as subscription_status,
    s.current_period_end,
    pp.name as plan_name,
    pp.daily_message_limit,
    COALESCE(
        (SELECT SUM(message_count) FROM public.usage_records
         WHERE user_id = u.id AND date = CURRENT_DATE),
        0
    ) as messages_today,
    (SELECT COUNT(*) FROM public.chats WHERE user_id = u.id AND is_archived = false) as active_chats
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.pricing_plans pp ON s.plan_id = pp.id;
```

---

## 4. Authentication System

### 4.1 Authentication Flow Diagram

```
+--------------------+     +--------------------+     +--------------------+
|   Email/Password   |     |   OAuth Provider   |     |   Magic Link       |
|      Login         |     |  (Google/GitHub)   |     |     (Optional)     |
+--------------------+     +--------------------+     +--------------------+
         |                          |                          |
         v                          v                          v
+------------------------------------------------------------------------+
|                         SUPABASE AUTH (GoTrue)                          |
|                                                                         |
|  +------------------+  +------------------+  +------------------+       |
|  | Email Validation |  | OAuth Exchange   |  | Token Generation |       |
|  +------------------+  +------------------+  +------------------+       |
|                                                                         |
+------------------------------------------------------------------------+
                                    |
                                    v
                    +-------------------------------+
                    |      JWT Access Token         |
                    |   (stored in httpOnly cookie) |
                    +-------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
        +-------------------+           +-------------------+
        |  Refresh Token    |           |   Session Data    |
        | (Secure Storage)  |           | (Supabase RLS)    |
        +-------------------+           +-------------------+
```

### 4.2 API Routes Structure

```
/api/auth/
    ├── signup/
    │   └── route.ts          POST - Create new account
    ├── login/
    │   └── route.ts          POST - Email/password login
    ├── logout/
    │   └── route.ts          POST - End session
    ├── callback/
    │   └── route.ts          GET  - OAuth callback handler
    ├── refresh/
    │   └── route.ts          POST - Refresh access token
    ├── reset-password/
    │   └── route.ts          POST - Request password reset
    ├── update-password/
    │   └── route.ts          PUT  - Set new password
    ├── verify-email/
    │   └── route.ts          POST - Verify email address
    └── me/
        └── route.ts          GET  - Get current user
```

### 4.3 OAuth Configuration

```typescript
// OAuth Providers Configuration
const oauthProviders = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: ['email', 'profile'],
    redirectUrl: '/api/auth/callback?provider=google'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    scopes: ['user:email'],
    redirectUrl: '/api/auth/callback?provider=github'
  }
};
```

### 4.4 Session Management

```typescript
// Session configuration
const sessionConfig = {
  // JWT expires in 1 hour
  accessTokenLifetime: 3600,

  // Refresh token expires in 30 days
  refreshTokenLifetime: 2592000,

  // Cookie settings
  cookie: {
    name: 'sb-access-token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000 // 30 days
  }
};
```

### 4.5 Two-Factor Authentication (2FA) - Optional

```
+------------------+     +------------------+     +------------------+
|  User enables    |---->|  Generate TOTP   |---->|  Show QR Code    |
|      2FA         |     |     Secret       |     |  to Scan         |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   Login with     |<----|   Verify TOTP    |<----|  User enters     |
|   2FA required   |     |      Code        |     |   6-digit code   |
+------------------+     +------------------+     +------------------+
```

---

## 5. API Architecture

### 5.1 Complete API Endpoints

```
/api/
├── auth/                           # Authentication
│   ├── signup                      POST   - Register new user
│   ├── login                       POST   - Login with credentials
│   ├── logout                      POST   - End session
│   ├── callback                    GET    - OAuth callback
│   ├── refresh                     POST   - Refresh token
│   ├── reset-password              POST   - Request reset
│   ├── update-password             PUT    - Set new password
│   ├── verify-email                POST   - Verify email
│   └── me                          GET    - Current user info
│
├── chat/                           # Chat operations
│   ├── route.ts                    GET    - List all chats
│   │                               POST   - Create new chat
│   ├── [chatId]/
│   │   ├── route.ts                GET    - Get chat details
│   │   │                           PATCH  - Update chat
│   │   │                           DELETE - Delete chat
│   │   └── messages/
│   │       └── route.ts            GET    - List messages
│   │                               POST   - Send message (SSE stream)
│   └── search/
│       └── route.ts                GET    - Search chats
│
├── ai/                             # AI model operations
│   ├── models/
│   │   └── route.ts                GET    - List available models
│   ├── complete/
│   │   └── route.ts                POST   - Non-streaming completion
│   └── stream/
│       └── route.ts                POST   - Streaming completion (SSE)
│
├── user/                           # User management
│   ├── profile/
│   │   └── route.ts                GET    - Get profile
│   │                               PATCH  - Update profile
│   ├── settings/
│   │   └── route.ts                GET    - Get settings
│   │                               PATCH  - Update settings
│   ├── avatar/
│   │   └── route.ts                POST   - Upload avatar
│   │                               DELETE - Remove avatar
│   └── usage/
│       └── route.ts                GET    - Get usage stats
│
├── billing/                        # Subscription & payments
│   ├── subscription/
│   │   └── route.ts                GET    - Current subscription
│   │                               POST   - Create subscription
│   │                               DELETE - Cancel subscription
│   ├── plans/
│   │   └── route.ts                GET    - List available plans
│   ├── checkout/
│   │   └── route.ts                POST   - Create checkout session
│   ├── portal/
│   │   └── route.ts                POST   - Stripe customer portal
│   └── history/
│       └── route.ts                GET    - Payment history
│
├── api-keys/                       # API key management (Enterprise)
│   ├── route.ts                    GET    - List API keys
│   │                               POST   - Create new key
│   └── [keyId]/
│       └── route.ts                DELETE - Revoke key
│                                   PATCH  - Update key
│
└── webhooks/                       # External webhooks
    ├── stripe/
    │   └── route.ts                POST   - Stripe webhook handler
    └── supabase/
        └── route.ts                POST   - Supabase webhook handler
```

### 5.2 Request/Response Formats

#### Standard Success Response
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

#### Standard Error Response
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

#### Common HTTP Status Codes
```
200 OK              - Successful request
201 Created         - Resource created
204 No Content      - Successful deletion
400 Bad Request     - Invalid input
401 Unauthorized    - Authentication required
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource not found
409 Conflict        - Resource conflict (duplicate)
422 Unprocessable   - Validation failed
429 Too Many Req    - Rate limit exceeded
500 Server Error    - Internal error
```

### 5.3 Middleware Stack

```typescript
// Middleware execution order
const middlewareStack = [
  'cors',           // CORS headers
  'rateLimit',      // Rate limiting
  'authenticate',   // Auth verification
  'authorize',      // Permission check
  'validate',       // Input validation
  'handler',        // Route handler
  'errorHandler'    // Error formatting
];
```

### 5.4 Rate Limiting Strategy

```typescript
// Rate limits by plan
const rateLimits = {
  free: {
    requests: 50,      // per window
    window: 60,        // seconds
    messages: 50,      // per day
    aiRequests: 50     // per day
  },
  pro: {
    requests: 200,
    window: 60,
    messages: null,    // unlimited
    aiRequests: null   // unlimited
  },
  enterprise: {
    requests: 1000,
    window: 60,
    messages: null,
    aiRequests: null
  },
  apiKey: {
    requests: 60,      // per minute (configurable)
    window: 60
  }
};
```

---

## 6. Real-time Features

### 6.1 Supabase Realtime Channels

```typescript
// Channel structure
const realtimeChannels = {
  // User's personal channel for notifications
  user: `user:${userId}`,

  // Chat-specific channel for message updates
  chat: `chat:${chatId}`,

  // Presence channel for online status
  presence: 'online-users'
};
```

### 6.2 Real-time Events

```
+-------------------+     +-------------------+     +-------------------+
|   Client Action   |     |  Supabase Event   |     | Broadcast Target  |
+-------------------+     +-------------------+     +-------------------+
| Send Message      |---->| INSERT messages   |---->| chat:${chatId}    |
| Update Chat Title |---->| UPDATE chats      |---->| user:${userId}    |
| Delete Chat       |---->| DELETE chats      |---->| user:${userId}    |
| Subscription Change|--->| UPDATE subs       |---->| user:${userId}    |
+-------------------+     +-------------------+     +-------------------+
```

### 6.3 Client Subscription Example

```typescript
// Subscribe to chat messages
const subscribeToChat = (chatId: string) => {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        // Handle new message
        handleNewMessage(payload.new);
      }
    )
    .subscribe();
};
```

---

## 7. AI Integration

### 7.1 AI Provider Architecture

```
+-------------------------------------------------------------------+
|                      AI INTEGRATION LAYER                          |
+-------------------------------------------------------------------+
|                                                                    |
|  +--------------------+     +--------------------+                 |
|  |   Provider Router  |     |   Response Parser  |                 |
|  | (Select by model)  |     |  (Normalize output)|                 |
|  +--------------------+     +--------------------+                 |
|            |                          ^                            |
|            v                          |                            |
|  +--------------------------------------------------------+       |
|  |                   Provider Adapters                     |       |
|  |                                                         |       |
|  |  +----------+  +----------+  +----------+  +----------+ |       |
|  |  |  OpenAI  |  | Anthropic|  |  Google  |  | Mistral  | |       |
|  |  | Adapter  |  |  Adapter |  |  Adapter |  | Adapter  | |       |
|  |  +----------+  +----------+  +----------+  +----------+ |       |
|  |                                                         |       |
|  +--------------------------------------------------------+       |
|                                                                    |
+-------------------------------------------------------------------+
```

### 7.2 Provider Configuration

```typescript
const aiProviders = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-2'],
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2024-01-01',
      'Content-Type': 'application/json'
    })
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-pro'],
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json'
    })
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest'],
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};
```

### 7.3 Streaming Response Flow

```
Client Request          Server Processing          AI Provider
--------------          -----------------          -----------

POST /api/ai/stream
     |
     v
[Validate Request]
     |
     v
[Check Usage Limits]
     |
     v
[Select Provider] --------------------------------> [API Call]
     |                                                  |
     |                                                  v
     |                                            [Stream Start]
     |                                                  |
     v                                                  v
[SSE Connection] <--------------------------- [Token Chunk 1]
     |                                                  |
     v                                                  v
[Send to Client] <--------------------------- [Token Chunk 2]
     |                                                  |
     v                                                  v
[Send to Client] <--------------------------- [Token Chunk N]
     |                                                  |
     v                                                  v
[Close Stream] <----------------------------- [Stream End]
     |
     v
[Save to Database]
     |
     v
[Update Usage]
```

### 7.4 SSE Implementation

```typescript
// Server-Sent Events streaming
async function streamCompletion(
  req: Request,
  model: string,
  messages: Message[]
): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await callAIProvider(model, messages);

        for await (const chunk of aiStream) {
          const data = JSON.stringify({
            id: crypto.randomUUID(),
            object: 'chat.completion.chunk',
            model,
            choices: [{
              index: 0,
              delta: { content: chunk },
              finish_reason: null
            }]
          });

          controller.enqueue(
            encoder.encode(`data: ${data}\n\n`)
          );
        }

        controller.enqueue(
          encoder.encode('data: [DONE]\n\n')
        );
        controller.close();

      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

## 8. Security Architecture

### 8.1 Security Layers

```
+-------------------------------------------------------------------+
|                        SECURITY LAYERS                             |
+-------------------------------------------------------------------+
|                                                                    |
|  Layer 1: Network Security                                         |
|  +------------------------------------------------------------+   |
|  | - HTTPS enforcement (TLS 1.3)                               |   |
|  | - CORS policy (allowed origins only)                        |   |
|  | - DDoS protection (Cloudflare/Vercel)                       |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Layer 2: Authentication                                           |
|  +------------------------------------------------------------+   |
|  | - JWT verification (RS256)                                  |   |
|  | - Session management (httpOnly cookies)                     |   |
|  | - OAuth 2.0 with PKCE                                       |   |
|  | - Optional 2FA (TOTP)                                       |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Layer 3: Authorization                                            |
|  +------------------------------------------------------------+   |
|  | - Row Level Security (RLS) in PostgreSQL                    |   |
|  | - Role-based access control (RBAC)                          |   |
|  | - Resource ownership verification                           |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Layer 4: Input Validation                                         |
|  +------------------------------------------------------------+   |
|  | - Schema validation (Zod)                                   |   |
|  | - SQL injection prevention (parameterized queries)          |   |
|  | - XSS prevention (output encoding)                          |   |
|  | - Content Security Policy (CSP)                             |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Layer 5: Rate Limiting                                            |
|  +------------------------------------------------------------+   |
|  | - Request rate limiting (token bucket)                      |   |
|  | - Usage quotas (daily/monthly limits)                       |   |
|  | - API key rate limits                                       |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Layer 6: Data Protection                                          |
|  +------------------------------------------------------------+   |
|  | - Encryption at rest (AES-256)                              |   |
|  | - Encryption in transit (TLS)                               |   |
|  | - Sensitive data hashing (bcrypt, SHA-256)                  |   |
|  | - PII handling compliance                                   |   |
|  +------------------------------------------------------------+   |
|                                                                    |
+-------------------------------------------------------------------+
```

### 8.2 CORS Configuration

```typescript
const corsConfig = {
  // Allowed origins
  origin: [
    'https://rabbitai.example.com',
    'https://www.rabbitai.example.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean),

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key'
  ],

  // Expose headers
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],

  // Allow credentials
  credentials: true,

  // Cache preflight
  maxAge: 86400 // 24 hours
};
```

### 8.3 Input Validation Schemas

```typescript
import { z } from 'zod';

// Authentication schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  name: z.string().min(2).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Chat schemas
export const createChatSchema = z.object({
  title: z.string().max(255).optional(),
  modelId: z.string().max(50).optional(),
  systemPrompt: z.string().max(10000).optional()
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(100000),
  modelId: z.string().max(50).optional()
});

// Settings schemas
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional()
});

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().max(10).optional(),
  notificationsEmail: z.boolean().optional(),
  notificationsProductUpdates: z.boolean().optional(),
  notificationsUsageAlerts: z.boolean().optional(),
  notificationsPromotions: z.boolean().optional(),
  modelPreference: z.string().max(50).optional(),
  soundEnabled: z.boolean().optional()
});
```

### 8.4 Security Headers

```typescript
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com wss:",
    "frame-ancestors 'none'"
  ].join('; '),

  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

### 8.5 API Key Security

```typescript
// API key generation and hashing
import { randomBytes, createHash } from 'crypto';

function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Generate 32 random bytes = 256 bits of entropy
  const keyBytes = randomBytes(32);
  const key = `sk-rabbit-${keyBytes.toString('base64url')}`;

  // Hash the key for storage
  const hash = createHash('sha256').update(key).digest('hex');

  // Keep prefix for display
  const prefix = key.substring(0, 12);

  return { key, hash, prefix };
}

function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = createHash('sha256').update(providedKey).digest('hex');
  return providedHash === storedHash;
}
```

---

## 9. Scalability & Performance

### 9.1 Caching Strategy

```
+-------------------------------------------------------------------+
|                       CACHING LAYERS                               |
+-------------------------------------------------------------------+
|                                                                    |
|  Browser Cache (Client)                                            |
|  +------------------------------------------------------------+   |
|  | - Static assets (images, fonts): 1 year                     |   |
|  | - API responses: Cache-Control headers                      |   |
|  | - Service Worker: Offline support                           |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  CDN Cache (Vercel Edge)                                           |
|  +------------------------------------------------------------+   |
|  | - Static pages: ISR with revalidation                       |   |
|  | - API routes: Stale-while-revalidate                        |   |
|  | - Assets: Immutable cache                                   |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Application Cache (Optional Redis)                                |
|  +------------------------------------------------------------+   |
|  | - User sessions: 30 minutes                                 |   |
|  | - Rate limit counters: 1 minute                             |   |
|  | - AI model configs: 1 hour                                  |   |
|  | - Usage stats: 5 minutes                                    |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  Database Cache (Supabase)                                         |
|  +------------------------------------------------------------+   |
|  | - Query results: Automatic                                  |   |
|  | - Materialized views: Manual refresh                        |   |
|  +------------------------------------------------------------+   |
|                                                                    |
+-------------------------------------------------------------------+
```

### 9.2 Database Optimization

```sql
-- Partial indexes for common queries
CREATE INDEX idx_chats_active ON public.chats(user_id, updated_at DESC)
WHERE is_archived = false;

CREATE INDEX idx_messages_recent ON public.messages(chat_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '30 days';

-- Materialized view for dashboard stats (refresh periodically)
CREATE MATERIALIZED VIEW public.user_stats AS
SELECT
    u.id as user_id,
    COUNT(DISTINCT c.id) as total_chats,
    COUNT(DISTINCT m.id) as total_messages,
    SUM(m.tokens_input + m.tokens_output) as total_tokens,
    MAX(m.created_at) as last_activity
FROM auth.users u
LEFT JOIN public.chats c ON u.id = c.user_id
LEFT JOIN public.messages m ON c.id = m.chat_id
GROUP BY u.id;

CREATE UNIQUE INDEX idx_user_stats_user ON public.user_stats(user_id);

-- Refresh function (call via cron job)
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
END;
$$ LANGUAGE plpgsql;
```

### 9.3 Connection Pooling

```typescript
// Supabase client configuration
const supabaseConfig = {
  // Connection pooler for serverless
  url: process.env.SUPABASE_URL,

  // Use pgBouncer for connection pooling
  db: {
    schema: 'public',
    pool: {
      min: 2,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    }
  }
};
```

### 9.4 Horizontal Scaling Architecture

```
                         Load Balancer
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        +---------+     +---------+     +---------+
        | Next.js |     | Next.js |     | Next.js |
        | Server 1|     | Server 2|     | Server N|
        +---------+     +---------+     +---------+
              |               |               |
              +---------------+---------------+
                              |
                    Supabase Connection Pool
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        +---------+     +---------+     +---------+
        | Primary |     | Replica |     | Replica |
        |   DB    |---->|   DB 1  |---->|   DB N  |
        +---------+     +---------+     +---------+
```

### 9.5 Performance Monitoring

```typescript
// Key metrics to track
const performanceMetrics = {
  // API latency
  apiLatencyP50: 'target: < 100ms',
  apiLatencyP95: 'target: < 500ms',
  apiLatencyP99: 'target: < 1s',

  // AI response time
  aiFirstToken: 'target: < 500ms',
  aiTotalTime: 'target: < 30s',

  // Database
  dbQueryTime: 'target: < 50ms',
  dbConnectionPool: 'target: < 80% utilization',

  // Error rates
  errorRate: 'target: < 0.1%',

  // Throughput
  requestsPerSecond: 'baseline: 100 RPS',
  concurrentUsers: 'baseline: 1000'
};
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Foundation (Week 1-2)

```
+-------------------------------------------------------------------+
| PHASE 1: FOUNDATION                                                |
+-------------------------------------------------------------------+
| Priority: Critical                                                 |
| Duration: 2 weeks                                                  |
+-------------------------------------------------------------------+
|                                                                    |
| 1.1 Project Setup                                                  |
|     [ ] Install Supabase client packages                           |
|     [ ] Configure environment variables                            |
|     [ ] Set up TypeScript types for database                       |
|     [ ] Create API route structure                                 |
|                                                                    |
| 1.2 Database Setup                                                 |
|     [ ] Run schema migration on Supabase                           |
|     [ ] Enable Row Level Security                                  |
|     [ ] Seed initial data (models, plans)                          |
|     [ ] Test RLS policies                                          |
|                                                                    |
| 1.3 Authentication                                                 |
|     [ ] Implement email/password signup                            |
|     [ ] Implement login/logout                                     |
|     [ ] Configure OAuth (Google, GitHub)                           |
|     [ ] Set up session management                                  |
|     [ ] Create auth middleware                                     |
|                                                                    |
| 1.4 Core Utilities                                                 |
|     [ ] Create API response helpers                                |
|     [ ] Set up input validation (Zod)                              |
|     [ ] Implement error handling                                   |
|     [ ] Create database query helpers                              |
|                                                                    |
+-------------------------------------------------------------------+
```

### 10.2 Phase 2: Chat System (Week 3-4)

```
+-------------------------------------------------------------------+
| PHASE 2: CHAT SYSTEM                                               |
+-------------------------------------------------------------------+
| Priority: Critical                                                 |
| Duration: 2 weeks                                                  |
+-------------------------------------------------------------------+
|                                                                    |
| 2.1 Chat CRUD                                                      |
|     [ ] Create chat endpoint                                       |
|     [ ] List chats with pagination                                 |
|     [ ] Update chat (title, settings)                              |
|     [ ] Delete chat                                                |
|     [ ] Archive/unarchive chat                                     |
|                                                                    |
| 2.2 Message System                                                 |
|     [ ] Send message endpoint                                      |
|     [ ] List messages with pagination                              |
|     [ ] Message search                                             |
|                                                                    |
| 2.3 AI Integration                                                 |
|     [ ] Create provider adapters                                   |
|     [ ] Implement streaming responses                              |
|     [ ] Token counting                                             |
|     [ ] Error handling for AI failures                             |
|                                                                    |
| 2.4 Real-time                                                      |
|     [ ] Set up Supabase Realtime                                   |
|     [ ] Message broadcast                                          |
|     [ ] Client subscription hooks                                  |
|                                                                    |
| 2.5 Frontend Integration                                           |
|     [ ] Replace mock data with API calls                           |
|     [ ] Update Zustand store                                       |
|     [ ] Implement optimistic updates                               |
|                                                                    |
+-------------------------------------------------------------------+
```

### 10.3 Phase 3: User & Settings (Week 5)

```
+-------------------------------------------------------------------+
| PHASE 3: USER & SETTINGS                                           |
+-------------------------------------------------------------------+
| Priority: High                                                     |
| Duration: 1 week                                                   |
+-------------------------------------------------------------------+
|                                                                    |
| 3.1 User Profile                                                   |
|     [ ] Get profile endpoint                                       |
|     [ ] Update profile endpoint                                    |
|     [ ] Avatar upload (Supabase Storage)                           |
|                                                                    |
| 3.2 User Settings                                                  |
|     [ ] Get settings endpoint                                      |
|     [ ] Update settings endpoint                                   |
|     [ ] Theme persistence                                          |
|                                                                    |
| 3.3 Usage Tracking                                                 |
|     [ ] Record usage on AI calls                                   |
|     [ ] Get usage stats endpoint                                   |
|     [ ] Usage limits enforcement                                   |
|                                                                    |
+-------------------------------------------------------------------+
```

### 10.4 Phase 4: Billing System (Week 6-7)

```
+-------------------------------------------------------------------+
| PHASE 4: BILLING SYSTEM                                            |
+-------------------------------------------------------------------+
| Priority: High                                                     |
| Duration: 2 weeks                                                  |
+-------------------------------------------------------------------+
|                                                                    |
| 4.1 Stripe Integration                                             |
|     [ ] Set up Stripe account                                      |
|     [ ] Create products/prices                                     |
|     [ ] Implement checkout session                                 |
|     [ ] Set up webhooks                                            |
|                                                                    |
| 4.2 Subscription Management                                        |
|     [ ] Create subscription                                        |
|     [ ] Cancel subscription                                        |
|     [ ] Change plan                                                |
|     [ ] Handle subscription events                                 |
|                                                                    |
| 4.3 Thai Payment Methods                                           |
|     [ ] PromptPay integration (Stripe)                             |
|     [ ] Bank transfer instructions                                 |
|                                                                    |
| 4.4 Payment History                                                |
|     [ ] List payments endpoint                                     |
|     [ ] Invoice generation                                         |
|                                                                    |
+-------------------------------------------------------------------+
```

### 10.5 Phase 5: Security & Polish (Week 8)

```
+-------------------------------------------------------------------+
| PHASE 5: SECURITY & POLISH                                         |
+-------------------------------------------------------------------+
| Priority: High                                                     |
| Duration: 1 week                                                   |
+-------------------------------------------------------------------+
|                                                                    |
| 5.1 Security Hardening                                             |
|     [ ] Rate limiting implementation                               |
|     [ ] Security headers                                           |
|     [ ] Input sanitization audit                                   |
|     [ ] RLS policy review                                          |
|                                                                    |
| 5.2 Error Handling                                                 |
|     [ ] Comprehensive error codes                                  |
|     [ ] User-friendly error messages                               |
|     [ ] Error logging/monitoring                                   |
|                                                                    |
| 5.3 Testing                                                        |
|     [ ] Unit tests for API routes                                  |
|     [ ] Integration tests                                          |
|     [ ] Load testing                                               |
|                                                                    |
| 5.4 Documentation                                                  |
|     [ ] API documentation                                          |
|     [ ] Environment setup guide                                    |
|     [ ] Deployment guide                                           |
|                                                                    |
+-------------------------------------------------------------------+
```

### 10.6 Phase 6: Advanced Features (Week 9+)

```
+-------------------------------------------------------------------+
| PHASE 6: ADVANCED FEATURES (Optional)                              |
+-------------------------------------------------------------------+
| Priority: Medium                                                   |
| Duration: Ongoing                                                  |
+-------------------------------------------------------------------+
|                                                                    |
| 6.1 Enterprise Features                                            |
|     [ ] API key management                                         |
|     [ ] Team/organization support                                  |
|     [ ] Admin dashboard                                            |
|     [ ] SSO integration                                            |
|                                                                    |
| 6.2 Advanced Chat Features                                         |
|     [ ] Chat export (PDF, Markdown)                                |
|     [ ] Chat sharing                                               |
|     [ ] Custom system prompts                                      |
|     [ ] File attachments                                           |
|                                                                    |
| 6.3 AI Enhancements                                                |
|     [ ] Model fine-tuning support                                  |
|     [ ] RAG integration                                            |
|     [ ] Multi-modal support (images)                               |
|                                                                    |
| 6.4 Analytics                                                      |
|     [ ] Usage analytics dashboard                                  |
|     [ ] Cost tracking                                              |
|     [ ] Performance metrics                                        |
|                                                                    |
+-------------------------------------------------------------------+
```

---

## Appendix A: Environment Variables

```bash
# =====================================================
# RABBITAI ENVIRONMENT VARIABLES
# =====================================================

# Application
NEXT_PUBLIC_APP_URL=https://rabbitai.example.com
NEXT_PUBLIC_APP_NAME=RabbitAI

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://supabase-supabase-9830e4-72-61-112-117.traefik.me
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
MISTRAL_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars

# Rate Limiting (Optional Redis)
REDIS_URL=redis://localhost:6379

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...
```

---

## Appendix B: File Structure

```
rabbit_center/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── callback/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   ├── update-password/route.ts
│   │   │   │   ├── verify-email/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── chat/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [chatId]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── messages/route.ts
│   │   │   │   └── search/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── models/route.ts
│   │   │   │   ├── complete/route.ts
│   │   │   │   └── stream/route.ts
│   │   │   ├── user/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── settings/route.ts
│   │   │   │   ├── avatar/route.ts
│   │   │   │   └── usage/route.ts
│   │   │   ├── billing/
│   │   │   │   ├── subscription/route.ts
│   │   │   │   ├── plans/route.ts
│   │   │   │   ├── checkout/route.ts
│   │   │   │   ├── portal/route.ts
│   │   │   │   └── history/route.ts
│   │   │   ├── api-keys/
│   │   │   │   ├── route.ts
│   │   │   │   └── [keyId]/route.ts
│   │   │   └── webhooks/
│   │   │       ├── stripe/route.ts
│   │   │       └── supabase/route.ts
│   │   ├── (pages)/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── settings/
│   │   │   ├── pricing/
│   │   │   └── payment/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client
│   │   │   ├── middleware.ts      # Auth middleware
│   │   │   └── types.ts           # Database types
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── google.ts
│   │   │   │   └── mistral.ts
│   │   │   ├── router.ts          # Provider router
│   │   │   └── types.ts           # AI types
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   ├── validation/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   └── user.ts
│   │   ├── api/
│   │   │   ├── response.ts        # Response helpers
│   │   │   ├── errors.ts          # Error codes
│   │   │   └── middleware.ts      # API middleware
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── sounds.ts
│   ├── store/
│   │   ├── chatStore.ts
│   │   ├── authStore.ts
│   │   └── settingsStore.ts
│   └── types/
│       ├── database.ts            # Generated from Supabase
│       ├── api.ts
│       └── ai.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── docs/
│   └── ARCHITECTURE.md            # This document
├── .env.local
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Appendix C: Quick Reference

### API Authentication Header
```
Authorization: Bearer <access_token>
```

### API Key Header (Enterprise)
```
X-API-Key: sk-rabbit-xxxxxxxxxxxx
```

### Common Error Codes
```
AUTH_INVALID_CREDENTIALS   - Wrong email/password
AUTH_SESSION_EXPIRED       - Token expired
AUTH_UNAUTHORIZED          - Not logged in
RESOURCE_NOT_FOUND         - Chat/message not found
VALIDATION_ERROR           - Invalid input
RATE_LIMIT_EXCEEDED        - Too many requests
USAGE_LIMIT_EXCEEDED       - Daily limit reached
SUBSCRIPTION_REQUIRED      - Pro/Enterprise needed
AI_PROVIDER_ERROR          - AI API failed
PAYMENT_FAILED             - Payment declined
```

### Key Database Queries
```sql
-- Get user's chats
SELECT * FROM chats WHERE user_id = $1 ORDER BY updated_at DESC;

-- Get chat messages
SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC;

-- Check daily usage
SELECT SUM(message_count) FROM usage_records
WHERE user_id = $1 AND date = CURRENT_DATE;

-- Get user subscription with plan
SELECT s.*, p.* FROM subscriptions s
JOIN pricing_plans p ON s.plan_id = p.id
WHERE s.user_id = $1;
```

---

**Document End**

*This architecture document serves as the blueprint for implementing the RabbitAI backend. Follow the implementation roadmap phases in order, starting with Phase 1 Foundation.*
