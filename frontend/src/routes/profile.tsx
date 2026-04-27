import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCuisine,
  useCurrentUser,
  useDietary,
  useUpdateCuisine,
  useUpdateDietary,
} from "@/hooks/queries";
import { validateAuth } from "@/services/api";
import { Textarea } from "@/components/ui/textarea";

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
        <CardContent className="space-y-6">
          <div>
            <p className="pb-2 text-sm text-muted-foreground">
              Account details
            </p>
            <span className="font-medium">Email:</span>{" "}
            {user?.email ?? "Unknown"}
          </div>

          <PreferenceEntry
            title="Cuisine Preferences"
            placeholder="Enter your cuisine preferences."
            type="cuisine"
          />
          <PreferenceEntry
            title="Dietary Preferences"
            placeholder="Enter your dietary restrictions."
            type="dietary"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceEntry({
  title,
  placeholder,
  type,
}: {
  title: string;
  placeholder: string;
  type: "cuisine" | "dietary";
}) {
  const { data } = type === "cuisine" ? useCuisine() : useDietary();
  const { mutate } =
    type === "cuisine" ? useUpdateCuisine() : useUpdateDietary();

  return (
    <div>
      <p className="pb-2 text-sm text-muted-foreground">{title}</p>
      <Textarea
        placeholder={placeholder}
        onBlur={(e) => {
          if (e.target.value !== data) mutate(e.target.value);
        }}
      >
        {data ?? ""}
      </Textarea>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  beforeLoad: validateAuth,
  component: ProfilePage,
});
