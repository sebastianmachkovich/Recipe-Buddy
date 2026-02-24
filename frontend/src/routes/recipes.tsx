import { AddRecipeCard, RecipeCard } from "@/components/RecipeCard";
import { recipesAtom } from "@/lib/state";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

function RecipesPage() {
  const recipes = useAtomValue(recipesAtom);
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        <AddRecipeCard />
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/recipes")({ component: RecipesPage });
