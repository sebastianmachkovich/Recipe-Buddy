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
import { ErrableTextInputField } from "./ErrableTextInputField";
import { UnparsedTextInputFieldList } from "./UnparsedTextInputFieldList";
import { ReorderableInputField } from "./ReorderableInput";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { UploadImageHeader } from "./UploadImageHeader";
import { useAddRecipe, useUpdateRecipe } from "@/hooks/queries";
import { atom, useAtom, useSetAtom } from "jotai";

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
  const { mutate: addRecipe } = useAddRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

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

  // Error states for the form fields.
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // Opens the dialog if the trigger is clicked.
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Resets all state local to the component.
      setName(recipe?.name ?? "");
      setDescription(recipe?.description ?? "");
      setImgUrl(recipe?.imgUrl ?? undefined);
      setSteps(recipe?.steps ?? []);
      setIngredients(recipe?.ingredients ?? []);
      setNameError(false);
      setDescriptionError(false);
      setNewIngredients([]);
      setNewSteps([]);
    }
    setOpen(newOpen);
  }

  async function handleSubmit() {
    // Does basic input validation.
    let hasErrors = false;
    if (!editRecipeContext.name) {
      setNameError(true);
      hasErrors = true;
    }
    if (!editRecipeContext.description) {
      setDescriptionError(true);
      hasErrors = true;
    }
    if (hasErrors) return;

    // Sends any ingredients or steps to the server to be parsed.
    // TODO: This will block while we wait for the server to parse the
    //       ingredients and steps.  The submit button's text should be
    //       replaced with a spinner and the fields should be disabled.
    //       What happens when we cancel the dialog?

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
            <ErrableTextInputField
              kind="input"
              id="edit-recipe-name"
              description="Name"
              placeholder="Something Delicious"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hasError={nameError}
              errorMsg="Name Required"
            />
            <ErrableTextInputField
              kind="textarea"
              id="edit-recipe-description"
              description="Description"
              placeholder="Its flavor was good, but it calls for too much lemon."
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              hasError={descriptionError}
              errorMsg="Description Required"
            />
            <ReorderableInputField type="ingredients" />
            <UnparsedTextInputFieldList
              placeholder="Secret Sauce..."
              listItemPlaceholder="Ingredient"
              listAtom={editRecipeContext.newIngredients}
            />
            <ReorderableInputField type="steps" />
            <UnparsedTextInputFieldList
              placeholder="Bake until done."
              listItemPlaceholder="Step"
              listAtom={editRecipeContext.newSteps}
            />
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
