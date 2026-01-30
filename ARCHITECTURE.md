# Architecture Documentation

This document explains the architectural decisions and patterns used in this boilerplate.

## Table of Contents

- [Database Architecture](#database-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Frontend Architecture](#frontend-architecture)
- [Security Model](#security-model)
- [Data Flow](#data-flow)

## Database Architecture

### Schema Design Principles

1. **Explicit Ownership**: Every data entity is owned by an organization
2. **Membership-Based Access**: Access is determined by organization membership, not user identity alone
3. **Defensive Defaults**: Constraints, foreign keys, and checks are defined at the schema level
4. **Immutable Audit Trail**: Events table is append-only for compliance and debugging

### Core Tables

#### `organizations`
- Top-level ownership boundary
- Contains settings as JSONB for flexibility
- Slug must be unique and URL-safe

#### `users`
- Maps to Supabase Auth users (1:1 relationship)
- Stores profile information separate from auth metadata
- Created automatically via trigger when auth user is created

#### `memberships`
- Join table defining user roles within organizations
- Enforces unique constraint on (organization_id, user_id)
- Role enum: owner > admin > member > viewer
- Prevents last owner from leaving (via trigger)

#### `projects`
- Example domain entity demonstrating ownership pattern
- Status enum for lifecycle management
- Owner must be a member of the organization

#### `events`
- Append-only audit log
- Captures who did what, when, and where
- Metadata stored as JSONB for flexibility

### Indexes

Strategic indexes on:
- Foreign keys (for joins)
- Frequently queried columns (email, slug, status)
- Composite indexes for common query patterns

## Authentication & Authorization

### Authentication Flow

```
1. User clicks "Sign in with Google/GitHub"
2. Supabase Auth handles OAuth flow
3. On success, auth.users record is created
4. Trigger automatically creates users profile
5. JWT with user claims is issued
6. Client stores JWT in secure cookie
```

### Authorization Model

**Three-Layer Security:**

1. **JWT Validation**: Supabase validates JWT on every request
2. **RLS Policies**: PostgreSQL enforces row-level access control
3. **Application Logic**: Additional business rules in application code

**RLS Policy Pattern:**

```sql
-- Default deny
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Explicit allow based on membership
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (is_organization_member(organization_id));
```

### Helper Functions

- `auth.user_id()`: Extract user ID from JWT
- `is_organization_member(org_id)`: Check membership
- `get_user_role(org_id)`: Get user's role in organization
- `has_role_or_higher(org_id, min_role)`: Check minimum role requirement

## Frontend Architecture

### Next.js App Router

Using Next.js 14 App Router for:
- Server-side rendering (SSR)
- Server Components for data fetching
- Client Components only where needed
- Automatic code splitting

### Component Structure

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Landing page (Server Component)
├── login/              # Auth pages
├── dashboard/          # Protected routes
└── api/                # API routes

components/
├── auth/               # Authentication components
└── dashboard/          # Dashboard components
```

### Data Fetching Pattern

**Server Components (Preferred):**
```typescript
// Fetch data server-side
const supabase = await createClient();
const { data } = await supabase.from('table').select();
```

**Client Components (When Needed):**
```typescript
// For interactivity
'use client';
const supabase = createClient();
```

### State Management

- Server state: Fetched in Server Components
- Client state: React useState/useReducer
- No global state library needed for this boilerplate

## Security Model

### Defense in Depth

1. **Database Level**
   - RLS policies on all tables
   - Foreign key constraints
   - Check constraints
   - Trigger-based validation

2. **API Level**
   - JWT validation
   - Supabase Auth middleware
   - Rate limiting (via Supabase)

3. **Application Level**
   - Type safety with TypeScript
   - Input validation
   - Error boundaries

### RLS Policy Design

**Principles:**
- Default deny on all tables
- Explicit allow per operation (SELECT, INSERT, UPDATE, DELETE)
- Membership-based, not user-based
- Policies are readable and maintainable

**Example Policy Breakdown:**

```sql
-- Users can view organizations they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE organization_id = organizations.id
      AND user_id = auth.user_id()
    )
  );
```

This ensures:
- Only authenticated users can query
- Only organizations with active membership are visible
- No application-layer filtering needed

## Data Flow

### Read Operation

```
1. User requests /dashboard
2. Next.js Server Component renders
3. createClient() creates Supabase client with user's JWT
4. Query: SELECT * FROM organizations
5. PostgreSQL applies RLS policies using JWT claims
6. Only permitted rows returned
7. Server Component renders with data
8. HTML sent to client
```

### Write Operation

```
1. User submits form (Client Component)
2. Client calls Supabase client method
3. Request includes JWT in Authorization header
4. Supabase validates JWT
5. PostgreSQL applies RLS policies
6. If allowed, INSERT/UPDATE/DELETE executes
7. Triggers fire (e.g., audit logging)
8. Response returned to client
9. UI updates optimistically or on confirmation
```

### OAuth Flow

```
1. User clicks "Sign in with Google"
2. Redirect to Supabase Auth endpoint
3. Supabase redirects to Google OAuth
4. User authorizes
5. Google redirects back to Supabase
6. Supabase creates/updates auth.users record
7. Trigger creates users profile
8. Supabase redirects to /auth/callback
9. Callback exchanges code for session
10. Redirect to /dashboard
```

## Performance Considerations

### Database

- Indexes on foreign keys and frequently queried columns
- JSONB for flexible metadata (indexed with GIN when needed)
- Materialized views for complex aggregations (not in boilerplate, but recommended)

### Frontend

- Server Components reduce client-side JavaScript
- Automatic code splitting via Next.js
- Image optimization via next/image
- Static generation where possible

### Caching

- Supabase connection pooling
- Next.js automatic caching for Server Components
- CDN caching for static assets (Vercel)

## Scalability Patterns

### Horizontal Scaling

- Stateless application (scales easily)
- Supabase handles database connection pooling
- Vercel Edge Network for global distribution

### Vertical Scaling

- PostgreSQL can scale to large datasets
- Indexes ensure query performance
- Partitioning can be added for very large tables

### Multi-Tenancy

- Organization-based isolation
- RLS ensures data separation
- Each organization's data is logically isolated
- Can move to separate databases if needed

## Extension Points

### Adding New Entities

1. Create migration with table definition
2. Add RLS policies
3. Add to database.types.ts
4. Create UI components
5. Add to dashboard

### Adding New Roles

1. Update membership_role enum
2. Update has_role_or_higher function
3. Create new RLS policies
4. Update UI to show role-specific features

### Adding Webhooks

1. Create edge function in Supabase
2. Add database trigger to call function
3. Implement webhook delivery logic
4. Add retry mechanism

## Testing Strategy

### Database Tests

- Test RLS policies with different user contexts
- Verify constraints prevent invalid data
- Test triggers produce expected side effects

### Integration Tests

- Test auth flow end-to-end
- Verify data access patterns
- Test error handling

### E2E Tests

- Use Playwright or Cypress
- Test critical user journeys
- Verify OAuth integration

## Monitoring & Observability

### Recommended Tools

- **Supabase Dashboard**: Query performance, auth logs
- **Vercel Analytics**: Frontend performance
- **Sentry**: Error tracking
- **LogRocket**: Session replay

### Key Metrics

- Auth success/failure rate
- Query performance (p95, p99)
- RLS policy execution time
- API response times

## Future Enhancements

Patterns to consider adding:

1. **Invitations**: Email-based org invites
2. **Billing**: Stripe integration with usage tracking
3. **Webhooks**: Outbound event notifications
4. **API Keys**: Service account authentication
5. **Audit UI**: Dashboard for viewing events
6. **Multi-region**: Data residency compliance
7. **Soft Deletes**: Recoverable deletions
8. **Versioning**: Track entity changes over time
