"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Chip,
  Divider,
} from "@heroui/react";
import { LogOut, Building2, Users, FolderKanban } from "lucide-react";
import type { Database } from "@/types/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Membership = Database["public"]["Tables"]["memberships"]["Row"] & {
  organizations: Database["public"]["Tables"]["organizations"]["Row"];
};

interface DashboardContentProps {
  user: User | null;
  memberships: Membership[];
}

export function DashboardContent({ user, memberships }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "primary";
      case "admin":
        return "secondary";
      case "member":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={handleSignOut}
            isLoading={isLoading}
            color="danger"
            variant="light"
            startContent={!isLoading && <LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader className="flex gap-3 pb-4">
              <Avatar
                src={user?.avatar_url || undefined}
                name={user?.full_name || user?.email || "User"}
                size="lg"
              />
              <div className="flex flex-col">
                <p className="text-md font-semibold">
                  {user?.full_name || "User"}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">
                    {new Date(user?.created_at || "").toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organizations</span>
                  <span className="font-medium">{memberships.length}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <Building2 className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Organizations</h3>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">{memberships.length}</p>
              <p className="text-sm text-gray-600 mt-2">
                Active memberships across all organizations
              </p>
            </CardBody>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <FolderKanban className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">RLS Demo</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600">
                All data you see is filtered by Row Level Security policies based on your memberships
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="p-6">
          <CardHeader>
            <h2 className="text-xl font-bold">Your Organizations</h2>
          </CardHeader>
          <CardBody>
            {memberships.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  You are not a member of any organizations yet
                </p>
                <Button color="primary">Create Organization</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {memberships.map((membership) => (
                  <Card key={membership.id} className="p-4" shadow="sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={membership.organizations.name}
                          className="bg-gradient-to-br from-blue-500 to-purple-500"
                        />
                        <div>
                          <h3 className="font-semibold">
                            {membership.organizations.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            @{membership.organizations.slug}
                          </p>
                        </div>
                      </div>
                      <Chip
                        color={getRoleBadgeColor(membership.role)}
                        variant="flat"
                        size="sm"
                      >
                        {membership.role}
                      </Chip>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <CardBody>
            <h3 className="font-semibold mb-2">🔒 Security Note</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              This dashboard demonstrates Row Level Security in action. All queries are automatically
              filtered by your organization memberships at the database level. You can only see data
              for organizations where you have an active membership - no application-layer checks needed.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
