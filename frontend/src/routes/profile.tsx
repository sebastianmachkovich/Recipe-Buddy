import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/queries";
import { authAPI } from "@/services/api";

function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Account details</p>
          <div>
            <span className="font-medium">Email:</span>{" "}
            {user?.email ?? "Unknown"}
          </div>
          <div>
            <span className="font-medium">User ID:</span>{" "}
            {user?.id ?? "Unknown"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    try {
      const response = await authAPI.status();
      if (!response.data.authenticated) {
        throw redirect({ to: "/" });
      }
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: ProfilePage,
});
