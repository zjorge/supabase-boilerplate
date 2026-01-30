export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'archived' | 'deleted'
          owner_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived' | 'deleted'
          owner_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived' | 'deleted'
          owner_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          event_type: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          event_type: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          event_type?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_organization_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { org_id: string }
        Returns: 'owner' | 'admin' | 'member' | 'viewer'
      }
      has_role_or_higher: {
        Args: { org_id: string; min_role: 'owner' | 'admin' | 'member' | 'viewer' }
        Returns: boolean
      }
      get_organization_stats: {
        Args: { org_id: string }
        Returns: {
          member_count: number
          project_count: number
          active_project_count: number
          event_count: number
        }[]
      }
      search_projects: {
        Args: { org_id: string; search_query: string }
        Returns: Database['public']['Tables']['projects']['Row'][]
      }
    }
    Enums: {
      membership_role: 'owner' | 'admin' | 'member' | 'viewer'
      project_status: 'draft' | 'active' | 'archived' | 'deleted'
    }
  }
}
