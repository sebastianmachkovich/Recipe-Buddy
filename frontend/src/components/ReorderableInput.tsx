import { IngredientUnit, RecipeIngredient, RecipeStep } from "@/services/api";
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
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Field, FieldLabel } from "./ui/field";
import { editRecipeContext as erc } from "./EditRecipeDialogProvider";
import { useAtom } from "jotai";

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
  item: RecipeIngredient;
  onDelete: () => void;
  onChange: (updated: RecipeIngredient) => void;
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
  item: RecipeStep;
  onDelete: () => void;
  onChange: (updated: RecipeStep) => void;
}) {
  const timeString = item.time
    ? item.time >= 60
      ? `${item.time / 60}hr ${item.time % 60}min`
      : `${item.time}min`
    : null;
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
      <div>{timeString}</div>
    </ReorderableInput>
  );
}

export function ReorderableInputField<T extends "ingredients" | "steps">({
  type,
}: {
  type: T;
}) {
  const InputComponents = {
    ingredients: IngredientEditInput,
    steps: StepEditInput,
  } as const;
  const Component = InputComponents[type];
  const isStep = type === "steps";
  const [items, setItems] = useAtom(isStep ? erc.steps : erc.ingredients);

  // Sensors for dragging the ingredient and step lists.
  const sensors = useSensors(useSensor(PointerSensor));

  // Takes a reference to a list as input, and returns the dnd-kit boilerplate
  // for reordering that list.  The elements of the list are required to have
  // an `id` property so they can be reordered.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((it) => it.id === active.id);
        const newIndex = prev.findIndex((it) => it.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  // Deletes an ingredient or step from their respective list.
  function handleDelete(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // Updates an ingredient or step in their respective list.
  function handleUpdate(updated: T) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  return (
    <Field>
      <FieldLabel>{isStep ? "Steps" : "Ingredients"}</FieldLabel>
      <div className="flex flex-col gap-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((it) => (
              <Component
                key={it.id}
                item={it}
                onDelete={() => handleDelete(it.id)}
                onChange={handleUpdate}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </Field>
  );
}
