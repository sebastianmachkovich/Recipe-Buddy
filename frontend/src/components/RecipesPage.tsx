import { Check, PencilIcon, PlusIcon } from "lucide-react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RecipeCardData,
  recipesAtom,
  recipeIdsOnCounterAtom,
} from "@/lib/state";
import { useAtom, useAtomValue } from "jotai";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";
import BowlWhisk from "@/assets/bowl-whisk.svg";

function AddRecipeCard() {
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

function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Card className="h-full flex flex-col pt-0 overflow-hidden select-none">
      <img
        src={recipe.imgUrl || BowlWhisk}
        alt={recipe.title}
        className="aspect-[4/3] w-full object-cover rounded-t-lg"
      />
      <CardHeader className="flex-shrink-0 px-6 pt-6">
        <CardTitle className="font-bold select-none">{recipe.title}</CardTitle>
        <div className="relative h-16 overflow-hidden">
          <CardDescription className="absolute inset-0 select-none">
            {recipe.description}
          </CardDescription>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent" />
        </div>
      </CardHeader>
      <RecipeCardFooter recipe={recipe} />
    </Card>
  );
}

export function RecipeCardFooter({ recipe }: { recipe: RecipeCardData }) {
  const [recipeIdsOnCounter, setRecipeIdsOnCounter] = useAtom(
    recipeIdsOnCounterAtom,
  );
  const isRecipeOnCounter = recipeIdsOnCounter.includes(recipe.id);

  return (
    <CardFooter className="w-full flex justify-start gap-2">
      <EditRecipeDialogProvider recipe={recipe}>
        <Button variant="outline" size="lg">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </EditRecipeDialogProvider>
      {isRecipeOnCounter ? (
        <Button
          variant="default"
          size="lg"
          className="ml-auto"
          onClick={() =>
            setRecipeIdsOnCounter(
              recipeIdsOnCounter.filter((id) => id !== recipe.id),
            )
          }
        >
          <Check className="h-4 w-4 mr-2" />
          Cooking
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          className="ml-auto"
          onClick={() =>
            setRecipeIdsOnCounter([...recipeIdsOnCounter, recipe.id])
          }
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Cook
        </Button>
      )}
    </CardFooter>
  );
}

export default function RecipesPage() {
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
