import { AddRecipeCard, RecipeCard } from "@/components/RecipeCard";
import { useRecipeIds } from "@/hooks/queries";
import { createFileRoute } from "@tanstack/react-router";

function RecipesPage() {
  const { data: recipeIds } = useRecipeIds();

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

export const Route = createFileRoute("/recipes")({ component: RecipesPage });
