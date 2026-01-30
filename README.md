# Supabase + Next.js Production Boilerplate

A production-ready reference implementation demonstrating database-first architecture with Supabase, Next.js, and TypeScript. This repository showcases how I structure full-stack applications when data integrity, security boundaries, and maintainability are non-negotiable.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Styling:** TailwindCSS + shadcn/ui
- **Auth:** OAuth (Google, GitHub) + Magic Links via Supabase Auth
- **Security:** Row Level Security (RLS) + JWT-based authorization
- **Deployment:** Vercel (frontend) + Supabase (backend)

## CI Workflow

GitHub Actions runs linting, type-checking, unit tests, and build on every PR and push to `main`.

Workflow file: `.github/workflows/ci.yml`

This is a reference implementation for database-first systems where the backend is treated as product infrastructure rather than a thin persistence layer.

Most production code I work on lives under NDA. This repo exists to make my decision-making explicit and reproducible.

## Scope and Intent

This template focuses on:

* Relational data modeling that reflects real operational workflows
* Explicit ownership and access rules enforced at the database level
* Row Level Security designed around product roles, not ad hoc checks
* Migrations as first-class artifacts
* Controlled use of triggers, scheduled jobs, and derived state

Out of scope by design:

* Complex business logic (this is a foundation, not a full product)
* Third-party integrations beyond auth providers
* Advanced caching strategies
* Multi-region deployment

The goal is clarity and demonstrable patterns, not feature completeness.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd supabase-boilerplate
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase project URL and anon key

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Visit `http://localhost:3000` and sign in with OAuth to see RLS in action.

## Conceptual Model

The model assumes a multi-organization system with shared infrastructure and isolated data boundaries.

Core concepts:

* Users authenticate externally and are mapped into the database
* Organizations own data
* Membership defines access, not user identity alone
* All access paths go through RLS, not application logic shortcuts

This structure supports SaaS products, internal platforms, and operations-heavy tools.

## Schema Overview

Main entities:

* `organizations`
  Logical ownership boundary for data.

* `users`
  Application-level user records linked to auth identities.

* `memberships`
  Join table defining user roles inside organizations.

* `projects`
  Example domain entity owned by an organization.

* `events`
  Append-only operational or audit-style records.

The schema favors explicit foreign keys, constrained enums, and defensive defaults.

## Migrations Strategy

All schema changes live in `/migrations` and are treated as immutable history.

Principles:

* No destructive changes without explicit migrations
* Constraints are added early, not deferred
* Indexes are part of the model, not an afterthought
* Naming is consistent and boring

Migrations are written to be readable months later, not just executable.

## Row Level Security (RLS)

RLS is the primary access control mechanism.

General approach:

* Default deny on all tables
* Explicit allow policies per role and operation
* Membership-based access rather than user-based shortcuts
* No reliance on client-side filtering

Policies are written to be understandable when read in isolation. If a policy needs a comment, it gets one.

The intent is that a developer can reason about access by reading SQL alone.

## Authentication and Authorization

Authentication is assumed to be handled by Supabase Auth or an external provider issuing JWTs.

Authorization is enforced in Postgres using:

* JWT claims for user identity
* Membership tables for role resolution
* RLS policies as the final authority

The application layer is not trusted to enforce security invariants.

## Triggers and Derived State

Triggers are used sparingly and only when they reduce systemic complexity.

Typical use cases:

* Maintaining denormalized counters
* Recording audit events
* Enforcing cross-table invariants
* Normalizing incoming data

Triggers should be predictable, idempotent, and easy to remove if requirements change.

## Scheduled Jobs and Automation

Scheduled jobs are treated as infrastructure tasks, not business logic.

Examples include:

* Cleanup of stale records
* Periodic reconciliation tasks
* Deferred state transitions

Jobs are written to be safe to re-run and observable.

## Design Principles

A few principles guide all decisions in this template:

* The database is part of the product surface
* Security belongs as close to the data as possible
* Explicit beats clever
* Fewer abstractions, more guarantees
* Readability matters more than terseness

## How I Use This Template

I use this repository as:

* A starting point when bootstrapping new Supabase-backed projects
* A checklist when reviewing existing schemas
* A shared reference during architecture discussions

It is intentionally small so it can be adapted rather than adopted wholesale.

## Implementation Highlights

**Database Layer:**
- Comprehensive RLS policies on all tables with membership-based access control
- Trigger-based audit logging for sensitive operations
- Enum types for role management (owner, admin, member, viewer)
- Automatic timestamp management via triggers
- Foreign key constraints with appropriate cascade behaviors

**Authentication Flow:**
- OAuth integration (Google, GitHub) via Supabase Auth
- Automatic user profile creation on first sign-in
- JWT claims mapped to database user records
- Session management with secure cookie handling

**Frontend Architecture:**
- Server Components for initial data fetching (leveraging SSR)
- Client Components only where interactivity is required
- Type-safe database queries with generated TypeScript types
- Optimistic UI updates with proper error boundaries

**Security Patterns:**
- All data access goes through RLS (no application-layer shortcuts)
- JWT validation at the database level
- CSRF protection via Supabase Auth
- Secure environment variable handling

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-related pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── auth/             # Auth-specific components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Helper functions
├── migrations/            # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   └── 003_triggers_and_functions.sql
└── types/                 # TypeScript type definitions
```

## Notes

This repo evolves slowly. Changes only happen when a real project exposes a flaw or a better pattern.

If something here looks conservative, that is usually intentional.

## License

MIT - Use this as a foundation for your own projects.
