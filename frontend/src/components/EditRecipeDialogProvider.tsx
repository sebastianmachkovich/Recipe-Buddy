import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { recipesAtom, type RecipeCardData } from "@/lib/state";
import { useAtom } from "jotai";
import { useState } from "react";
import ErrableTextInputField from "./ErrableTextInputField";
import { ReorderableInputField } from "./ReorderableInput";
import { deepCopyRecipe } from "@/lib/utils";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { UploadImageHeader } from "./UploadImageHeader";

export default function EditRecipeDialogProvider({
  children,
  recipe,
}: {
  children: React.ReactNode;
  recipe?: RecipeCardData;
}) {
  // Observes whether the dialog is open.  Needed because we use a <DialogTrigger>
  // to open the it, rather than a prop.
  const [open, setOpen] = useState(false);

  // The recipes list.  Needed for updating on submit.
  const [recipes, setRecipes] = useAtom(recipesAtom);

  // A copy of the recipe that gets edited in the dialog.  Overwrites the
  // original recipe when the dialog is closed with the submit button.  It is
  // null when the "Add Recipe" button opens the dialog.
  const [editedRecipe, setEditedRecipe] = useState<RecipeCardData | null>(null);

  // Error states for the form fields.
  const [titleError, setTitleError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  // Opens the dialog if the trigger is clicked.
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Resets all state local to the component.
      const newId = Math.max(0, ...recipes.map((it) => it.id)) + 1;
      setEditedRecipe(deepCopyRecipe(recipe, newId));
      setTitleError(false);
      setDescriptionError(false);
    }
    setOpen(newOpen);
  }

  function handleSubmit() {
    if (!editedRecipe) return;

    // Does basic input validation.
    let hasErrors = false;
    if (!editedRecipe.title) {
      setTitleError(true);
      hasErrors = true;
    }
    if (!editedRecipe.description) {
      setDescriptionError(true);
      hasErrors = true;
    }
    if (hasErrors) return;

    // Updates the recipe in the list if it exists, or creates a new one and
    // appends it to the list.
    if (recipe) {
      setRecipes((prev) =>
        prev.map((it) => (it.id === recipe.id ? editedRecipe : it)),
      );
    } else {
      setRecipes((prev) => [...prev, editedRecipe]);
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
              id="edit-recipe-title"
              description="Name"
              placeholder="Something Delicious"
              value={editedRecipe.title}
              onChange={(e) =>
                setEditedRecipe((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev,
                )
              }
              hasError={titleError}
              errorMsg="Title Required"
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
            {/* TODO: Add plain text ingredient input */}
            <ReorderableInputField
              label="Steps"
              editedRecipe={editedRecipe}
              setEditedRecipe={setEditedRecipe}
              arrKey="steps"
            />
            {/* TODO: Add plain text step input */}
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
