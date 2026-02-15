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
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import type { Ingredient, RecipeCardData } from "@/lib/state";
import { IngredientUnit } from "@/lib/state";
import { Textarea } from "./ui/textarea";
import { GripVerticalIcon, Trash, UploadIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { VisuallyHidden } from "radix-ui";

type IngredientEditInputProps = {
  ingredient: Ingredient;
};

function IngredientEditInput({ ingredient }: IngredientEditInputProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: ingredient.id,
      animateLayoutChanges: (args) =>
        defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    });

  return (
    <div
      className="flex h-9 w-full items-center rounded-md border border-input bg-transparent dark:bg-input/30 shadow-sm"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <GripVerticalIcon className="h-4 w-4" />
      <input
        type="number"
        step="any"
        placeholder="1"
        defaultValue={ingredient.amount}
        className="h-full w-16 rounded-l-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="h-5 w-px bg-border" />
      <Select>
        <SelectTrigger className="h-full w-20 rounded-none border-0 bg-transparent dark:bg-transparent px-3 text-sm outline-none focus:ring-0 shadow-none ">
          <SelectValue placeholder="unit" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(IngredientUnit).map((unit) => (
            <SelectItem key={unit} value={unit}>
              {unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="h-5 w-px bg-border" />
      <input
        type="text"
        placeholder="Ingredient Name"
        className="h-full flex-1 rounded-r-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0"
        defaultValue={ingredient.name}
      />
      <Button variant="ghost" size="icon-sm">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PlainTextIngredientInput() {
  // TODO: This will need to grab the text, fire it off to Gemini when it
  //       looses focus, and update the ingredients array with the resulting
  //       JSON object. (Or maybe when you hit enter?)
  return <Input type="text" placeholder="Enter ingredient info." />;
}

type EditRecipeDialogProviderProps = {
  children: React.ReactNode;
  recipe?: RecipeCardData;
};

export default function EditRecipeDialogProvider({
  children,
  recipe,
}: EditRecipeDialogProviderProps) {
  const [items, setItems] = useState<Ingredient[]>(recipe?.ingredients ?? []);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <VisuallyHidden.Root asChild>
            <DialogTitle>Edit Recipe</DialogTitle>
          </VisuallyHidden.Root>
          {recipe ? (
            <img
              src={recipe.imgUrl}
              alt={recipe.title}
              className="aspect-[4/3] w-[calc(100%+3rem)] max-w-none object-cover -mx-6 -mt-6 mb-4 rounded-t-lg"
            />
          ) : (
            <div className="aspect-[4/3] w-[calc(100%+3rem)] max-w-none flex flex-col items-center justify-center gap-2 text-muted-foreground border-2 -mx-6 -mt-6 mb-4 rounded-t-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <UploadIcon className="h-12 w-12" />
              <span className="text-sm font-medium">Upload Image</span>
            </div>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="edit-recipe-title">Name</FieldLabel>
            <Input
              id="edit-recipe-title"
              placeholder="Something Delicious"
              defaultValue={recipe?.title}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-recipe-description">
              Description
            </FieldLabel>
            <Textarea
              id="edit-recipe-description"
              placeholder="Its flavor was good, but it calls for too much lemon."
              defaultValue={recipe?.description}
            />
          </Field>
          <Field>
            <FieldLabel>Ingredients</FieldLabel>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={recipe?.ingredients.map((it) => it.id) ?? []}
                strategy={verticalListSortingStrategy}
              >
                {items.map((ingredient) => (
                  <IngredientEditInput
                    key={ingredient.id}
                    ingredient={ingredient}
                  />
                )) ?? []}
              </SortableContext>
            </DndContext>
            <PlainTextIngredientInput />
          </Field>
        </div>
        <DialogFooter className="pt-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mr-auto">
                <Trash className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Delete {recipe?.title ?? "Recipe"}
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
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              // TODO: Real state management.  This is awful.
              //       The problem is that the component caches the items
              //       list, so it stores the changed order when you click
              //       Cancel.  We do this to sync its state with the actual
              //       ingredients array.
              onClick={() => setItems(recipe?.ingredients ?? [])}
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="default"
              size="sm"
              // TODO: Ditto.  This syncs the ingredients array to the cached
              //       items list.
              onClick={() => {
                if (recipe && items.length > 0) {
                  recipe.ingredients = items;
                }
              }}
            >
              Submit
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
