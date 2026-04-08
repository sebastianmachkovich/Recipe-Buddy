import {
  AddRecipeCard,
  RecipeCard,
  RecipeCardSkeleton,
} from "@/components/RecipeCard";
import { useRecipeIds } from "@/hooks/queries";
import { getAuthStatus } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
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
  const { data: recipeIds, isLoading, error } = useRecipeIds();

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
      {recipeIds?.map((it) => {
        return <RecipeCard key={it} recipeId={it} />;
      })}
    </RecipesPageGrid>
  );
}

export const Route = createFileRoute("/recipes")({
  beforeLoad: async () => {
    try {
      const response = await getAuthStatus();
      if (!response.data.authenticated) {
        throw redirect({ to: "/" });
      }
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: RecipesPage,
});
