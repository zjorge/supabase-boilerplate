# Setup Guide

This guide walks you through setting up the Supabase + Next.js boilerplate for local development and production deployment.

## Prerequisites

- Node.js 18+ and pnpm
- Supabase account (for production)
- Supabase CLI (for local development)
- Google/GitHub OAuth apps (for authentication)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase Locally (Optional)

If you want to develop entirely locally:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

**For Local Development:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Set Up OAuth Providers

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Local: `http://localhost:54321/auth/v1/callback`
   - Production: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase Dashboard → Authentication → Providers

#### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - Local: `http://localhost:54321/auth/v1/callback`
   - Production: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Dashboard → Authentication → Providers

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Production Deployment

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create new project
3. Wait for database to be ready
4. Note your project URL and anon key

### 2. Apply Database Migrations

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Or manually run the SQL files in the Supabase SQL Editor:
1. `migrations/001_initial_schema.sql`
2. `migrations/002_rls_policies.sql`
3. `migrations/003_triggers_and_functions.sql`

### 3. Configure OAuth Providers

Follow the OAuth setup steps above, but use production URLs.

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel:
1. Import project in Vercel Dashboard
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Deploy

### 5. Update OAuth Redirect URLs

After deployment, update your OAuth apps with the production URLs:
- Google: Add `https://your-app.vercel.app` to authorized origins
- GitHub: Update callback URL if needed

## Database Management

### Generate TypeScript Types

After schema changes:

```bash
pnpm db:types
```

### Create New Migration

```bash
supabase migration new migration_name
```

Edit the generated file in `supabase/migrations/`, then:

```bash
supabase db push
```

### Reset Database (Local)

```bash
supabase db reset
```

## Testing RLS Policies

You can test RLS policies in the Supabase SQL Editor:

```sql
-- Impersonate a user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Test queries
SELECT * FROM organizations;
SELECT * FROM projects;
```

## Troubleshooting

### OAuth Not Working

- Verify redirect URLs match exactly (including http/https)
- Check that OAuth providers are enabled in Supabase Dashboard
- Ensure Client ID and Secret are correct

### RLS Blocking Queries

- Check that user has proper membership records
- Verify JWT is being passed correctly
- Test policies in SQL Editor with SET request.jwt.claims

### Type Errors

- Run `pnpm db:types` to regenerate types
- Ensure `@supabase/supabase-js` version matches your Supabase project

## Next Steps

1. Customize the schema for your use case
2. Add more domain entities (similar to `projects`)
3. Implement additional features (invitations, billing, etc.)
4. Add tests for RLS policies
5. Set up CI/CD pipeline

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
