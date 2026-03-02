import { RecipeCardData } from "@/lib/state";
import { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Trash } from "lucide-react";
import { useRemoveRecipe } from "@/hooks/queries";

export function DeleteRecipeButton({
  editedRecipe,
  setOpen,
}: {
  editedRecipe: RecipeCardData;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { mutate: removeRecipe } = useRemoveRecipe();
  // Deletes the recipe from the list and closes the dialog.
  function handleDeleteRecipe() {
    removeRecipe(editedRecipe.id);
    setOpen(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mr-auto">
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Delete {editedRecipe.name}?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this recipe?
          </DialogDescription>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteRecipe}
              >
                Delete
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
