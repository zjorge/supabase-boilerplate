-- Row Level Security Policies
-- Implements membership-based access control for all tables

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claim.sub', true))
  )::uuid;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE organization_id = org_id
    AND user_id = auth.user_id()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function to get user's role in organization
CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS membership_role AS $$
  SELECT role FROM memberships
  WHERE organization_id = org_id
  AND user_id = auth.user_id()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function to check if user has minimum role
CREATE OR REPLACE FUNCTION public.has_role_or_higher(org_id UUID, min_role membership_role)
RETURNS BOOLEAN AS $$
  SELECT CASE 
    WHEN min_role = 'viewer' THEN get_user_role(org_id) IN ('viewer', 'member', 'admin', 'owner')
    WHEN min_role = 'member' THEN get_user_role(org_id) IN ('member', 'admin', 'owner')
    WHEN min_role = 'admin' THEN get_user_role(org_id) IN ('admin', 'owner')
    WHEN min_role = 'owner' THEN get_user_role(org_id) = 'owner'
    ELSE false
  END;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (is_organization_member(id));

-- Only owners can update organization details
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (has_role_or_higher(id, 'owner'))
  WITH CHECK (has_role_or_higher(id, 'owner'));

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (has_role_or_higher(id, 'owner'));

-- Authenticated users can create organizations (they become owners automatically via trigger)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.user_id() IS NOT NULL);

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.user_id());

-- Users can view profiles of members in their organizations
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      WHERE m1.user_id = users.id
      AND m1.organization_id IN (
        SELECT m2.organization_id FROM memberships m2
        WHERE m2.user_id = auth.user_id()
      )
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- New users can insert their own profile (handled by trigger on auth.users)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.user_id());

-- ============================================================================
-- MEMBERSHIPS POLICIES
-- ============================================================================

-- Users can view memberships in their organizations
CREATE POLICY "Users can view organization memberships"
  ON memberships FOR SELECT
  USING (is_organization_member(organization_id));

-- Admins and owners can create new memberships
CREATE POLICY "Admins can create memberships"
  ON memberships FOR INSERT
  WITH CHECK (has_role_or_higher(organization_id, 'admin'));

-- Admins can update member roles (but not their own)
CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
  USING (
    has_role_or_higher(organization_id, 'admin')
    AND user_id != auth.user_id()
  )
  WITH CHECK (
    has_role_or_higher(organization_id, 'admin')
    AND user_id != auth.user_id()
  );

-- Admins can remove members (but not themselves)
CREATE POLICY "Admins can remove memberships"
  ON memberships FOR DELETE
  USING (
    has_role_or_higher(organization_id, 'admin')
    AND user_id != auth.user_id()
  );

-- Members can remove themselves
CREATE POLICY "Members can leave organizations"
  ON memberships FOR DELETE
  USING (user_id = auth.user_id());

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Members can view projects in their organizations
CREATE POLICY "Members can view organization projects"
  ON projects FOR SELECT
  USING (is_organization_member(organization_id));

-- Members can create projects in their organizations
CREATE POLICY "Members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    is_organization_member(organization_id)
    AND owner_id = auth.user_id()
  );

-- Project owners and admins can update projects
CREATE POLICY "Owners and admins can update projects"
  ON projects FOR UPDATE
  USING (
    is_organization_member(organization_id)
    AND (
      owner_id = auth.user_id()
      OR has_role_or_higher(organization_id, 'admin')
    )
  )
  WITH CHECK (
    is_organization_member(organization_id)
    AND (
      owner_id = auth.user_id()
      OR has_role_or_higher(organization_id, 'admin')
    )
  );

-- Project owners and admins can delete projects
CREATE POLICY "Owners and admins can delete projects"
  ON projects FOR DELETE
  USING (
    is_organization_member(organization_id)
    AND (
      owner_id = auth.user_id()
      OR has_role_or_higher(organization_id, 'admin')
    )
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Members can view events in their organizations
CREATE POLICY "Members can view organization events"
  ON events FOR SELECT
  USING (is_organization_member(organization_id));

-- Events are insert-only (append-only log)
CREATE POLICY "System can insert events"
  ON events FOR INSERT
  WITH CHECK (is_organization_member(organization_id));

-- No updates or deletes allowed on events (audit integrity)
-- Events table is append-only by design

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
