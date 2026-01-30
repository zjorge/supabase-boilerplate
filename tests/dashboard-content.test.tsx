import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroUIProvider } from "@heroui/react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { createMockMemberships, createMockUser } from "@/tests/mocks";

vi.mock("@/lib/supabase/client", () => ({
  createClient: function createClient() {
    return {
      auth: {
        signOut: vi.fn(),
      },
    };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: function useRouter() {
    return {
      push: vi.fn(),
    };
  },
}));

function renderWithProvider(ui: JSX.Element) {
  return render(<HeroUIProvider navigate={vi.fn()}>{ui}</HeroUIProvider>);
}

describe("DashboardContent", () => {
  it("renders user info and memberships", () => {
    const user = createMockUser();
    const memberships = createMockMemberships();

    renderWithProvider(
      <DashboardContent user={user} memberships={memberships} />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.getByText("Zoada Labs")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
  });

  it("renders empty state when no memberships exist", () => {
    const user = createMockUser();

    renderWithProvider(<DashboardContent user={user} memberships={[]} />);

    expect(
      screen.getByText("You are not a member of any organizations yet")
    ).toBeInTheDocument();
  });
});
