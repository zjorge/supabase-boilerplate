import type { Database } from "@/types/database.types";

export function createMockUser(): Database["public"]["Tables"]["users"]["Row"] {
  return {
    id: "user-123",
    email: "jorge@example.com",
    full_name: "Jorge Ledezma",
    avatar_url: "https://example.com/avatar.png",
    metadata: {},
    created_at: "2024-01-15T10:00:00.000Z",
    updated_at: "2024-01-15T10:00:00.000Z",
  };
}

export function createMockMemberships(): Array<
  Database["public"]["Tables"]["memberships"]["Row"] & {
    organizations: Database["public"]["Tables"]["organizations"]["Row"];
  }
> {
  return [
    {
      id: "membership-1",
      organization_id: "org-1",
      user_id: "user-123",
      role: "owner",
      invited_by: null,
      created_at: "2024-01-15T10:00:00.000Z",
      updated_at: "2024-01-15T10:00:00.000Z",
      organizations: {
        id: "org-1",
        name: "Zoada Labs",
        slug: "zoada-labs",
        settings: {},
        created_at: "2024-01-10T08:00:00.000Z",
        updated_at: "2024-01-10T08:00:00.000Z",
      },
    },
  ];
}
