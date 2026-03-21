import { IngredientUnit } from "@/lib/state";
import { Card, CardDescription, CardTitle } from "./ui/card";
import BowlWhisk from "@/assets/bowl-whisk.svg";
import { RecipeCardFooter } from "@/components/RecipeCard";
import { useRecipe } from "@/hooks/queries";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";
import { Skeleton } from "./ui/skeleton";

export default function RecommendationCard({
  recipeId,
  orientation,
}: {
  recipeId: number;
  orientation: boolean;
}) {
  const { data: recipe, isLoading } = useRecipe(recipeId);
  if (isLoading || !recipe) return <RecommendationCardSkeleton />;
  return (
    <EditRecipeDialogProvider recipeId={recipeId}>
      <Card
        className={`flex ${orientation ? "flex-row-reverse" : "flex-row"} w-2/3 p-0 overflow-hidden cursor-pointer`}
      >
        <img
          src={recipe.imgUrl || BowlWhisk}
          alt={recipe.name}
          className={`w-2/5 object-cover shrink-0 
                ${orientation ? "rounded-r-lg" : "rounded-l-lg"}`}
        />
        <div className="flex flex-col w-3/5 py-4 gap-2">
          <CardTitle className="px-6 font-bold select-none line-clamp-1">
            {recipe.name}
          </CardTitle>
          <div className="relative flex-1 overflow-hidden px-6 mask-[linear-gradient(to_bottom,black_80%,transparent_100%)]">
            <CardDescription className="select-none">
              <p>{recipe.description}</p>
              {recipe.ingredients.length > 0 && (
                <>
                  <p className="py-2">
                    <strong>Ingredients:</strong>
                  </p>
                  <ul>
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        {ingredient.amount}{" "}
                        {ingredient.unit === IngredientUnit.unit
                          ? ""
                          : ingredient.unit}{" "}
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardDescription>
          </div>
          <RecipeCardFooter recipeId={recipeId} onLeft={orientation} />
        </div>
      </Card>
    </EditRecipeDialogProvider>
  );
}

function RecommendationCardSkeleton() {
  return (
    <Card className={`flex flex-row w-2/3 p-0 overflow-hidden`}>
      <Skeleton className={`w-2/5 object-cover shrink-0 h-72 rounded-r-none`} />
      <div className="flex flex-col w-3/5 py-4 gap-2">
        <CardTitle className="px-6 font-bold select-none line-clamp-1">
          <Skeleton className="w-1/2 h-6" />
        </CardTitle>
        <div className="relative flex-1 overflow-hidden px-6">
          <CardDescription className="select-none">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/4 h-4" />
            </div>
          </CardDescription>
        </div>
      </div>
    </Card>
  );
}
