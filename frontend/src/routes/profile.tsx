import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCuisine,
  useCurrentUser,
  useDietary,
  useAllRecipes,
  useUpdateCuisine,
  useUpdateDietary,
} from "@/hooks/queries";
import { Recipe, validateAuth } from "@/services/api";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: recipes, isLoading: isLoadingRecipes } = useAllRecipes();

  return (
    <div className="w-full p-6">
      <Card className="w-full max-w-none">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="pb-2 text-sm text-muted-foreground">
              Account details
            </p>
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="inline-block w-56 h-4" />
              ) : (
                user?.email
              )}
            </div>
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
          <UserStats recipes={recipes} isLoading={isLoadingRecipes} />
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
  const { data, isLoading } = type === "cuisine" ? useCuisine() : useDietary();
  const { mutate, isPending } =
    type === "cuisine" ? useUpdateCuisine() : useUpdateDietary();
  const savedValue = data?.value ?? "";
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(savedValue);
  }, [savedValue]);

  return (
    <div>
      <p className="pb-2 text-sm text-muted-foreground">{title}</p>
      {isLoading ? (
        <Skeleton className="w-full h-16" />
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div>
            <Button
              type="button"
              onClick={() => mutate(value)}
              disabled={isPending || value === savedValue}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserStats({
  recipes,
  isLoading,
}: {
  recipes?: Recipe[];
  isLoading: boolean;
}) {
  const stats = useMemo(() => {
    const list = recipes ?? [];
    const totalRecipes = list.length;
    const plannedRecipes = list.filter((recipe) => recipe.inPlan).length;
    const totalIngredients = list.reduce(
      (acc, recipe) => acc + (recipe.ingredients?.length ?? 0),
      0,
    );
    const totalSteps = list.reduce(
      (acc, recipe) => acc + (recipe.steps?.length ?? 0),
      0,
    );
    const rated = list.filter((recipe) => Number.isFinite(recipe.rating));
    const avgRating =
      rated.length > 0
        ? rated.reduce((acc, recipe) => acc + (recipe.rating ?? 0), 0) /
          rated.length
        : undefined;

    return {
      totalRecipes,
      plannedRecipes,
      totalIngredients,
      totalSteps,
      avgRating: avgRating ? avgRating.toFixed(1) : "-",
    };
  }, [recipes]);

  return (
    <div>
      <p className="pb-2 text-sm text-muted-foreground">Your stats</p>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Recipes" value={stats.totalRecipes} />
          <StatCard label="Planned" value={stats.plannedRecipes} />
          <StatCard label="Ingredients" value={stats.totalIngredients} />
          <StatCard label="Avg rating" value={stats.avgRating} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  beforeLoad: validateAuth,
  component: ProfilePage,
});
