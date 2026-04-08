import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/queries";
import { validateAuth } from "@/services/api";

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
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  beforeLoad: validateAuth,
  component: ProfilePage,
});
