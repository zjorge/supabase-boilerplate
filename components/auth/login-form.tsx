"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Github } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("OAuth error:", error);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6">
      <CardHeader className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign in to access your dashboard
        </p>
      </CardHeader>
      <CardBody className="gap-4">
        <Button
          onClick={() => handleOAuthLogin("google")}
          isLoading={isLoading}
          variant="bordered"
          className="w-full"
          startContent={
            !isLoading && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )
          }
        >
          Continue with Google
        </Button>

        <Button
          onClick={() => handleOAuthLogin("github")}
          isLoading={isLoading}
          variant="bordered"
          className="w-full"
          startContent={!isLoading && <Github className="w-5 h-5" />}
        >
          Continue with GitHub
        </Button>

        <Divider className="my-4" />

        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardBody>
    </Card>
  );
}
