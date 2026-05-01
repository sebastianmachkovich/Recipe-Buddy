import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Recipe, RecipeIngredient, RecipeStep } from "@/services/api";
import { useState } from "react";
import { ReorderableInputField } from "./ReorderableInput";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { UploadImageHeader } from "./UploadImageHeader";
import { useAddRecipe, useAllRecipes, useUpdateRecipe } from "@/hooks/queries";
import { atom, useAtom, useSetAtom } from "jotai";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Field, FieldLabel } from "./ui/field";

export const editRecipeContext = {
  name: atom(""),
  description: atom(""),
  imgUrl: atom(undefined as string | undefined),
  ingredients: atom([] as RecipeIngredient[]),
  steps: atom([] as RecipeStep[]),
  newIngredients: atom([] as string[]),
  newSteps: atom([] as string[]),
};

export function EditRecipeDialogProvider({
  children,
  recipe,
}: {
  children: React.ReactNode;
  recipe?: Recipe;
}) {
  const { data: recipes } = useAllRecipes();
  const { addRecipe } = useAddRecipe();
  const { updateRecipe } = useUpdateRecipe();

  const [name, setName] = useAtom(editRecipeContext.name);
  const [description, setDescription] = useAtom(editRecipeContext.description);
  const [imgUrl, setImgUrl] = useAtom(editRecipeContext.imgUrl);
  const [ingredients, setIngredients] = useAtom(editRecipeContext.ingredients);
  const [steps, setSteps] = useAtom(editRecipeContext.steps);
  const setNewIngredients = useSetAtom(editRecipeContext.newIngredients);
  const setNewSteps = useSetAtom(editRecipeContext.newSteps);

  // Observes whether the dialog is open.  Needed because we use a <DialogTrigger>
  // to open the it, rather than a prop.
  const [open, setOpen] = useState(false);

  // Opens the dialog if the trigger is clicked.
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Resets all state local to the component.
      setName(recipe?.name ?? "");
      setDescription(recipe?.description ?? "");
      setImgUrl(recipe?.imgUrl ?? undefined);
      setSteps(recipe?.steps ?? []);
      setIngredients(recipe?.ingredients ?? []);
      setNewIngredients([]);
      setNewSteps([]);
    }
    setOpen(newOpen);
  }

  async function handleSubmit() {
    // Does basic input validation.
    let hasErrors = false;
    if (!name) {
      toast.error("Name Required");
      hasErrors = true;
    }
    if (recipe?.name !== name && recipes!.some((it) => it.name === name)) {
      toast.error("Choose a Unique Name");
      hasErrors = true;
    }
    if (!description) {
      toast.error("Description Required");
      hasErrors = true;
    }
    ingredients.forEach((ingredient) => {
      if (!ingredient.name) {
        toast.error("Ingredient Name Required");
        hasErrors = true;
      }
    });
    steps.forEach((step) => {
      if (!step.description) {
        toast.error("Step Description Required");
        hasErrors = true;
      }
      if (
        (step.type === "background" || step.type === "blocking") &&
        !step.time
      ) {
        toast.error("Step time Required");
        hasErrors = true;
      }
    });
    if (hasErrors) return;

    // Updates the recipe in the list if it exists, or creates a new one and
    // appends it to the list.
    if (recipe) {
      updateRecipe({
        ...recipe,
        name,
        description,
        ingredients,
        steps,
        imgUrl,
      });
    } else {
      addRecipe({
        rating: 0,
        inPlan: false,
        name,
        description,
        ingredients,
        steps,
        imgUrl,
      });
    }

    // Manually closes the dialog.
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {open && (
        <DialogContent className="max-h-[calc(100vh-2rem)] grid-rows-[auto_1fr_auto]">
          <DialogDescription className="hidden">Edit Recipe</DialogDescription>
          <UploadImageHeader />
          <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden min-h-0 px-3">
            <Field>
              <FieldLabel htmlFor="name-input">Name</FieldLabel>
              <Input
                id="name-input"
                placeholder="Something Delicious"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description-input">Description</FieldLabel>
              <Textarea
                id="description-input"
                placeholder="Its flavor was good, but it calls for too much lemon."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <ReorderableInputField itemsAtom={editRecipeContext.ingredients} />
            <ReorderableInputField itemsAtom={editRecipeContext.steps} />
          </div>
          <DialogFooter className="pt-6">
            {recipe && <DeleteRecipeButton id={recipe.id} setOpen={setOpen} />}
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="default" size="sm" onClick={handleSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
