-- Triggers and Functions
-- Automated timestamp updates, audit logging, and business logic

-- ============================================================================
-- TIMESTAMP MANAGEMENT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- USER PROFILE CREATION
-- ============================================================================

-- Automatically create user profile when auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ORGANIZATION OWNERSHIP
-- ============================================================================

-- Automatically create owner membership when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (NEW.id, auth.user_id(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_organization();

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Function to log events for important operations
CREATE OR REPLACE FUNCTION public.log_event(
  p_organization_id UUID,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (
    organization_id,
    user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_organization_id,
    auth.user_id(),
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log project creation
CREATE OR REPLACE FUNCTION public.log_project_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_event(
    NEW.organization_id,
    'project.created',
    'project',
    NEW.id,
    jsonb_build_object(
      'project_name', NEW.name,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_created();

-- Log project status changes
CREATE OR REPLACE FUNCTION public.log_project_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM log_event(
      NEW.organization_id,
      'project.status_changed',
      'project',
      NEW.id,
      jsonb_build_object(
        'project_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_updated
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_updated();

-- Log membership changes
CREATE OR REPLACE FUNCTION public.log_membership_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email FROM users WHERE id = NEW.user_id;
  
  PERFORM log_event(
    NEW.organization_id,
    'membership.created',
    'membership',
    NEW.id,
    jsonb_build_object(
      'user_email', v_user_email,
      'role', NEW.role
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_membership_created
  AFTER INSERT ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_membership_created();

-- ============================================================================
-- DATA VALIDATION
-- ============================================================================

-- Prevent last owner from leaving organization
CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_count INTEGER;
BEGIN
  IF OLD.role = 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM memberships
    WHERE organization_id = OLD.organization_id
    AND role = 'owner'
    AND id != OLD.id;
    
    IF v_owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from an organization';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_owner
  BEFORE DELETE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

-- Prevent owner from demoting themselves if they're the last owner
CREATE OR REPLACE FUNCTION public.prevent_last_owner_demotion()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_count INTEGER;
BEGIN
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM memberships
    WHERE organization_id = OLD.organization_id
    AND role = 'owner'
    AND id != OLD.id;
    
    IF v_owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last owner of an organization';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_owner_demotion
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_demotion();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION public.get_organization_stats(org_id UUID)
RETURNS TABLE (
  member_count BIGINT,
  project_count BIGINT,
  active_project_count BIGINT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM memberships WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM projects WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM projects WHERE organization_id = org_id AND status = 'active'),
    (SELECT COUNT(*) FROM events WHERE organization_id = org_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to search projects (demonstrates full-text search)
CREATE OR REPLACE FUNCTION public.search_projects(
  org_id UUID,
  search_query TEXT
)
RETURNS SETOF projects AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM projects p
  WHERE p.organization_id = org_id
  AND (
    p.name ILIKE '%' || search_query || '%'
    OR p.description ILIKE '%' || search_query || '%'
  )
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
