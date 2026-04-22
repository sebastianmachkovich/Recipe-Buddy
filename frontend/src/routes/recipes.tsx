import {
  AddRecipeCard,
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/RecipeCard";
import { useAllRecipes } from "@/hooks/queries";
import { cn, hashString } from "@/lib/utils";
import { validateAuth } from "@/services/api";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

function RecipesPageGrid({ children }: { children: React.ReactNode }) {
  const isNavigatingAway = useRouterState({
    select: (state) =>
      state.location.pathname === "/" ||
      state.location.pathname === "/walkthrough",
  });
  return (
    <div className={cn("container mx-auto p-6", isNavigatingAway && "hidden")}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        {children}
      </div>
    </div>
  );
}

function RecipesPage() {
  const { data: recipes, isLoading, error } = useAllRecipes();

  if (isLoading)
    return (
      <RecipesPageGrid>
        <RecipeCardSkeleton />
        <RecipeCardSkeleton />
        <RecipeCardSkeleton />
      </RecipesPageGrid>
    );
  if (error) {
    toast.error("Failed to load recipes", { description: error.message });
    return <></>;
  }

  return (
    <RecipesPageGrid>
      <AddRecipeCard />
      {recipes?.map((it) => {
        return <RecipeCard key={hashString(it.name)} recipe={it} />;
      })}
    </RecipesPageGrid>
  );
}

export const Route = createFileRoute("/recipes")({
  beforeLoad: validateAuth,
  component: RecipesPage,
});
