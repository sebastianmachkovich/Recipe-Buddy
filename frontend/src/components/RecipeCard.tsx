import { Check, PlusIcon, TriangleAlert } from "lucide-react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditRecipeDialogProvider } from "@/components/EditRecipeDialogProvider";
import BowlWhisk from "@/assets/bowl-whisk.svg";
import {
  useAddToPlan,
  useRemoveFromPlan,
  usePlanIds,
  useRecipe,
} from "@/hooks/queries";
import { useMemo } from "react";
import { StarRating } from "./StarRating";
import { Skeleton } from "./ui/skeleton";

export function AddRecipeCard() {
  return (
    <EditRecipeDialogProvider>
      <Card className="h-full flex flex-col cursor-pointer hover:bg-accent/50 dark:hover:bg-input transition-colors border-2">
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <PlusIcon className="h-12 w-12" />
          <span className="text-sm font-medium select-none">Add Recipe</span>
        </div>
      </Card>
    </EditRecipeDialogProvider>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="group h-full flex flex-col pt-0 overflow-hidden select-none dark:bg-card dark:border-input">
      <Skeleton className="aspect-4/3 w-full object-cover rounded-t-lg" />
      <CardHeader className="shrink-0 px-6 pt-6">
        <CardTitle className="font-bold select-none">
          <Skeleton className="w-1/2 h-4" />
        </CardTitle>
        <div className="relative h-16 overflow-hidden mask-[linear-gradient(to_bottom,black_70%,transparent_100%)]">
          <CardDescription className="absolute inset-0 select-none flex flex-col gap-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="flex flex-row-reverse">
        <Skeleton className="w-1/3 h-10" />
      </CardFooter>
    </Card>
  );
}

function RecipeCardError() {
  return (
    <Card className="group h-full flex flex-col pt-0 overflow-hidden select-none dark:bg-card dark:border-input text-destructive">
      <TriangleAlert className="h-12 w-12" />
      <div>Failed to load</div>
    </Card>
  );
}

export function RecipeCard({ recipeId }: { recipeId: number }) {
  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  if (isLoading || !recipe) {
    return <RecipeCardSkeleton />;
  }
  if (error) {
    return <RecipeCardError />;
  }

  const imageSrc = recipe.imgUrl || BowlWhisk;

  return (
    <EditRecipeDialogProvider recipeId={recipeId}>
      <Card className="group h-full flex flex-col pt-0 overflow-hidden select-none hover:bg-accent hover:text-accent-foreground dark:bg-card dark:border-input dark:hover:bg-input cursor-pointer">
        <img
          src={imageSrc}
          alt={recipe.name}
          className="aspect-4/3 w-full object-cover rounded-t-lg"
        />

        <CardHeader className="shrink-0 px-6 pt-6">
          <CardTitle className="font-bold select-none">{recipe.name}</CardTitle>

          <div className="relative h-16 overflow-hidden mask-[linear-gradient(to_bottom,black_70%,transparent_100%)]">
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
  const { data: planIds } = usePlanIds(false);
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
      <StarRating recipeId={recipeId} />
      <Button
        variant="default"
        size="lg"
        onClick={(e) => {
          e.stopPropagation();
          if (isRecipeInPlan) removeFromPlan(recipeId);
          else addToPlan(recipeId);
        }}
      >
        {isRecipeInPlan ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <PlusIcon className="h-4 w-4 mr-2" />
        )}
        {isRecipeInPlan ? "Cooking" : "Cook"}
      </Button>
    </CardFooter>
  );
}
