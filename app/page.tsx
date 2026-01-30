import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Database, Shield, Zap, Lock } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Supabase + Next.js Boilerplate
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Production-ready foundation with database-first architecture, Row Level Security, and OAuth authentication
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button
              as={Link}
              href="/login"
              color="primary"
              size="lg"
              className="font-semibold"
            >
              Get Started
            </Button>
            <Button
              as="a"
              href="https://github.com"
              target="_blank"
              variant="bordered"
              size="lg"
            >
              View on GitHub
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="p-4">
            <CardHeader className="flex flex-col items-start">
              <Database className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="text-lg font-semibold">Database-First</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PostgreSQL schema with explicit foreign keys, constraints, and defensive defaults
              </p>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-col items-start">
              <Shield className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="text-lg font-semibold">Row Level Security</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Membership-based access control enforced at the database level, not application layer
              </p>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-col items-start">
              <Lock className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="text-lg font-semibold">OAuth Ready</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google and GitHub OAuth integration with automatic user profile creation
              </p>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader className="flex flex-col items-start">
              <Zap className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="text-lg font-semibold">Type-Safe</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full TypeScript support with generated types from database schema
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Architecture Highlights</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-lg mb-2">Multi-Organization Model</h3>
                <p className="text-sm">
                  Built-in support for SaaS applications with organization-based data isolation.
                  Users can belong to multiple organizations with different roles.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Audit Trail</h3>
                <p className="text-sm">
                  Automatic event logging for sensitive operations with trigger-based audit trail.
                  All changes are tracked with user context and metadata.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Production Patterns</h3>
                <p className="text-sm">
                  Migrations as immutable history, explicit constraints, predictable triggers,
                  and security enforced at the data layer.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
