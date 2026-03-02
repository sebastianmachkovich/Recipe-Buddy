import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { type RecipeCardData } from "@/lib/state";
import { useState } from "react";
import ErrableTextInputField from "./ErrableTextInputField";
import UnparsedTextInputFieldList from "./UnparsedTextInputFieldList";
import { ReorderableInputField } from "./ReorderableInput";
import { deepCopyRecipe } from "@/lib/utils";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { UploadImageHeader } from "./UploadImageHeader";
import {
  useAddRecipe,
  useUpdateRecipe,
  useRecipe,
  useRecipeIds,
} from "@/hooks/queries";

export default function EditRecipeDialogProvider({
  children,
  recipeId,
}: {
  children: React.ReactNode;
  recipeId?: number;
}) {
  const { data: recipe } = useRecipe(recipeId);
  const { data: recipeIds } = useRecipeIds();
  const { mutate: addRecipe } = useAddRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

  // Observes whether the dialog is open.  Needed because we use a <DialogTrigger>
  // to open the it, rather than a prop.
  const [open, setOpen] = useState(false);

  // A copy of the recipe that gets edited in the dialog.  Overwrites the
  // original recipe when the dialog is closed with the submit button.  It is
  // null when the "Add Recipe" button opens the dialog.
  const [editedRecipe, setEditedRecipe] = useState<RecipeCardData | null>(null);

  // Unparsed ingredients and steps.
  const [newIngredients, setNewIngredients] = useState<string[]>([]);
  const [newSteps, setNewSteps] = useState<string[]>([]);

  // Error states for the form fields.
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // Opens the dialog if the trigger is clicked.
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Resets all state local to the component.
      const ids = recipeIds || [];
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      setEditedRecipe(deepCopyRecipe(recipe, newId));
      setNameError(false);
      setDescriptionError(false);
      setNewIngredients([]);
      setNewSteps([]);
    }
    setOpen(newOpen);
  }

  function handleSubmit() {
    if (!editedRecipe) return;

    // Does basic input validation.
    let hasErrors = false;
    if (!editedRecipe.name) {
      setNameError(true);
      hasErrors = true;
    }
    if (!editedRecipe.description) {
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
      updateRecipe(editedRecipe);
    } else {
      addRecipe(editedRecipe);
    }

    // Manually closes the dialog.
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {open && editedRecipe && (
        <DialogContent className="max-h-[calc(100vh-2rem)] grid-rows-[auto_1fr_auto]">
          <UploadImageHeader
            editedRecipe={editedRecipe}
            setEditedRecipe={setEditedRecipe}
          />
          <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden min-h-0 px-3">
            <ErrableTextInputField
              kind="input"
              id="edit-recipe-name"
              description="Name"
              placeholder="Something Delicious"
              value={editedRecipe.name}
              onChange={(e) =>
                setEditedRecipe((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
              hasError={nameError}
              errorMsg="Name Required"
            />
            <ErrableTextInputField
              kind="textarea"
              id="edit-recipe-description"
              description="Description"
              placeholder="Its flavor was good, but it calls for too much lemon."
              value={editedRecipe.description}
              onChange={(e) =>
                setEditedRecipe((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev,
                )
              }
              hasError={descriptionError}
              errorMsg="Description Required"
            />
            <ReorderableInputField
              label="Ingredients"
              editedRecipe={editedRecipe}
              setEditedRecipe={setEditedRecipe}
              arrKey="ingredients"
            />
            <UnparsedTextInputFieldList
              placeholder="Secret Sauce..."
              listItemPlaceholder="Ingredient"
              items={newIngredients}
              setItems={setNewIngredients}
            />
            <ReorderableInputField
              label="Steps"
              editedRecipe={editedRecipe}
              setEditedRecipe={setEditedRecipe}
              arrKey="steps"
            />
            <UnparsedTextInputFieldList
              placeholder="Bake until done."
              listItemPlaceholder="Step"
              items={newSteps}
              setItems={setNewSteps}
            />
          </div>
          <DialogFooter className="pt-6">
            {recipe && (
              <DeleteRecipeButton
                editedRecipe={editedRecipe}
                setOpen={setOpen}
              />
            )}
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
