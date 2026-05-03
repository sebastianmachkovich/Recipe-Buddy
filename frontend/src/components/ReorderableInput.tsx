import {
  IngredientUnit,
  RecipeIngredient,
  RecipeStep,
  RecipeStepType,
} from "@/services/api";
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
import {
  Clock,
  GripVerticalIcon,
  PlusIcon,
  OctagonPause,
  TimerOff,
  Utensils,
  X,
} from "lucide-react";
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
import { PrimitiveAtom, useAtom } from "jotai";
import { editRecipeContext as erc } from "./EditRecipeDialogProvider";

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
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <GripVerticalIcon className="h-4 w-4 cursor-grab" {...listeners} />
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

const iconMap = {
  [RecipeStepType.background]: <Clock className="h-4 w-4" />,
  [RecipeStepType.blocking]: <OctagonPause className="h-4 w-4" />,
  [RecipeStepType.untimed]: <TimerOff className="h-4 w-4" />,
};

function StepEditInput({
  item,
  onDelete,
  onChange,
}: {
  item: RecipeStep;
  onDelete: () => void;
  onChange: (updated: RecipeStep) => void;
}) {
  return (
    <ReorderableInput payload={item} onDelete={onDelete}>
      <Select
        value={item.type ?? RecipeStepType.untimed}
        onValueChange={(value) =>
          onChange({ ...item, type: value as RecipeStepType })
        }
      >
        <SelectTrigger className="h-full w-16 rounded-none border-0 bg-transparent dark:bg-transparent px-3 text-sm outline-none focus:ring-0 shadow-none ">
          <SelectValue>
            {iconMap[item.type ?? RecipeStepType.untimed]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(RecipeStepType).map((type) => (
            <SelectItem key={type} value={type}>
              {iconMap[type]}
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-5 w-px bg-border" />

      {(item.type === RecipeStepType.blocking ||
        item.type === RecipeStepType.background) && (
        <>
          <div className="relative w-20">
            <input
              type="number"
              step="any"
              placeholder="1"
              value={item.time || undefined}
              onChange={(e) =>
                onChange({
                  ...item,
                  time: parseInt(e.target.value) || 0,
                })
              }
              className="h-full w-full rounded-l-md border-0 bg-transparent pl-3 pr-10 text-sm outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground pointer-events-none">
              min
            </span>
          </div>
          <div className="h-5 w-px bg-border" />
        </>
      )}

      <input
        type="text"
        placeholder="Step Description"
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="h-full flex-1 rounded-r-md border-0 bg-transparent px-3 text-sm outline-none focus-visible:ring-0"
      />
      <div className="h-5 w-px bg-border" />
    </ReorderableInput>
  );
}

export function ReorderableInputField({
  itemsAtom,
}: {
  itemsAtom: PrimitiveAtom<RecipeIngredient[]> | PrimitiveAtom<RecipeStep[]>;
}) {
  const isSteps = itemsAtom === erc.steps;
  const Component = isSteps ? StepEditInput : IngredientEditInput;
  const [items, setItems] = useAtom(itemsAtom);

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

  // Adds an ingredient or step to their respective list.
  function handleAdd() {
    if (isSteps) {
      setItems((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((it) => it.id)) + 1,
          type: RecipeStepType.untimed,
          description: "",
          time: undefined,
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((it) => it.id)) + 1,
          name: "",
          amount: 1,
          unit: IngredientUnit.unit,
        },
      ]);
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
      <FieldLabel>{isSteps ? "Steps" : "Ingredients"}</FieldLabel>
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
        <Button variant="outline" onClick={() => handleAdd()}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </Field>
  );
}
