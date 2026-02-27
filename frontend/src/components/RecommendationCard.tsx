import { IngredientUnit } from "@/lib/state";
import { Card, CardDescription, CardTitle } from "./ui/card";
import BowlWhisk from "@/assets/bowl-whisk.svg";
import { RecipeCardFooter } from "@/components/RecipeCard";
import { useRecipe } from "@/hooks/queries";

export default function RecommendationCard({
  recipeId,
  orientation,
}: {
  recipeId: number;
  orientation: boolean;
}) {
  const recipe = useRecipe(recipeId).data!;
  return (
    <Card
      className={`flex ${orientation ? "flex-row-reverse" : "flex-row"} w-2/3 p-0 overflow-hidden`}
    >
      <img
        src={recipe.imgUrl || BowlWhisk}
        alt={recipe.title}
        className={`w-2/5 object-cover shrink-0 
                ${orientation ? "rounded-r-lg" : "rounded-l-lg"}`}
      />
      <div className="flex flex-col w-3/5 py-4 gap-2">
        <CardTitle className="px-6 font-bold select-none line-clamp-1">
          {recipe.title}
        </CardTitle>
        <div className="relative flex-1 overflow-hidden px-6">
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
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
        </div>
        <RecipeCardFooter recipeId={recipeId} />
      </div>
    </Card>
  );
}
