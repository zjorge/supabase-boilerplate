import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroUIProvider } from "@heroui/react";
import { LoginForm } from "@/components/auth/login-form";

const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: function createClient() {
    return {
      auth: {
        signInWithOAuth,
      },
    };
  },
}));

function renderWithProvider(ui: JSX.Element) {
  return render(<HeroUIProvider navigate={vi.fn()}>{ui}</HeroUIProvider>);
}

describe("LoginForm", () => {
  it("triggers Google OAuth when clicked", async () => {
    const user = userEvent.setup();

    renderWithProvider(<LoginForm />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });

    await user.click(button);

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });
});
