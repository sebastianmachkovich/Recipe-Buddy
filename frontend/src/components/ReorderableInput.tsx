import { Ingredient, IngredientUnit, RecipeCardData, Step } from "@/lib/state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVerticalIcon, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Field, FieldLabel } from "./ui/field";

function ReorderableInput({
  payload,
  children,
  onDelete,
}: {
  payload: {
    id: number;
  };
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: payload.id,
      animateLayoutChanges: (args) =>
        defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    });

  return (
    <div
      className="flex h-9 w-full items-center rounded-md border border-input dark:bg-input/30 shadow-sm"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <GripVerticalIcon className="h-4 w-4" />
      {children}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X className="h-4 w-4 " />
      </Button>
    </div>
  );
}

function IngredientEditInput({
  item,
  onDelete,
  onChange,
}: {
  item: Ingredient;
  onDelete: () => void;
  onChange: (updated: Ingredient) => void;
}) {
  return (
    <ReorderableInput payload={item} onDelete={onDelete}>
      <input
        type="number"
        step="any"
        placeholder="1"
        value={item.amount || ""}
        onChange={(e) =>
          onChange({
            ...item,
            amount: parseFloat(e.target.value) || 0,
          })
        }
        className="h-full w-16 rounded-l-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="h-5 w-px bg-border" />
      <Select
        value={item.unit ?? IngredientUnit.unit}
        onValueChange={(value) =>
          onChange({ ...item, unit: value as IngredientUnit })
        }
      >
        <SelectTrigger className="h-full w-20 rounded-none border-0 bg-transparent dark:bg-transparent px-3 text-sm outline-none focus:ring-0 shadow-none ">
          <SelectValue />
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
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="h-full flex-1 rounded-r-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0"
      />
    </ReorderableInput>
  );
}

function StepEditInput({
  item,
  onDelete,
  onChange,
}: {
  item: Step;
  onDelete: () => void;
  onChange: (updated: Step) => void;
}) {
  return (
    <ReorderableInput payload={item} onDelete={onDelete}>
      <input
        type="text"
        placeholder="Step Description"
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="h-full flex-1 rounded-r-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0"
      />
      <div className="h-5 w-px bg-border" />
      {item.time ? (
        <div>
          {item.time.hours}hr {item.time.minutes}min
        </div>
      ) : null}
    </ReorderableInput>
  );
}

export function ReorderableInputField({
  label,
  editedRecipe,
  setEditedRecipe,
  arrKey,
}: {
  label: string;
  editedRecipe: RecipeCardData;
  setEditedRecipe: Dispatch<SetStateAction<RecipeCardData | null>>;
  arrKey: "ingredients" | "steps";
}) {
  // Aliases that resolve the type of the input component based on the array key.
  type Which = typeof arrKey extends "steps" ? Step : Ingredient;
  type WhichInput = typeof arrKey extends "steps"
    ? typeof StepEditInput
    : typeof IngredientEditInput;

  // Maps the array key to the correct component type.
  const InputComponents = {
    ingredients: IngredientEditInput,
    steps: StepEditInput,
  } as const;
  const Component = InputComponents[arrKey] as WhichInput;

  // Sensors for dragging the ingredient and step lists.
  const sensors = useSensors(useSensor(PointerSensor));

  // Takes a reference to a list as input, and returns the dnd-kit boilerplate
  // for reordering that list.  The elements of the list are required to have
  // an `id` property so they can be reordered.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditedRecipe((prev) => {
        if (!prev) return prev;
        const oldIndex = prev[arrKey].findIndex((it) => it.id === active.id);
        const newIndex = prev[arrKey].findIndex((it) => it.id === over.id);
        return {
          ...prev,
          [arrKey]: arrayMove(prev[arrKey] as Which[], oldIndex, newIndex),
        };
      });
    }
  }

  // Deletes an ingredient or step from their respective list.
  function handleDelete(id: number) {
    setEditedRecipe((prev) =>
      prev
        ? { ...prev, [arrKey]: prev[arrKey].filter((it) => it.id !== id) }
        : prev,
    );
  }

  // Updates an ingredient or step in their respective list.
  function handleUpdate(updated: Ingredient | Step) {
    setEditedRecipe((prev) =>
      prev
        ? {
            ...prev,
            [arrKey]: prev[arrKey].map((it) =>
              it.id === updated.id ? updated : it,
            ),
          }
        : prev,
    );
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={editedRecipe[arrKey].map((it) => it.id)}
          strategy={verticalListSortingStrategy}
        >
          {editedRecipe[arrKey].map((it) => (
            <Component
              key={it.id}
              item={it as Which}
              onDelete={() => handleDelete(it.id)}
              onChange={handleUpdate}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Field>
  );
}
