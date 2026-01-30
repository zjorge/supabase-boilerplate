# Contributing Guide

This boilerplate is designed as a reference implementation and portfolio piece. While it's not actively seeking contributions, this guide explains the patterns and conventions used.

## Code Style

### TypeScript

- Strict mode enabled
- Explicit types preferred over inference where it improves readability
- Interfaces over types for object shapes
- No `any` types

### React/Next.js

- Server Components by default
- Client Components only when needed (`'use client'`)
- Functional components only
- Named exports for components

### Database

- Migrations are immutable
- Never modify existing migrations
- All schema changes require new migration files
- RLS policies are explicit and documented

## Project Conventions

### File Naming

- `kebab-case` for files and directories
- `PascalCase` for component files
- `camelCase` for utility functions

### Component Structure

```typescript
// 1. Imports
import { ... } from '...'

// 2. Types
interface ComponentProps {
  ...
}

// 3. Component
export function Component({ ... }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()
  
  // 5. Handlers
  const handleClick = () => {}
  
  // 6. Render
  return (...)
}
```

### Database Patterns

**Table Creation:**
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS Policy:**
```sql
CREATE POLICY "descriptive_name"
  ON table_name
  FOR operation
  USING (condition)
  WITH CHECK (condition);
```

## Adding Features

### New Database Table

1. Create migration file: `migrations/00X_feature_name.sql`
2. Define table with constraints
3. Add RLS policies
4. Add triggers if needed
5. Update `types/database.types.ts`
6. Test policies with different user contexts

### New Page/Route

1. Create in `app/` directory
2. Use Server Component for data fetching
3. Extract interactive parts to Client Components
4. Add to navigation if needed

### New Component

1. Create in appropriate `components/` subdirectory
2. Add TypeScript interface for props
3. Use HeroUI components for consistency
4. Document complex logic with comments

## Testing Checklist

Before considering a feature complete:

- [ ] TypeScript compiles without errors
- [ ] RLS policies tested with different user roles
- [ ] OAuth flow works end-to-end
- [ ] Responsive design verified
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] Accessibility checked (keyboard navigation, ARIA)

## Database Migration Workflow

```bash
# Create new migration
supabase migration new feature_name

# Edit the generated file
# migrations/YYYYMMDDHHMMSS_feature_name.sql

# Test locally
supabase db reset

# If good, push to production
supabase db push
```

## Commit Messages

Follow conventional commits:

```
feat: add user invitation system
fix: correct RLS policy for projects
docs: update setup guide
refactor: simplify auth callback
```

## Pull Request Template

If you're forking and want to contribute back:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] RLS policies verified
- [ ] TypeScript compiles
- [ ] No console errors

## Screenshots (if applicable)
```

## Questions?

This is a reference implementation. For questions about patterns or decisions, see:
- `ARCHITECTURE.md` for design rationale
- `SETUP.md` for configuration details
- SQL files for database patterns
