import { Check, PencilIcon, PlusIcon } from "lucide-react";
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

export function AddRecipeCard() {
  return (
    <EditRecipeDialogProvider>
      <Card className="h-full flex flex-col cursor-pointer hover:bg-accent/50 transition-colors border-2">
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
  const { data: recipe } = useRecipe(recipeId);

  return (
    <Card className="h-full flex flex-col pt-0 overflow-hidden select-none">
      <img
        src={recipe!.imgUrl || BowlWhisk}
        alt={recipe!.title}
        className="aspect-[4/3] w-full object-cover rounded-t-lg"
      />
      <CardHeader className="flex-shrink-0 px-6 pt-6">
        <CardTitle className="font-bold select-none">{recipe!.title}</CardTitle>
        <div className="relative h-16 overflow-hidden">
          <CardDescription className="absolute inset-0 select-none">
            {recipe!.description}
          </CardDescription>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent" />
        </div>
      </CardHeader>
      <RecipeCardFooter recipeId={recipeId} />
    </Card>
  );
}

export function RecipeCardFooter({ recipeId }: { recipeId: number }) {
  const { data: planIds } = usePlanIds();
  const isRecipeOnCounter = useMemo(
    () => planIds?.includes(recipeId),
    [planIds, recipeId],
  );
  const { mutate: addToPlan } = useAddToPlan();
  const { mutate: removeFromPlan } = useRemoveFromPlan();

  return (
    <CardFooter className="w-full flex justify-start gap-2">
      <EditRecipeDialogProvider recipeId={recipeId}>
        <Button variant="outline" size="lg">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </EditRecipeDialogProvider>
      {isRecipeOnCounter ? (
        <Button
          variant="default"
          size="lg"
          className="ml-auto"
          onClick={() => removeFromPlan(recipeId)}
        >
          <Check className="h-4 w-4 mr-2" />
          Cooking
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          className="ml-auto"
          onClick={() => addToPlan(recipeId)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Cook
        </Button>
      )}
    </CardFooter>
  );
}
