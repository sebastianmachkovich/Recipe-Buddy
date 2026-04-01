import { AddRecipeCard, RecipeCard } from "@/components/RecipeCard";
import { useRecipeIds } from "@/hooks/queries";
import { getAuthStatus } from "@/services/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

function RecipesPage() {
  const { data: recipeIds, isLoading, error } = useRecipeIds();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading recipes</div>;
  if (!recipeIds) return <div>No recipes found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        <AddRecipeCard />
        {recipeIds.map((it) => {
          return <RecipeCard key={it} recipeId={it} />;
        })}
      </div>
    </div>
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
