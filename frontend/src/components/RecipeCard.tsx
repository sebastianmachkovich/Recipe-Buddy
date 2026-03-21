import { Check, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditRecipeDialogProvider from "@/components/EditRecipeDialogProvider";
import BowlWhisk from "@/assets/bowl-whisk.svg";
import {
  useAddToPlan,
  useRemoveFromPlan,
  usePlanIds,
  useRecipe,
} from "@/hooks/queries";
import { useMemo } from "react";
import { StarRating } from "./StarRating";

export function AddRecipeCard() {
  return (
    <EditRecipeDialogProvider>
      <Card className="h-full flex flex-col cursor-pointer hover:bg-accent/50 dark:hover:bg-input transition-colors border-2">
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <PlusIcon className="h-12 w-12" />
          <span className="text-sm font-medium select-none">Add Recipe</span>
        </div>
        <CardHeader className="flex-shrink-0"></CardHeader>
      </Card>
    </EditRecipeDialogProvider>
  );
}

export function RecipeCard({ recipeId }: { recipeId: number }) {
  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  console.log({ recipeId, recipe, isLoading, error });
  if (isLoading || !recipe) {
    return (
      <Card className="h-full flex flex-col items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center">
        <span className="text-sm text-red-500">Failed to load</span>
      </Card>
    );
  }
  console.log("Rendering RecipeCard with recipe:", recipe);
  console.log(recipe.imgUrl);
  return (
    <EditRecipeDialogProvider recipeId={recipeId}>
      <Card className="group h-full flex flex-col pt-0 overflow-hidden select-none hover:bg-accent hover:text-accent-foreground dark:bg-card dark:border-input dark:hover:bg-input cursor-pointer">
        <img
          src={recipe.imgUrl || BowlWhisk}
          alt={recipe.name}
          className="aspect-[4/3] w-full object-cover rounded-t-lg"
        />

        <CardHeader className="flex-shrink-0 px-6 pt-6">
          <CardTitle className="font-bold select-none">{recipe.name}</CardTitle>

          <div className="relative h-16 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
            <CardDescription className="absolute inset-0 select-none">
              {recipe.description}
            </CardDescription>
          </div>
        </CardHeader>

        <RecipeCardFooter recipeId={recipeId} onLeft={false} />
      </Card>
    </EditRecipeDialogProvider>
  );
}

export function RecipeCardFooter({
  recipeId,
  onLeft,
}: {
  recipeId: number;
  onLeft: boolean;
}) {
  const { data: planIds } = usePlanIds();
  const isRecipeInPlan = useMemo(
    () => planIds?.includes(recipeId),
    [planIds, recipeId],
  );
  const { mutate: addToPlan } = useAddToPlan();
  const { mutate: removeFromPlan } = useRemoveFromPlan();

  return (
    <CardFooter
      className={`w-full flex ${onLeft ? "flex-row-reverse" : "flex-row"} justify-between gap-2`}
    >
      {recipeId < 0 ? (
        <Badge variant="secondary">AI</Badge>
      ) : (
        <StarRating recipeId={recipeId} />
      )}
      {isRecipeInPlan ? (
        <Button
          variant="default"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            removeFromPlan(recipeId);
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          Cooking
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            addToPlan(recipeId);
          }}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Cook
        </Button>
      )}
    </CardFooter>
  );
}
